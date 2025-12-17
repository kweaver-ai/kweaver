package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil/crest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *daConfHTTPHandler) Update(c *gin.Context) {
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}
	// 1. 获取id
	id := c.Param("agent_id")
	if id == "" {
		err := capierr.New400Err(c, "id is empty")
		rest.ReplyError(c, err)

		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(id, ""), &err.BaseError)
		}

		return
	}

	// 2. 获取请求参数
	var req agentconfigreq.UpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(id, ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 2.1 设置is_private字段
	setIsPrivate2Req(c, &req)

	// 3. 验证请求参数
	if err := req.ReqCheckWithCtx(c); err != nil {
		httpError, ok := crest.GetRestHttpErr(err)
		if !ok {
			httpError = capierr.New400Err(c, err.Error())
		}

		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(id, ""), &httpError.BaseError)
		}

		_ = c.Error(httpError)

		return
	}

	// 3.1 custom check
	if err := req.CustomCheck(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(id, ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	if cenvhelper.IsLocalDev(cenvhelper.RunScenario_Aaron_Local_Dev) {
		req.ProductKey = "dip"
		if req.Name == "open_plan_mode_v1" && !req.Config.IsDolphinMode.Bool() {
			req.Config.PlanMode = daconfvalobj.NewPlanMode(true)
		} else {
			req.Config.PlanMode = daconfvalobj.NewPlanMode(false)
		}
	}

	// 4. 更新
	auditLogInfo, err := h.daConfSvc.Update(c, &req, id)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject(id, auditLogInfo.OldName), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.UPDATE, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject(id, auditLogInfo.OldName), "")
	}

	c.Status(http.StatusNoContent)
}
