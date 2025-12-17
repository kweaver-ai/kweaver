package otherhandler

import (
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_inout/agentinoutreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// ExportAgent 导出agent数据
func (o *otherHTTPHandler) ExportAgent(c *gin.Context) {
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}
	// 1. 获取请求参数
	var req agentinoutreq.ExportReq

	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.EXPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 1.1 校验请求参数
	if err := req.CustomCheckAndDedupl(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.EXPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 2. 调用服务层
	resp, filename, err := o.agentInOutSvc.Export(c, &req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.EXPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	// 3. 序列化响应数据
	jsonData, err := cutil.JSON().MarshalToString(resp)
	if err != nil {
		httpErr := capierr.New500Err(c, "序列化导出数据失败")
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.EXPORT, audit.TransforOperator(*visitor),
				auditconstant.GenerateAgentAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.EXPORT, audit.TransforOperator(*visitor),
			auditconstant.GenerateAgentAuditObject("", ""), "")
	}
	// 4. 设置响应头并返回文件
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.String(http.StatusOK, jsonData)
}

// ExportAgentGet GET 方法导出（临时测试用）
func (o *otherHTTPHandler) ExportAgentGet(c *gin.Context) {
	// 1. 获取请求参数
	req := &agentinoutreq.ExportReq{
		AgentIDs: c.QueryArray("agent_ids"),
	}

	// 1.1 校验请求参数
	if err := req.CustomCheckAndDedupl(); err != nil {
		err = capierr.New400Err(c, err.Error())
		_ = c.Error(err)

		return
	}

	// 2. 调用服务层
	resp, filename, err := o.agentInOutSvc.Export(c, req)
	if err != nil {
		_ = c.Error(err)
		return
	}

	// 3. 序列化响应数据
	jsonData, err := cutil.JSON().MarshalToString(resp)
	if err != nil {
		err = capierr.New500Err(c, "序列化导出数据失败")
		_ = c.Error(err)

		return
	}

	// 4. 设置响应头并返回文件
	c.Header("Content-Type", "application/json")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.String(http.StatusOK, jsonData)
}
