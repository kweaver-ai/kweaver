package permissionhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

// GetUserStatus 获取用户拥有的管理权限状态
func (h *permissionHandler) GetUserStatus(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	// 调用service层获取用户权限状态
	resp, err := h.permissionSvc.GetUserStatus(ctx)
	if err != nil {
		h.logger.Errorf("GetUserStatus error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		_ = c.Error(err)

		return
	}

	// 返回成功响应
	c.JSON(http.StatusOK, resp)
}
