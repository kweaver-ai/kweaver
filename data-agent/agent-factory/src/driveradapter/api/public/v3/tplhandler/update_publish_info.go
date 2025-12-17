package tplhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_tpl/agenttplreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/ginhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// UpdatePublishInfo 更新模板发布信息
func (h *daTplHTTPHandler) UpdatePublishInfo(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(ctx)
	}

	tplID, err := ginhelper.GetParmIDInt64(c)
	if err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.MODIFY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentTemplateAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	var req agenttplreq.UpdatePublishInfoReq
	if err = c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.MODIFY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentTemplateAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	resp, auditloginfo, err := h.daTplSvc.UpdatePublishInfo(ctx, &req, tplID)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.MODIFY_PUBLISH, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentTemplateAuditObject("", auditloginfo.Name), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.MODIFY_PUBLISH, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentTemplateAuditObject("", auditloginfo.Name), "")
	}

	c.JSON(http.StatusOK, resp)
}
