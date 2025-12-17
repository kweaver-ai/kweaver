package squarehandler

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squarereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/agentfactoryhttp/afhttpdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"

	"github.com/gin-gonic/gin"
)

var agentInfoReqCtxKey = "agentInfoReqCtxKey"

// 1. 从path中获取 agent id 和 version
// 2. agent_id 可能为 id 或 key，当agent_id查询不到时会根据key来查询，然后获取其对应的id，赋值给agent_id
func (h *squareHandler) agentInfoGetReqMiddleware(c *gin.Context) {
	// 1. 获取 agent id 和 version
	agentID := c.Param("agent_id")
	version := c.Param("version")

	if agentID == "" || version == "" {
		err := capierr.New400Err(c, "agent_id和version不能为空")
		_ = c.Error(err)
		c.Abort()

		return
	}

	// 2. 检查 agent_id 是否存在，不存在则根据key来查询，然后获取其对应的id，赋值给agent_id
	agentID, err := h.squareSvc.CheckAndGetID(c, agentID)
	if err != nil {
		_ = c.Error(err)
		c.Abort()

		return
	}

	// 3. 获取用户ID
	userID := chelper.GetUserIDFromCtx(c)

	// 4. 构造请求参数
	agentInfoReq := squarereq.AgentInfoReq{
		AgentID:       agentID,
		AgentVersion:  version,
		IsVisit:       cutil.StringToBool(c.Query("is_visit")),
		UserID:        userID,
		CustomSpaceID: c.Query("custom_space_id"),
	}

	// 5. 设置请求参数
	c.Set(agentInfoReqCtxKey, &agentInfoReq)

	// 6. 继续执行
	c.Next()
}

func (h *squareHandler) agentInfoAgentUsePmsCheck(c *gin.Context) {
	var (
		err                 error
		req                 *squarereq.AgentInfoReq
		ok                  bool
		checkAgentUsePmsReq *afhttpdto.CheckPmsReq

		checkAgentUseHandler gin.HandlerFunc

		// isAgentExists bool
	)

	iReq, exists := c.Get(agentInfoReqCtxKey)
	if !exists {
		err = capierr.New400Err(c, "[agentInfoAgentUsePmsCheck]: agentInfoReqCtxKey不存在")
		goto ERRHandler
	}

	req, ok = iReq.(*squarereq.AgentInfoReq)
	if !ok {
		err = capierr.New400Err(c, "[agentInfoAgentUsePmsCheck]: agentInfoReqCtxKey类型错误")
		goto ERRHandler
	}

	// 1. 检查 Agent 是否存在
	//isAgentExists, err = h.squareSvc.IsAgentExists(c, req.AgentID)
	//if err != nil {
	//	goto ERRHandler
	//}
	//
	//if !isAgentExists {
	//	err = capierr.NewCustom404Err(c, apierr.DataAgentConfigNotFound, "Agent不存在")
	//	goto ERRHandler
	//}

	// 2. 检查 Agent 使用权限
	checkAgentUsePmsReq = afhttpdto.NewCheckAgentUsePmsReq(req.AgentID, req.UserID, "")

	checkAgentUseHandler = capimiddleware.CheckPms(checkAgentUsePmsReq, func(c *gin.Context, hasPms bool) {
		if !hasPms {
			_err := capierr.NewCustom403Err(c, apierr.AgentFactoryPermissionForbidden, "[agentInfoAgentUsePmsCheck]: 无当前Agent使用权限")

			_ = c.Error(_err)

			c.Abort()

			return
		}
	})

	checkAgentUseHandler(c)

	// 3. 继续执行
	c.Next()

	return

ERRHandler:
	_ = c.Error(err)
	c.Abort()
}
