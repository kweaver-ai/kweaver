package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/daconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil/crest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *daConfHTTPHandler) Create(c *gin.Context) {
	// 1. 获取请求参数
	var req agentconfigreq.CreateReq

	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", req.Name), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}
	// 1.1 设置is_private字段
	setIsPrivate2Req(c, req.UpdateReq)

	// 2. 验证请求参数
	if err := req.ReqCheckWithCtx(c); err != nil {
		httpError, ok := crest.GetRestHttpErr(err)
		if !ok {
			httpError = capierr.New400Err(c, err.Error())
		}

		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", req.Name), &httpError.BaseError)
		}

		_ = c.Error(httpError)

		return
	}

	// 3. 创建
	id, err := h.daConfSvc.Create(c, &req)
	if err != nil {
		httpErr := rest.NewHTTPError(c, http.StatusInternalServerError, apierr.AgentFactory_InternalError).WithErrorDetails(err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", req.Name), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	// 4. 返回结果
	res := &agentconfigresp.CreateRes{
		ID:      id,
		Version: daconstant.AgentVersionUnpublished,
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject("", req.Name), "")
	}

	c.JSON(http.StatusCreated, res)
}
