package agenthandler

import (
	"fmt"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
)

func (h *agentHTTPHandler) Debug(c *gin.Context) {
	reqStartTime := cutil.GetCurrentMSTimestamp()
	// 1. app_key
	agentAPPKey := c.Param("app_key")
	if agentAPPKey == "" {
		err := capierr.New400Err(c, "[Debug] app key is empty")
		o11y.Error(c, "[Debug] app key is empty")
		h.logger.Errorf("[Debug] app key is empty")
		rest.ReplyError(c, err)
		return
	}

	// 2. 获取请求参数
	req := agentreq.DebugReq{
		Stream:          true,
		IncStream:       true,
		ExecutorVersion: "v1",
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, fmt.Sprintf("[Debug] should bind json err: %v", err))
		o11y.Error(c, fmt.Sprintf("[Debug] should bind json err: %v", err))
		h.logger.Errorf("[Debug] should bind json err: %v", err)
		rest.ReplyError(c, httpErr)
		return
	}
	if req.ExecutorVersion == "" {
		req.ExecutorVersion = "v1"
	}
	ctx := c.Request.Context()
	req.AgentAPPKey = agentAPPKey

	//NOTE: 获取用户ID
	user := chelper.GetVisitorFromCtx(c)
	if user == nil {
		httpErr := capierr.New401Err(c, "[Debug] user not found")
		o11y.Error(c, "[Debug] user not found")
		h.logger.Errorf("[Debug] user not found")
		rest.ReplyError(c, httpErr)
		return
	}
	req.UserID = user.ID
	req.Token = strings.TrimPrefix(user.TokenID, "Bearer ")
	if req.Input.Tool.SessionID != "" {
		req.SessionID = req.Input.Tool.SessionID
	} else {
		req.SessionID = cutil.UlidMake()
	}

	//NOTE: 目前Debug 和chat 内部实现逻辑一致，先复用
	chatReq := &agentreq.ChatReq{
		AgentAPPKey:    req.AgentAPPKey,
		AgentID:        req.AgentID,
		AgentVersion:   req.AgentVersion,
		ConversationID: req.ConversationID,
		TempFiles:      req.Input.TempFiles,
		Query:          req.Input.Query,
		History:        req.Input.History,
		Tool:           req.Input.Tool,
		CustomQuerys:   req.Input.CustomQuerys,
		// ConfirmPlan:  req.ConfirmPlan,
		ChatMode:  req.ChatMode,
		Stream:    req.Stream,
		IncStream: req.IncStream,
		InternalParam: agentreq.InternalParam{
			UserID:       req.UserID,
			Token:        req.Token,
			AgentRunID:   req.SessionID,
			ReqStartTime: reqStartTime,
		},
		ExecutorVersion: req.ExecutorVersion,
	}
	chatReq.XAccountID = user.ID
	chatReq.XAccountType.LoadFromMDLVisitorType(user.Type)
	chatReq.XBusinessDomainID = chelper.GetBizDomainIDFromCtx(c)
	// // 3. 调用服务
	// if user.Type == rest.VisitorType_App {
	// 	chatReq.VisitorType = constant.Business
	// } else if user.Type == rest.VisitorType_RealName {
	// 	chatReq.VisitorType = constant.RealName
	// } else {
	// 	chatReq.VisitorType = constant.Anonymous
	// }
	chatReq.CallType = constant.DebugChat
	channel, err := h.agentSvc.Chat(ctx, chatReq)
	if err != nil {
		o11y.Error(c, fmt.Sprintf("[Debug] chat error: %v", err.Error()))
		h.logger.Errorf("[Debug] chat error: %v", err.Error())
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
			ttftFlag := false
			defer close(done)
			for data := range channel {
				//NOTE: 遇到错误时，不能break，否则会关闭channel导致对话结束
				if !ttftFlag {
					ttftFlag = true
					h.logger.Infof("[Debug] ttft: %d ms", cutil.GetCurrentMSTimestamp()-reqStartTime)
				}
				_, _ = c.Writer.Write(data)
				c.Writer.Flush()
			}
		}()
		<-done
	} else {
		var res any
		for data := range channel {
			if err := sonic.Unmarshal(data, &res); err != nil {
				rest.ReplyError(c, err)
				return
			}
			// fmt.Println(res)
		}
		resultMap := res.(map[string]any)
		if _, ok := resultMap["BaseError"]; ok {
			// *rest.HTTPError
			c.JSON(http.StatusInternalServerError, resultMap["BaseError"])

		} else {
			c.JSON(http.StatusOK, resultMap)

		}
	}

}
