package webapp

import (
	"net/http"
	"strconv"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/logic/webapp"

	"github.com/gin-gonic/gin"
)

// ListMenu godoc
//
//	@Summary		查询菜单列表
//	@Description	查询菜单列表
//	@Tags			MenuItem
//	@Accept			json
//	@Produce		json
//	@Param			id	query		string				true	"查询的菜单ID"
//	@Success		200	{object}	webapp.MenuResult	"查询的WebAPP数据"
//	@Failure		500	"查询菜单项异常"
//	@Failure		404	"查询的菜单项不存在"
//	@Router			/api/workstation/v1/menu [get]
func (api *API) ListMenu(c *gin.Context) {
	menuID := c.Query("id")
	if menuID == "" {
		menuID = "root"
		// cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "menu id is empty", ""), c)
		// return
	}

	lan := c.GetHeader("x-language")
	if lan == "" {
		lan = "zh-CN"
	}

	manifest, err := api.Logic.QueryApp(webapp.QueryWebAppParams{
		Name:      menuID,
		Sid:       api.Config.CommonConfig.GlobalSID,
		WithMoved: true,
	})
	if err != nil {
		// cerror.AsError(err).Reply(c)
		replyError(c, cerror.AsError(err))
		return
	}

	rel, err := webapp.ManifestMenuItems(manifest, lan)
	if err != nil {
		// cerror.AsError(err).Reply(c)
		replyError(c, cerror.AsError(err))
		return
	}

	c.JSON(http.StatusOK, rel)
}

func replyError(c *gin.Context, e cerror.E) {
	hcode, _ := strconv.Atoi(strconv.Itoa(e.Code)[:3])
	type errInfo struct {
		Code        string `json:"code"`
		Description string `json:"description"`
	}
	toCode := map[int]string{
		http.StatusUnauthorized:        "Public.Unauthorized",        // 401
		http.StatusForbidden:           "Public.Forbidden",           // 403
		http.StatusNotFound:            "Public.NotFound",            // 404
		http.StatusInternalServerError: "Public.InternalServerError", // 500
	}
	errCode := toCode[hcode]
	if errCode == "" {
		errCode = "Public.UnknownError"
	}

	c.JSON(hcode, errInfo{
		Code:        errCode,
		Description: e.Error(),
	})
}
