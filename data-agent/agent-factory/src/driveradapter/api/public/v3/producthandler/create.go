package producthandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/auditconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/product/productreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/product/productresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *productHTTPHandler) Create(c *gin.Context) {
	isPrivate := capimiddleware.IsInternalAPI(c)

	var visitor *rest.Visitor

	if !isPrivate {
		visitor = chelper.GetVisitorFromCtx(c.Request.Context())
	}
	// 1. 获取请求体
	var req productreq.CreateReq

	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateProductAuditObject("", ""), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 2. 校验请求体
	if err := req.CustomCheck(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateProductAuditObject("", req.Name), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 3. 调用服务层创建
	key, err := h.productService.Create(c, &req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateProductAuditObject("", req.Name), &httpErr.BaseError)
		}

		_ = c.Error(err)

		return
	}

	// 4. 获取详情
	ret, err := h.productService.GetByKey(c, key)
	if err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		if !isPrivate {
			audit.NewWarnLogWithError(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
				auditconstant.GenerateProductAuditObject("", req.Name), &httpErr.BaseError)
		}

		_ = c.Error(httpErr)

		return
	}

	// 5. 返回结果
	res := &productresp.CreateRes{
		Key: key,
		ID:  ret.ID,
	}

	if !isPrivate {
		audit.NewInfoLog(audit.OPERATION, auditconstant.CREATE, audit.TransforOperator(*visitor),
			auditconstant.GenerateProductAuditObject("", req.Name), "")
	}

	c.JSON(http.StatusCreated, res)
}
