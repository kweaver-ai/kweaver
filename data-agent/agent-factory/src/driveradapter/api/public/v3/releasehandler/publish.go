package releasehandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/release/releasereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *releaseHandler) Publish(c *gin.Context) {
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	var err error

	var req releasereq.PublishReq

	setIsPrivate2Req(c, &req)

	req.UserID, err = chelper.GetUserIDFromGinContext(c)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	if req.UserID == "" {
		err = errors.New("[releaseHandler.Publish]user_id is empty")

		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	req.AgentID = c.Param("agent_id")

	err = c.ShouldBind(&req)
	if err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		// todo error log
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	if err = req.CustomCheck(); err != nil {
		rest.ReplyError(c, err)
		return
	}

	resp, auditloginfo, err := h.releaseSvc.Publish(ctx, &req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(auditloginfo.ID, auditloginfo.Name), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.PUBLISH, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject(auditloginfo.ID, auditloginfo.Name), "")
	}

	rest.ReplyOK(c, http.StatusCreated, resp)
}
