package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// BatchFields 批量获取agent指定字段
func (h *daConfHTTPHandler) BatchFields(c *gin.Context) {
	// 1. 获取请求参数
	var req agentconfigreq.BatchFieldsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		_ = c.Error(httpErr)

		return
	}

	// 1.1 校验请求参数
	if err := req.Validate(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 2. 调用服务层
	resp, err := h.daConfSvc.BatchFields(c, &req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 3. 返回响应
	rest.ReplyOK(c, http.StatusOK, resp)
}
