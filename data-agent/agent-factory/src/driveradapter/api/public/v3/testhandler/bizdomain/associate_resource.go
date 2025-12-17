package bizdomain

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"github.com/gin-gonic/gin"
)

// AssociateResourceTestHandler 测试资源关联
func (h *BizDomainTestHandler) AssociateResourceTestHandler(c *gin.Context) {
	// 解析请求参数
	var req TestBizDomainHttpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		err := capierr.New400Err(c, "Invalid request parameters: "+err.Error())
		_ = c.Error(err)

		return
	}

	// 调用资源关联测试方法
	err := h.bizDomainSvc.AssociateResourceTest(c.Request.Context(), req.AgentID)
	if err != nil {
		err := capierr.New500Err(c, "AssociateResourceTest failed: "+err.Error())
		_ = c.Error(err)

		return
	}

	response := map[string]interface{}{
		"message":   "Resource association test completed successfully",
		"status":    "success",
		"agent_id":  req.AgentID,
		"operation": "associate_resource",
	}
	c.JSON(http.StatusOK, response)
}
