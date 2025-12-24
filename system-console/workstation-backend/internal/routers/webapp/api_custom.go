package webapp

import (
	"net/http"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/logic/webapp"

	"github.com/gin-gonic/gin"
)

// CreateCustomApp godoc
//
//	@Summary		注册WebAPP
//	@Description	注册WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			name		path	string			true	"WebApp名"
//	@Param			manifest	body	webapp.Manifest	true	"WebApp清单数据"
//	@Success		201			"注册WebAPP成功"
//	@Failure		400			"注册WebAPP失败, 参数异常"
//	@Router			/api/workstation/v1/custom/webapp/{name} [post]
//	@Router			/api/workstation/v1/custom/webapp/{name} [put]
func (api *API) CreateCustomApp(deleteBefore bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		name := c.Param("name")
		if name == "" {
			cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
			return
		}
		var manifest webapp.Manifest
		err := c.ShouldBindBodyWithJSON(&manifest)
		if err != nil {
			cerror.Reply(
				cerror.NewError(
					cerror.CodeParamsInvalidError,
					"manifest parse failed",
					err.Error(),
				),
				c,
			)
			return
		}

		rel, err := api.Logic.CreateCustomApp(name, manifest, deleteBefore)
		if err != nil {
			cerror.AsError(err).Reply(c)
			return
		}

		c.JSON(http.StatusCreated, rel)
	}
}

// DeleteCustomApp godoc
//
//	@Summary		注销WebAPP
//	@Description	注销WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			name	path	string	true	"注销的WebAPP名"
//	@Success		200		"注销成功"
//	@Failure		500		"注销失败"
//	@Router			/api/workstation/v1/custom/webapp/{name} [delete]
func (api *API) DeleteCustomApp(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}
	err := api.Logic.DeleteCustomApps([]string{name})
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}
