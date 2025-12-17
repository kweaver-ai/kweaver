package tplhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *daTplHTTPHandler) DetailByKey(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	key := c.Param("key")
	if key == "" {
		err := capierr.New400Err(c, "key is empty")
		_ = c.Error(err)

		return
	}

	detail, err := h.daTplSvc.DetailByKey(ctx, key)
	if err != nil {
		_ = c.Error(err)
		return
	}

	rest.ReplyOK(c, http.StatusOK, detail)
}
