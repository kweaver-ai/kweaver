package publishedhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/published/pubedreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// PublishedAgentList 已发布智能体列表
func (h *publishedHandler) PublishedAgentList(c *gin.Context) {
	// 构建请求参数
	req := &pubedreq.PubedAgentListReq{}
	if err := c.ShouldBind(&req); err != nil {
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, req))
		_ = c.Error(httpErr)

		return
	}

	if err := req.CustomCheck(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 如果business_domain_ids为空，设置为公共业务域
	if len(req.BusinessDomainIDs) == 0 {
		bdID := chelper.GetBizDomainIDFromCtx(c)
		req.BusinessDomainIDs = []string{bdID}
	}

	if err := req.LoadMarkerStr(); err != nil {
		httpErr := capierr.New400Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	req.IDs = cutil.RemoveEmptyStrFromSlice(req.IDs)

	// 调用service层获取已发布智能体列表
	resp, err := h.publishedSvc.GetPublishedAgentList(c, req)
	if err != nil {
		httpErr := capierr.New500Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 返回成功
	rest.ReplyOK(c, http.StatusOK, resp)
}
