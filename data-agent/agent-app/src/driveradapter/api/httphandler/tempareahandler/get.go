package tempareahandler

import (
	"net/http"

	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// Get 获取临时区域文件详情
func (h *tempareaHTTPHandler) Get(c *gin.Context) {
	var req tempareareq.GetReq
	req.TempAreaID = c.Param("id")
	res, err := h.tempareaSvc.Get(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError, apierr.TempAreaGetFailed).WithErrorDetails(err.Error()))
		return
	}
	if len(res) == 0 {
		rest.ReplyError(c, capierr.New400Err(c, "temp area not found"))
		return
	}
	rest.ReplyOK(c, http.StatusOK, res)
}
