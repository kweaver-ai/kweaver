package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *daConfHTTPHandler) BatchCheckIndexStatus(c *gin.Context) {
	// 1. 获取请求参数
	var req agentconfigreq.BatchCheckIndexStatusReq

	if err := c.ShouldBindJSON(&req); err != nil {
		err = capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, err)

		return
	}

	// 2. 验证请求参数
	if err := req.ReqCheck(); err != nil {
		err = capierr.New400Err(c, err.Error())
		rest.ReplyError(c, err)

		return
	}

	// 3. 批量检查索引状态
	res, err := h.daConfSvc.BatchCheckIndexStatus(c, &req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	list := common.NewListCommon()
	list.SetEntries(res)

	// 4. 返回结果
	c.JSON(http.StatusOK, list)
}
