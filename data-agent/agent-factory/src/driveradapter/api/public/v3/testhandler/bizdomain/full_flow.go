package bizdomain

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"github.com/gin-gonic/gin"
)

// TestBizDomainHttp 完整流程测试
func (h *BizDomainTestHandler) TestBizDomainHttp(c *gin.Context) {
	// 解析请求参数
	var req TestBizDomainHttpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		err := capierr.New400Err(c, "Invalid request parameters: "+err.Error())
		_ = c.Error(err)

		return
	}

	// 调用业务域HTTP测试方法
	err := h.bizDomainSvc.TestBizDomainHttp(c.Request.Context(), req.AgentID)
	if err != nil {
		err := capierr.New500Err(c, "TestBizDomainHttp failed: "+err.Error())
		_ = c.Error(err)

		return
	}

	response := map[string]interface{}{
		"message":  "BizDomain HTTP test completed successfully",
		"status":   "success",
		"agent_id": req.AgentID,
	}
	c.JSON(http.StatusOK, response)
}
