package releasehandler

import (
	"net/http"

	"github.com/pkg/errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"

	"github.com/gin-gonic/gin"
)

func (h *releaseHandler) HistoryList(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	agentID := c.Param("agent_id")
	if agentID == "" {
		h.logger.Errorf("agent id is empty")

		httpErr := capierr.New400Err(c, errors.New("agent id is empty"))

		rest.ReplyError(c, httpErr)

		return
	}

	historyList, _, err := h.releaseSvc.GetPublishHistoryList(ctx, agentID)
	if err != nil {
		h.logger.Errorf("GetPublishHistoryList error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		httpErr := capierr.New500Err(c, err.Error())
		rest.ReplyError(c, httpErr)

		return
	}

	rt := map[string]interface{}{
		"entries": historyList,
		// "total":   total,
	}
	// 返回成功
	rest.ReplyOK(c, http.StatusOK, rt)
}

func (h *releaseHandler) HistoryInfo(c *gin.Context) {
	// 返回成功
	rest.ReplyOK(c, http.StatusOK, "ok")
}
