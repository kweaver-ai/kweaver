package conversationhandler

import (
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/conversation/conversationreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *conversationHTTPHandler) MarkRead(c *gin.Context) {

	ctx := rest.GetLanguageCtx(c)

	// 1. 获取id
	id := c.Param("id")
	if id == "" {
		h.logger.Errorf("[MarkRead] id is empty")
		o11y.Error(c, "[MarkRead] id is empty")
		err := capierr.New400Err(c, "id is empty")
		rest.ReplyError(c, err)

		return
	}

	req := conversationreq.MarkReadReq{}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("[MarkRead] should bind json error: %v", errors.Cause(err))
		o11y.Error(c, fmt.Sprintf("[MarkRead] should bind json error: %v", errors.Cause(err)))
		err = capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, err)

		return
	}

	// 2. 验证请求参数
	if err := req.ReqCheck(); err != nil {
		h.logger.Errorf("[MarkRead] req check error: %v", errors.Cause(err))
		o11y.Error(c, fmt.Sprintf("[MarkRead] req check error: %v", errors.Cause(err)))
		err = capierr.New400Err(c, err.Error())
		rest.ReplyError(c, err)

		return
	}

	// 3. 标记已读
	err := h.conversationSvc.MarkRead(ctx, id, req.LastestReadIdx)
	if err != nil {

		h.logger.Errorf("mark read conversation failed, cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("mark read conversation failed, cause: %v, err trace: %+v\n", errors.Cause(err), err))

		// 返回错误
		rest.ReplyError(c, err)
		return
	}
	// 4. 返回结果
	c.JSON(http.StatusNoContent, "")
}
