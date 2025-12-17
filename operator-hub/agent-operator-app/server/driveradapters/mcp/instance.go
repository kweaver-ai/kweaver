package mcp

import (
	"net/http"

	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func (h *mcpHnadle) CreateMCPInstance(c *gin.Context) {
	var err error
	req := &interfaces.MCPDeployCreateRequest{}
	err = c.ShouldBindJSON(req)
	if err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	res, err := h.mcpService.CreateMCPInstance(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, res)
}

func (h *mcpHnadle) DeleteMCPInstance(c *gin.Context) {
	var err error
	req := &interfaces.MCPDeleteRequest{}
	err = c.ShouldBindUri(req)
	if err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = h.mcpService.DeleteMCPInstance(c.Request.Context(), req.MCPID, req.Version)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, nil)
}

func (h *mcpHnadle) UpdateMCPInstance(c *gin.Context) {
	var err error
	req := &interfaces.MCPDeployUpdateRequest{}
	err = c.ShouldBindJSON(req)
	if err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	err = c.ShouldBindUri(req)
	if err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	res, err := h.mcpService.UpdateMCPInstance(c.Request.Context(), req.MCPID, req.Version, req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	rest.ReplyOK(c, http.StatusOK, res)
}
