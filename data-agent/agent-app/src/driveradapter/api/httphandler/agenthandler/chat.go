package agenthandler

import (
	"fmt"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
)

func (h *agentHTTPHandler) Chat(c *gin.Context) {
	reqStartTime := cutil.GetCurrentMSTimestamp()
	// 1. app_key
	agentAPPKey := c.Param("app_key")
	if agentAPPKey == "" {
		err := capierr.New400Err(c, "[Chat] app key is empty")
		h.logger.Errorf("[Chat] app key is empty: %v", err)
		o11y.Error(c, "[Chat] app key is empty")
		rest.ReplyError(c, err)
		return
	}

	// 2. 获取请求参数
	var req agentreq.ChatReq = agentreq.ChatReq{
		Stream:          true,
		IncStream:       true,
		AgentVersion:    "latest",
		ConfirmPlan:     true,
		ExecutorVersion: "v1",
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("[Chat] should bind json err: %v", err)
		o11y.Error(c, fmt.Sprintf("[Chat] should bind json err: %v", err))
		httpErr := capierr.New400Err(c, fmt.Sprintf("[Chat] should bind json err: %v", err))
		rest.ReplyError(c, httpErr)
		return
	}
	req.AgentAPPKey = agentAPPKey
	req.ReqStartTime = reqStartTime
	//NOTE: 获取用户ID
	user := chelper.GetVisitorFromCtx(c)
	if user == nil {
		httpErr := capierr.New404Err(c, "[Chat] user not found")
		o11y.Error(c, "[Chat] user not found")
		h.logger.Errorf("[Chat] user not found: %v", httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	req.UserID = user.ID
	req.XAccountID = user.ID
	req.XAccountType.LoadFromMDLVisitorType(user.Type)
	req.XBusinessDomainID = chelper.GetBizDomainIDFromCtx(c)
	req.Token = strings.TrimPrefix(user.TokenID, "Bearer ")
	if req.Tool.SessionID != "" {
		req.AgentRunID = req.Tool.SessionID
	} else {
		req.AgentRunID = cutil.UlidMake()
	}

	// if user.Type == rest.VisitorType_App {
	// 	req.VisitorType = constant.Business
	// } else if user.Type == rest.VisitorType_RealName {
	// 	req.VisitorType = constant.RealName
	// } else {
	// 	req.VisitorType = constant.Anonymous
	// }
	if req.ExecutorVersion == "" {
		req.ExecutorVersion = "v1"
	}
	req.CallType = constant.Chat
	ctx := c.Request.Context()

	// 3. 调用服务
	channel, err := h.agentSvc.Chat(ctx, &req)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[Chat] chat failed: %v", err.Error()))
		h.logger.Errorf("[Chat] chat failed: %v", err.Error())
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
			ttft := false
			defer close(done)
			//NOTE: 清空channel，直到channel关闭，再退出；
			drainFunc := func() {
				for range channel {
				}
			}
			for {
				select {
				case data, ok := <-channel:
					//NOTE: 如果channel关闭，则退出
					if !ok {
						h.logger.Debugf("[Chat] channel closed")
						return
					}
					//NOTE: 往SSE中写入数据
					if !ttft {

						ttft = true
						h.logger.Infof("[Chat] ttft: %d ms", cutil.GetCurrentMSTimestamp()-reqStartTime)
					}
					_, err := c.Writer.Write(data)
					if err != nil {
						h.logger.Errorf("[Chat] write data err: %v", err)
						o11y.Error(ctx, fmt.Sprintf("[Chat] write data err: %v", err))
						//NOTE:如果出错，清空channel，直到channel关闭，再退出；
						//NOTE: 如果channel未关闭直接退出，会导致管道阻塞，对话Process无法继续
						drainFunc()
						return
					} else {
						//NOTE: 如果写入成功，则刷新缓冲区
						c.Writer.Flush()
					}
				case <-c.Writer.CloseNotify():
					//NOTE: 如果SSE连接关闭，则清空channel，直到channel关闭，再退出；
					h.logger.Debugf("[Chat] SSE connection closed")
					drainFunc()
					return
				case <-c.Request.Context().Done():
					//NOTE: 如果请求上下文关闭，则清空channel，直到channel关闭，再退出；
					h.logger.Debugf("[Chat] request context done")
					drainFunc()
					return
				}

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
		if res == nil {
			h.logger.Errorf("[Chat] chat failed: res is nil")
			c.JSON(http.StatusInternalServerError, rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.AgentAPP_InternalError).
				WithErrorDetails("[Chat] chat failed: res is nil").BaseError)
			return
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
