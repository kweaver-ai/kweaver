package agenthandler

import (
	"fmt"
	"net/http"

	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *agentHTTPHandler) FileCheck(c *gin.Context) {
	// 1. 获取请求参数
	var req agentreq.FileCheckReq
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("FileCheck error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		httpErr := rest.NewHTTPError(c.Request.Context(), http.StatusBadRequest, apierr.AgentAPP_InvalidParameter_RequestBody).WithErrorDetails(err.Error())
		o11y.Error(c.Request.Context(), fmt.Sprintf("[FileCheck] error cause: %v, err trace: %+v\n", errors.Cause(err), err))
		rest.ReplyError(c, httpErr)
		return
	}

	// 2. 调用服务
	rsp, err := h.agentSvc.FileCheck(c.Request.Context(), &req)
	if err != nil {
		h.logger.Errorf("FileCheck error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c.Request.Context(), fmt.Sprintf("[FileCheck] error cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(err.Error())
		rest.ReplyError(c, httpErr)
		return
	}

	// 3. 返回响应
	rest.ReplyOK(c, http.StatusOK, rsp)
}
