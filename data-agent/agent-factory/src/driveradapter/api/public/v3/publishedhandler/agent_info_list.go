package publishedhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/published/pubedreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *publishedHandler) PubedAgentInfoList(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	// 1. 构建请求参数
	req := &pubedreq.PAInfoListReq{}
	if err := c.ShouldBind(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, req))
		_ = c.Error(httpErr)

		return
	}

	// 1.1 校验请求参数
	if err := req.ReqCheck(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 1.2 设置默认值
	req.HlDefaultVal()

	// 2. 调用service层获取已发布智能体列表
	resp, err := h.publishedSvc.GetPubedAgentInfoList(ctx, req)
	if err != nil {
		_ = c.Error(err)

		return
	}

	// 3. 返回成功
	rest.ReplyOK(c, http.StatusOK, resp)
}
