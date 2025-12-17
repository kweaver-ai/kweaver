package conversationhandler

import (
	"fmt"
	"net/http"
	"strconv"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"

	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *conversationHTTPHandler) List(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	req := conversationreq.ListReq{}
	req.AgentAPPKey = c.Param("app_key")
	pageStr := c.DefaultQuery("page", "1")
	sizeStr := c.DefaultQuery("size", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		h.logger.Errorf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, httpErr)

		return
	}

	req.Page = page

	size, err := strconv.Atoi(sizeStr)
	if err != nil {
		h.logger.Errorf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, httpErr)

		return
	}

	req.Size = size
	user := chelper.GetVisitorFromCtx(ctx)
	req.UserId = user.ID
	list, total, err := h.conversationSvc.List(ctx, req)
	if err != nil {
		h.logger.Errorf("list conversation failed cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("list conversation failed cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.ConversationGetListFailed).WithErrorDetails(
			"list conversation failed:" + errors.Cause(err).Error(),
		)
		// 返回错误
		rest.ReplyError(c, httpErr)

		return
	}
	rt := map[string]interface{}{
		"entries": list,
		"total":   total,
	}
	// 返回成功
	rest.ReplyOK(c, http.StatusOK, rt)
}
