package personalspacehandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/personal_space/personalspacereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// AgentList 获取个人空间Agent列表
func (h *PersonalSpaceHTTPHandler) AgentList(c *gin.Context) {
	// 1. 获取请求参数
	var req personalspacereq.AgentListReq

	if err := c.ShouldBindQuery(&req); err != nil {
		err = capierr.New400Err(c, chelper.ErrMsg(err, &req))
		_ = c.Error(err)

		return
	}

	// 2. 自定义参数校验
	if err := req.CustomCheck(); err != nil {
		err = capierr.New400Err(c, err.Error())
		_ = c.Error(err)

		return
	}

	// 2.1 加载 marker
	if err := req.LoadMarkerStr(); err != nil {
		err = capierr.New400Err(c, err.Error())
		rest.ReplyError(c, err)

		return
	}

	// 3. 调用服务层
	res, err := h.personalSpaceService.AgentList(c, &req)
	if err != nil {
		_ = c.Error(err)
		return
	}

	// 4. 返回响应
	rest.ReplyOK(c, http.StatusOK, res)
}
