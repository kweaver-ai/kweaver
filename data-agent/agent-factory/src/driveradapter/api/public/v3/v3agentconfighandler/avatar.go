package v3agentconfighandler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// BuiltInAvatarInfo 内置头像信息
type BuiltInAvatarInfo struct {
	ID  string `json:"id"`
	URL string `json:"url"`
}

// BuiltInAvatarListResponse 内置头像列表响应
type BuiltInAvatarListResponse struct {
	Entries []BuiltInAvatarInfo `json:"entries"`
	Total   int                 `json:"total"`
}

// GetBuiltInAvatar 获取内置头像
func (h *daConfHTTPHandler) GetBuiltInAvatar(c *gin.Context) {
	// 1. 获取头像ID参数
	avatarID := c.Param("avatar_id")
	if avatarID == "" {
		err := capierr.New400Err(c, "头像ID不能为空")
		rest.ReplyError(c, err)

		return
	}

	// 2. 验证头像ID是否为有效数字（1-10）
	id, err := strconv.Atoi(avatarID)
	if err != nil || id < 1 || id > 10 {
		err := capierr.New404Err(c, "头像不存在")
		rest.ReplyError(c, err)

		return
	}

	// 3. 构建SVG文件路径
	svgPath := filepath.Join("static", "images", "avatar", avatarID+".svg")

	// 4. 设置响应头并返回SVG文件
	c.Header("Content-Type", "image/svg+xml")
	c.Header("Cache-Control", "public, max-age=86400") // 缓存1天
	c.File(svgPath)
}

// GetBuiltInAvatarList 获取内置头像列表
func (h *daConfHTTPHandler) GetBuiltInAvatarList(c *gin.Context) {
	// 构建头像列表
	var avatars []BuiltInAvatarInfo

	for i := 1; i <= 10; i++ {
		id := strconv.Itoa(i)
		avatars = append(avatars, BuiltInAvatarInfo{
			ID:  id,
			URL: fmt.Sprintf("/agent-factory/v3/agent/avatar/built-in/%s", id),
		})
	}

	// 返回响应
	response := BuiltInAvatarListResponse{
		Entries: avatars,
		Total:   len(avatars),
	}

	c.JSON(http.StatusOK, response)
}
