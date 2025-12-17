package tempareahandler

import (
	"fmt"
	"net/http"

	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *tempareaHTTPHandler) Remove(c *gin.Context) {
	var req tempareareq.RemoveReq
	sourceIds := c.QueryArray("source_id")
	if len(sourceIds) == 0 {
		rest.ReplyError(c, capierr.New400Err(c, "source id is required"))
		return
	}
	req.SourceIDs = sourceIds
	tempAreaID := c.Param("id")
	if tempAreaID == "" {
		rest.ReplyError(c, capierr.New400Err(c, "temp area id is required"))
		return
	}
	req.TempAreaID = tempAreaID
	user := chelper.GetVisitorFromCtx(c)
	if user == nil {
		rest.ReplyError(c, capierr.New401Err(c, "user not found"))
		return
	}
	req.UserID = user.ID
	err := h.tempareaSvc.Remove(c.Request.Context(), req)
	if err != nil {
		rest.ReplyError(c, rest.NewHTTPError(c.Request.Context(), http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(
			fmt.Sprintf("remove temp area failed:%s", err.Error())))
		return
	}
	rest.ReplyOK(c, http.StatusNoContent, "")
}
