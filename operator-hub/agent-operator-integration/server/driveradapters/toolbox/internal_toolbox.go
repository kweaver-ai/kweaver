package toolbox

import (
	"bytes"
	"mime/multipart"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	"github.com/creasty/defaults"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

// CreateInternalToolBox 添加内置工具
func (h *toolBoxHandler) CreateInternalToolBox(c *gin.Context) {
	req := &interfaces.CreateInternalToolBoxReq{}
	ctx := c.Request.Context()
	err := c.ShouldBindHeader(req)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	switch c.ContentType() {
	case "application/json":
		err = utils.GetBindJSONRaw(c, req)
	case "application/x-www-form-urlencoded":
		err = c.ShouldBind(req)
		if err != nil {
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
		}
	case "multipart/form-data":
		err = c.ShouldBindWith(req, binding.Form)
		if err != nil {
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
			rest.ReplyError(c, err)
			return
		}
		var file *multipart.FileHeader
		file, err = c.FormFile("data")
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			rest.ReplyError(c, err)
			return
		}
		var fileContent multipart.File
		// TODO: 检查文件大小
		fileContent, err = file.Open()
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			rest.ReplyError(c, err)
			return
		}
		defer func() {
			_ = fileContent.Close()
		}()
		buf := new(bytes.Buffer)
		if _, err = buf.ReadFrom(fileContent); err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
			rest.ReplyError(c, err)
			return
		}
		req.Data = buf.Bytes()
	default:
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, "content type not supported")
	}
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	err = defaults.Set(req)
	if err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	req.IsPublic = c.GetHeader(string(interfaces.IsPublic)) == "true"
	if req.IsPublic && req.UserID == "" {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, "invalid user_id")
		rest.ReplyError(c, err)
		return
	}
	if req.MetadataType != interfaces.MetadataTypeAPI {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "invalid metadata type")
		rest.ReplyError(c, err)
		return
	}
	// 检查名字
	err = h.Validator.ValidatorToolBoxName(ctx, req.BoxName)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	err = h.Validator.ValidatorToolBoxDesc(ctx, req.BoxDesc)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 检查工具箱ID是否合法
	err = h.Validator.ValidatorIntCompVersion(ctx, req.ConfigVersion)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	resp, err := h.ToolService.CreateInternalToolBox(ctx, req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, resp)
}
