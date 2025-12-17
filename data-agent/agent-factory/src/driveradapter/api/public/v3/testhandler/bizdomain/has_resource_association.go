package bizdomain

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"github.com/gin-gonic/gin"
)

// HasResourceAssociationTestHandler 测试单个资源关联关系查询
func (h *BizDomainTestHandler) HasResourceAssociationTestHandler(c *gin.Context) {
	// 解析请求参数
	var req TestBizDomainHttpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		err := capierr.New400Err(c, "Invalid request parameters: "+err.Error())
		_ = c.Error(err)

		return
	}

	// 调用单个资源关联关系查询测试方法
	hasAssociation, err := h.bizDomainSvc.HasResourceAssociationTest(c.Request.Context(), req.AgentID)
	if err != nil {
		err := capierr.New500Err(c, "HasResourceAssociationTest failed: "+err.Error())
		_ = c.Error(err)

		return
	}

	response := map[string]interface{}{
		"message":         "Resource association check completed successfully",
		"status":          "success",
		"agent_id":        req.AgentID,
		"operation":       "has_resource_association",
		"has_association": hasAssociation,
	}
	c.JSON(http.StatusOK, response)
}
