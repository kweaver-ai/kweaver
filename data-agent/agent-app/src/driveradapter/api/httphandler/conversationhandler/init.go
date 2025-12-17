package conversationhandler

import (
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *conversationHTTPHandler) Init(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)
	user := chelper.GetVisitorFromCtx(c)
	agentAPPKey := c.Param("app_key")
	if agentAPPKey == "" {
		h.logger.Errorf("[Init] agent_app_key is empty")
		o11y.Error(c, "[Init] agent_app_key is empty")
		httpErr := capierr.New400Err(ctx, "agent_app_key is empty")
		rest.ReplyError(c, httpErr)

		return
	}

	// 1. 获取请求参数
	var req conversationreq.InitReq

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("[Init] should bind json error: %v", errors.Cause(err))
		o11y.Error(c, fmt.Sprintf("[Init] should bind json error: %v", errors.Cause(err)))
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, httpErr)

		return
	}

	// 2. 验证请求参数
	if err := req.ReqCheck(); err != nil {
		h.logger.Errorf("[Init] req check error: %v", errors.Cause(err))
		o11y.Error(c, fmt.Sprintf("[Init] req check error: %v", errors.Cause(err)))
		httpErr := capierr.New400Err(c, err.Error())
		rest.ReplyError(c, httpErr)

		return
	}
	req.UserID = user.ID
	req.XAccountID = user.ID
	req.XAccountType.LoadFromMDLVisitorType(user.Type)
	req.XBusinessDomainID = chelper.GetBizDomainIDFromCtx(c)
	req.AgentAPPKey = agentAPPKey
	// visitor := chelper.GetVisitorFromCtx(c)
	// if visitor != nil {
	// 	if visitor.Type == rest.VisitorType_App {
	// 		req.VisitorType = "app"
	// 	} else if visitor.Type == rest.VisitorType_RealName {
	// 		req.VisitorType = "user"
	// 	} else {
	// 		req.VisitorType = "anonymous"
	// 	}
	// }
	//NOTE: 截取前50个字符
	if req.Title != "" {
		runes := []rune(req.Title)
		if len(runes) < 50 {
			req.Title = string(runes)
		} else {
			req.Title = string(runes[:50])
		}
	}
	if req.ExecutorVersion == "" {
		req.ExecutorVersion = "v1"
	}
	rt, err := h.conversationSvc.Init(ctx, req)
	if err != nil {
		h.logger.Errorf("init conversation failed cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("init conversation failed cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError,
			apierr.ConversationInitFailed).WithErrorDetails(fmt.Sprintf("get conversation detail failed %s", err.Error()))

		// 返回错误
		rest.ReplyError(c, httpErr)

		return
	}

	rest.ReplyOK(c, http.StatusOK, rt)
}
