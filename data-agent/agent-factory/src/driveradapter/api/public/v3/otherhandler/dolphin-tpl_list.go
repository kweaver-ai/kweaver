package otherhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/other/otherreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (o *otherHTTPHandler) DolphinTplList(c *gin.Context) {
	// 1. 获取请求参数
	var req otherreq.DolphinTplListReq

	if err := c.ShouldBind(&req); err != nil {
		err = capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, err)

		return
	}

	// 1.1 config配置处理（如设置默认值等）
	err := agentconfigreq.HandleConfig(req.Config)
	if err != nil {
		err = errors.Wrap(err, "[DolphinTplList]: HandleConfig failed")
		_ = c.Error(err)

		return
	}

	//// 1.1 验证请求参数
	//if err := req.Config.ValObjCheckWithCtx(c, false); err != nil {
	//	err = capierr.New400Err(c, err.Error())
	//	rest.ReplyError(c, err)
	//
	//	return
	//}

	// 2. 调用服务层
	res, err := o.otherService.DolphinTplList(c, &req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	c.JSON(http.StatusOK, res)
}
