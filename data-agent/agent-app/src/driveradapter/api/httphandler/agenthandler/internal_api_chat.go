package agenthandler

import (
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"

	// "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr/chelper"

	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
)

// NOTE: API调用，除url不同，其余与外部调用相同，只是token变为长期有效
func (h *agentHTTPHandler) InternalAPIChat(c *gin.Context) {
	// 1. app_key
	agentAPPKey := c.Param("app_key")
	if agentAPPKey == "" {
		httpErr := capierr.New400Err(c, "[InternalAPIChat] app key is empty")
		o11y.Error(c, "[InternalAPIChat] app key is empty")
		h.logger.Errorf("[InternalAPIChat] app key is empty")
		rest.ReplyError(c, httpErr)
		return
	}

	// 2. 获取请求参数
	var req agentreq.ChatReq = agentreq.ChatReq{
		AgentAPPKey:     agentAPPKey,
		AgentVersion:    "latest",
		ExecutorVersion: "v1",
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, fmt.Sprintf("[InternalAPIChat] should bind json err: %v", err))
		o11y.Error(c, fmt.Sprintf("[InternalAPIChat] should bind json err: %v", err))
		h.logger.Errorf("[InternalAPIChat] should bind json err: %v", err)
		rest.ReplyError(c, httpErr)
		return
	}

	//NOTE: 获取用户ID
	req.XAccountID = c.Request.Header.Get("x-account-id")
	req.XAccountType = cenum.AccountType(c.Request.Header.Get("x-account-type"))
	req.XBusinessDomainID = chelper.GetBizDomainIDFromCtx(c)
	req.UserID = c.Request.Header.Get("x-user")
	// visitorType := c.Request.Header.Get("x-visitor-type")
	// if visitorType == "app" {
	// 	req.VisitorType = constant.Business
	// } else { //user
	// 	req.VisitorType = constant.RealName
	// }
	req.CallType = constant.APIChat
	//NOTE: APIChat接口请求时，agentID 实际值为agentKey
	if req.AgentKey != "" {
		req.AgentID = req.AgentKey
	} else {
		httpErr := capierr.New400Err(c, "[InternalAPIChat] agent_key is required")
		h.logger.Errorf("[InternalAPIChat] agent_key is required")
		rest.ReplyError(c, httpErr)
		return
	}
	if req.AgentVersion == "" {
		req.AgentVersion = "latest"
	}
	if req.ExecutorVersion == "" {
		req.ExecutorVersion = "v1"
	}
	// 3. 调用服务
	channel, err := h.agentSvc.Chat(c.Request.Context(), &req)
	if err != nil {
		o11y.Error(c, fmt.Sprintf("[InternalAPIChat] chat error: %v", err.Error()))
		h.logger.Errorf("[InternalAPIChat] chat error: %v", err.Error())
		rest.ReplyError(c, err)
		return
	}
	if req.Stream {
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("Access-Control-Allow-Origin", "*")
		done := make(chan struct{})
		go func() {
			defer close(done)
			for data := range channel {
				_, err = c.Writer.Write(data)
				c.Writer.Flush()
			}
		}()
		<-done
	} else {
		// res := agentresp.ChatResp{}
		var res any
		for data := range channel {
			if err := sonic.Unmarshal(data, &res); err != nil {
				rest.ReplyError(c, err)
				return
			}
		}
		resultMap := res.(map[string]any)
		if _, ok := resultMap["BaseError"]; ok {
			// *rest.HTTPError
			c.JSON(http.StatusInternalServerError, resultMap["BaseError"])

		} else {
			// 如果res是agentresp.ChatResp{}，则返回200
			c.JSON(http.StatusOK, resultMap)

		}
	}
}
