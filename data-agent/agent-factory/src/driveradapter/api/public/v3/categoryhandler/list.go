package categoryhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"github.com/gin-gonic/gin"
)

func (h *categoryHandler) List(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	rt, err := h.categorySvc.List(ctx)
	if err != nil {
		h.logger.Errorf("list category failed, err: %v", err)
		httpErr := capierr.New500Err(ctx, err.Error())

		// 返回错误
		rest.ReplyError(c, httpErr)

		return
	}
	// 返回成功
	rest.ReplyOK(c, http.StatusOK, rt)
}
