package agenthandler

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

func (h *agentHTTPHandler) GetAPIDoc(c *gin.Context) {
	var req agentreq.GetAPIDocReq
	if err := c.ShouldBindJSON(&req); err != nil {
		rest.ReplyError(c, err)
		return
	}
	appKey := c.Param("app_key")
	if appKey == "" {
		rest.ReplyError(c, capierr.New400Err(c, "app_key is required"))
		h.logger.Errorf("[GetAPIDoc] app_key is required")
		o11y.Error(c, "[GetAPIDoc] app_key is required")
		return
	}
	ctx := context.WithValue(c.Request.Context(), constant.AppKey, appKey)
	doc, err := h.agentSvc.GetAPIDoc(ctx, &req)
	if err != nil {
		h.logger.Errorf("[GetAPIDoc] error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		o11y.Error(c, fmt.Sprintf("[GetAPIDoc] error cause: %v, err trace: %+v\n", errors.Cause(err), err))
		rest.ReplyError(c, err)
		return
	}

	rest.ReplyOK(c, http.StatusOK, doc)
}
