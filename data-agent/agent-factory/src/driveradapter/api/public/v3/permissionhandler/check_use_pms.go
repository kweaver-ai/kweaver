package permissionhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/rdto/agent_permission/cpmsreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

// CheckUsePermission 检查非个人空间下的某个agent是否有运行权限
func (h *permissionHandler) CheckUsePermission(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	// 1. 获取请求参数
	var req cpmsreq.CheckAgentRunReq
	if err := c.ShouldBind(&req); err != nil {
		h.logger.Errorf("CheckUsePermission bind json error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		_ = c.Error(httpErr)

		return
	}

	// 2. 调用service层检查权限
	resp, err := h.permissionSvc.CheckUsePermission(ctx, &req)
	if err != nil {
		h.logger.Errorf("CheckUsePermission error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		_ = c.Error(err)

		return
	}

	// 3. 返回成功响应
	c.JSON(http.StatusOK, resp)
}
