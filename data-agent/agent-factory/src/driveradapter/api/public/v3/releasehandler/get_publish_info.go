package releasehandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

// GetPublishInfo 获取发布信息
func (h *releaseHandler) GetPublishInfo(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	// 1. 获取路径参数
	agentID := c.Param("agent_id")
	if agentID == "" {
		err := errors.New("agent_id is required")
		httpErr := capierr.New400Err(c, err.Error())
		_ = c.Error(httpErr)

		return
	}

	// 2. 调用服务层
	resp, err := h.releaseSvc.GetPublishInfo(ctx, agentID)
	if err != nil {
		h.logger.Errorf("GetPublishInfo failed, agentID: %s, error cause: %v, err trace: %+v\n", agentID, errors.Cause(err), err)
		_ = c.Error(err)

		return
	}

	// 3. 返回成功响应
	rest.ReplyOK(c, http.StatusOK, resp)
}
