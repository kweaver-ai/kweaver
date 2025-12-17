package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_tpl/agenttplreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// Copy2TplAndPublish 复制Agent为模板并发布
func (h *daConfHTTPHandler) Copy2TplAndPublish(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(ctx)
	}
	// 1. 获取路径参数
	agentID := c.Param("agent_id")
	if agentID == "" {
		err := capierr.New400Err(c, "agent_id不能为空")
		_ = c.Error(err)

		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.COPY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(agentID, ""), &err.BaseError)
		}

		return
	}

	req := agenttplreq.NewPublishReq()
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(ctx, chelper.ErrMsg(err, req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.COPY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(agentID, ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	resp, auditLogInfo, err := h.daConfSvc.Copy2TplAndPublish(ctx, agentID, req)
	if err != nil {
		httpErr := rest.NewHTTPError(c, http.StatusInternalServerError, apierr.AgentFactory_InternalError).WithErrorDetails(err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.COPY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(agentID, auditLogInfo.Name), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.COPY_PUBLISH, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject(agentID, auditLogInfo.Name), "")
	}

	c.JSON(http.StatusOK, resp)
}
