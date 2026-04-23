// Package common 公共模块操作接口
package common

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/config"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/errors"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/rest"

	"github.com/creasty/defaults"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/validator"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/logics/impex"
)

type ImpexHandler interface {
	Export(c *gin.Context)
	Import(c *gin.Context)
	ImportInternal(c *gin.Context)
}

var (
	impexHandlerOnce sync.Once
	impexH           ImpexHandler
)

type impexHandler struct {
	Logger               interfaces.Logger
	ComponentImpexConfig interfaces.IComponentImpexConfig
	Validator            interfaces.Validator
}

// NewImpexHandler 导入导出操作接口
func NewImpexHandler() ImpexHandler {
	impexHandlerOnce.Do(func() {
		confLoader := config.NewConfigLoader()
		impexH = &impexHandler{
			Logger:               confLoader.GetLogger(),
			ComponentImpexConfig: impex.NewComponentImpexManager(),
			Validator:            validator.NewValidator(),
		}
	})
	return impexH
}

// Export 导出
func (impexH *impexHandler) Export(c *gin.Context) {
	var err error
	req := &interfaces.ExportConfigReq{}
	if err = c.ShouldBindHeader(req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	if err = c.ShouldBindUri(req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	err = impexH.Validator.ValidatorStruct(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	config, err := impexH.ComponentImpexConfig.ExportConfig(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	filename := fmt.Sprintf("%s_export_%s.adp", req.Type, time.Now().Format("20060102_150405"))
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	rest.ReplyOK(c, http.StatusOK, config)
}

// Import 导入
func (impexH *impexHandler) Import(c *gin.Context) {
	req := &interfaces.ImportConfigReq{}
	if err := impexH.bindMultipartImportRequest(c, req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	if err := impexH.ComponentImpexConfig.ImportConfig(c.Request.Context(), req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusCreated, nil)
}

// ImportInternal 内部导入
func (impexH *impexHandler) ImportInternal(c *gin.Context) {
	req := &interfaces.InternalImportConfigReq{}
	if err := impexH.bindMultipartImportRequest(c, req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	if err := impexH.Validator.ValidatorIntCompVersion(c.Request.Context(), req.PackageVersion); err != nil {
		rest.ReplyError(c, err)
		return
	}
	resp, err := impexH.ComponentImpexConfig.ImportConfigInternal(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusCreated, resp)
}

func (impexH *impexHandler) bindMultipartImportRequest(c *gin.Context, req any) error {
	if err := c.ShouldBindHeader(req); err != nil {
		return err
	}
	if err := c.ShouldBindUri(req); err != nil {
		return err
	}
	if c.ContentType() != "multipart/form-data" {
		return errors.DefaultHTTPError(c.Request.Context(), http.StatusUnsupportedMediaType, "Content-Type must be multipart/form-data")
	}
	if err := c.ShouldBindWith(req, binding.Form); err != nil {
		return errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	data, err := readMultipartFormFile(c, "data")
	if err != nil {
		return err
	}
	if err := defaults.Set(req); err != nil {
		return errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	if err := setRawData(req, data); err != nil {
		return errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	if err := impexH.Validator.ValidatorStruct(c.Request.Context(), req); err != nil {
		return err
	}
	return nil
}

func readMultipartFormFile(c *gin.Context, field string) (json.RawMessage, error) {
	file, err := c.FormFile(field)
	if err != nil {
		return nil, errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	fileContent, err := file.Open()
	if err != nil {
		return nil, errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	defer func() {
		_ = fileContent.Close()
	}()
	buf := new(bytes.Buffer)
	if _, err = buf.ReadFrom(fileContent); err != nil {
		return nil, errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
	}
	return buf.Bytes(), nil
}

func setRawData(req any, data json.RawMessage) error {
	switch typed := req.(type) {
	case *interfaces.ImportConfigReq:
		typed.Data = data
	case *interfaces.InternalImportConfigReq:
		typed.Data = data
	default:
		return fmt.Errorf("unsupported import request type")
	}
	return nil
}
