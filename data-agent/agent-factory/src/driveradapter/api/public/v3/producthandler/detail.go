package producthandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *productHTTPHandler) Detail(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		err := capierr.New400Err(c, "id is empty")
		rest.ReplyError(c, err)

		return
	}

	res, err := h.productService.Detail(c, cutil.MustParseInt64(id))
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	c.JSON(http.StatusOK, res)
}
