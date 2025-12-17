package bizdomain

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagenttpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"github.com/gin-gonic/gin"
)

// FixMissingAgentTplRelHandler 修复缺失的agent模板业务域关联
// 查找在t_data_agent_config_tpl表但不在t_biz_domain_agent_tpl_rel表中的数据
// 然后为这些数据建立业务域关联
func (h *BizDomainTestHandler) FixMissingAgentTplRelHandler(c *gin.Context) {
	ctx := c.Request.Context()

	// 获取repo实例
	agentTplRepo := daconftpldbacc.NewDataAgentTplRepo()
	bdAgentTplRelRepo := bdagenttpldbacc.NewBizDomainAgentTplRelRepo()

	// 调用service方法
	resp, err := h.bizDomainSvc.FixMissingAgentTplRel(ctx, agentTplRepo, bdAgentTplRelRepo)
	if err != nil {
		err = capierr.New500Err(c, "FixMissingAgentTplRel failed: "+err.Error())
		_ = c.Error(err)

		return
	}

	response := map[string]interface{}{
		"message":     "Fix missing agent tpl rel completed successfully",
		"status":      "success",
		"fixed_count": resp.FixedCount,
		"fixed_ids":   resp.FixedIDs,
	}
	c.JSON(http.StatusOK, response)
}
