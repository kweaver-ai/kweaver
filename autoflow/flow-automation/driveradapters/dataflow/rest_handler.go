package dataflow

import (
	"encoding/json"
	"io"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/middleware"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/errors"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/logics/mgnt"
	"github.com/gin-gonic/gin"
)

type RESTHandler interface {
	RegisterAPI(engine *gin.RouterGroup)
}

var (
	once sync.Once
	rh   RESTHandler
)

var (
	createFlowParamsSchema = "dataflow/create.json"
	updateFlowParamsSchema = "dataflow/update.json"
)

type DataFlowHandler struct {
	config     *common.Config
	hydra      drivenadapters.HydraPublic
	hydraAdmin drivenadapters.HydraAdmin
	userMgnt   drivenadapters.UserManagement
	mgnt       mgnt.MgntHandler
}

func NewRESTHandler() RESTHandler {
	once.Do(func() {
		rh = &DataFlowHandler{
			config:     common.NewConfig(),
			hydra:      drivenadapters.NewHydraPublic(),
			hydraAdmin: drivenadapters.NewHydraAdmin(),
			userMgnt:   drivenadapters.NewUserManagement(),
			mgnt:       mgnt.NewMgnt(),
		}
	})

	return rh
}

// RegisterAPI 注册API
func (h *DataFlowHandler) RegisterAPI(engine *gin.RouterGroup) {
	engine.POST("/flow", middleware.TokenAuth(), middleware.CheckIsApp(), middleware.CheckBizDomainID(), h.create)
	engine.PUT("/flow/:id", middleware.TokenAuth(), h.update)
	engine.DELETE("/flow/:id", middleware.TokenAuth(), middleware.CheckBizDomainID(), h.delete)
}

func (h *DataFlowHandler) create(c *gin.Context) {
	user, _ := c.Get("user")
	userInfo := user.(*drivenadapters.UserInfo)

	data, _ := io.ReadAll(c.Request.Body)

	err := common.JSONSchemaValid(data, createFlowParamsSchema)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}

	var param mgnt.CreateDataFlowReq
	err = json.Unmarshal(data, &param)

	if err != nil {
		c.JSON(http.StatusBadRequest, errors.NewIError(errors.InvalidParameter, "", []interface{}{err.Error()}))
		return
	}

	var dagID string
	param.BizDomainID = c.GetString("bizDomainID")
	dagID, err = h.mgnt.CreateDataFlow(c.Request.Context(), &param, userInfo)

	if err != nil {
		errors.ReplyError(c, err)
		return
	}

	c.Writer.Header().Set("Location", "/api/automation/v1/data-flow/"+dagID)
	c.JSON(http.StatusCreated, gin.H{
		"id": dagID,
	})
}

func (h *DataFlowHandler) update(c *gin.Context) {
	dagID := c.Param("id")
	user, _ := c.Get("user")
	userInfo := user.(*drivenadapters.UserInfo)

	data, _ := io.ReadAll(c.Request.Body)

	err := common.JSONSchemaValid(data, updateFlowParamsSchema)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}

	var param mgnt.UpdateDataFlowReq
	err = json.Unmarshal(data, &param)

	if err != nil {
		c.JSON(http.StatusBadRequest, errors.NewIError(errors.InvalidParameter, "", []interface{}{err.Error()}))
		return
	}

	err = h.mgnt.UpdateDataFlow(c.Request.Context(), dagID, &param, userInfo)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *DataFlowHandler) delete(c *gin.Context) {
	dagID := c.Param("id")
	user, _ := c.Get("user")
	bizDomainID := c.GetString("bizDomainID")
	userInfo := user.(*drivenadapters.UserInfo)

	err := h.mgnt.DeleteDataFlow(c.Request.Context(), dagID, bizDomainID, userInfo)
	if err != nil {
		errors.ReplyError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
