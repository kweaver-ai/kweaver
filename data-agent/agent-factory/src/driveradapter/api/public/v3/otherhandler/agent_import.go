package otherhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_inout/agentinoutreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// ImportAgent 导入agent数据
func (o *otherHTTPHandler) ImportAgent(c *gin.Context) {
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}
	// 1. 获取请求参数
	var req agentinoutreq.ImportReq

	if err := c.ShouldBind(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.IMPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 1.1 检查文件是否存在
	if req.File == nil {
		err := capierr.New400Err(c, "未上传文件")
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.IMPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &err.BaseError)
		}

		_ = c.Error(err)

		return
	}

	// 2. 调用服务层
	resp, err := o.agentInOutSvc.Import(c, &req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.IMPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.IMPORT, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject("", ""), "")
	}
	// 3. 返回响应
	rest.ReplyOK(c, http.StatusOK, resp)
}
