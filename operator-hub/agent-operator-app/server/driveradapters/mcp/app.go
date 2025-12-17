package mcp

import (
	"net/http"

	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func (h *mcpHnadle) StreamHandler(c *gin.Context) {
	var req interfaces.MCPAppRequest
	if err := c.ShouldBindUri(&req); err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err := validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 获取mcp实例
	instance, err := h.mcpService.GetMCPInstance(c.Request.Context(), req.MCPID, req.Version)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 代理stream请求
	instance.StreamServer.ServeHTTP(c.Writer, c.Request)
}

func (h *mcpHnadle) SSEHandler(c *gin.Context) {
	var req interfaces.MCPAppRequest
	if err := c.ShouldBindUri(&req); err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err := validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 获取mcp实例
	instance, err := h.mcpService.GetMCPInstance(c.Request.Context(), req.MCPID, req.Version)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 代理sse请求
	instance.SSEServer.SSEHandler().ServeHTTP(c.Writer, c.Request)
}

func (h *mcpHnadle) MessageHandler(c *gin.Context) {
	var req interfaces.MCPAppRequest
	if err := c.ShouldBindUri(&req); err != nil {
		err = infraerrors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err := validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 获取mcp实例
	instance, err := h.mcpService.GetMCPInstance(c.Request.Context(), req.MCPID, req.Version)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}
	// 代理message请求
	instance.SSEServer.MessageHandler().ServeHTTP(c.Writer, c.Request)
}
