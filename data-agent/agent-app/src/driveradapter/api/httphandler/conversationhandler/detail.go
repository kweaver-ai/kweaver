package conversationhandler

import (
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *conversationHTTPHandler) Detail(c *gin.Context) {
	// 1. 获取id
	id := c.Param("id")
	if id == "" {
		h.logger.Errorf("[Detail] id is empty")
		o11y.Error(c, "[Detail] id is empty")
		err := capierr.New400Err(c, "id is empty")
		rest.ReplyError(c, err)

		return
	}

	// 2. 获取详情
	res, err := h.conversationSvc.Detail(c, id)
	if err != nil {
		h.logger.Errorf("get conversation detail failed, cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("get conversation detail failed, cause: %v, err trace: %+v\n", errors.Cause(err), err))
		httpErr := rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError,
			apierr.ConversationDetailFailed).WithErrorDetails(fmt.Sprintf("get conversation detail failed %s", err.Error()))
		rest.ReplyError(c, httpErr)
		return
	}

	// 3. 返回结果
	c.JSON(http.StatusOK, res)
}
