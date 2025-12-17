package agenthandler

import (
	"fmt"
	"net/http"

	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *agentHTTPHandler) ConversationSessionInit(c *gin.Context) {
	var req agentreq.ConversationSessionInitReq
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, fmt.Sprintf("[ConversationSessionInit] should bind json err: %v", err))
		o11y.Error(c, fmt.Sprintf("[ConversationSessionInit] should bind json err: %v", err))
		h.logger.Errorf("[ConversationSessionInit] should bind json err: %v", err)
		rest.ReplyError(c, httpErr)
		return
	}
	visitor := chelper.GetVisitorFromCtx(c)
	if visitor == nil {
		httpErr := capierr.New401Err(c, "[ConversationSessionInit] visitor not found")
		o11y.Error(c, "[ConversationSessionInit] visitor not found")
		h.logger.Errorf("[ConversationSessionInit] visitor not found")
		rest.ReplyError(c, httpErr)
		return
	}
	req.UserID = visitor.ID
	req.XAccountID = visitor.ID
	req.XAccountType.LoadFromMDLVisitorType(visitor.Type)
	req.XBusinessDomainID = chelper.GetBizDomainIDFromCtx(c)

	// if visitor.Type == rest.VisitorType_App {
	// 	req.VisitorType = "app"
	// } else if visitor.Type == rest.VisitorType_RealName {
	// 	req.VisitorType = "user"
	// } else {
	// 	req.VisitorType = "anonymous"
	// }
	ttl, err := h.agentSvc.ConversationSessionInit(c.Request.Context(), &req)
	if err != nil {
		httpErr := rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError,
			apierr.AgentAPP_Agent_SessionInitFailed).WithErrorDetails(fmt.Sprintf("[ConversationSessionInit] conversation session init err: %v", err))

		o11y.Error(c, fmt.Sprintf("[ConversationSessionInit] conversation session init err: %v", err))
		h.logger.Errorf("[ConversationSessionInit] conversation session init err: %v", err)
		rest.ReplyError(c, httpErr)
		return
	}
	rest.ReplyOK(c, http.StatusOK, map[string]int{"ttl": ttl})
}
