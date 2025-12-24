package webapp

import (
	"net/http"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/config"
	"workstation-backend/internal/logic/webapp"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type API struct {
	Logic  *webapp.WebappLogic
	Config *config.AppConfig
	Log    logrus.FieldLogger
}

// RegisterApp godoc
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
//	@Router			/api/workstation/v1/webapp/{name} [post]
//	@Router			/api/workstation/v1/webapp/{name} [put]
func (api *API) RegisterApp(deleteBefore bool) gin.HandlerFunc {
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

		rel, err := api.Logic.RegisterApp(name, manifest, deleteBefore)
		if err != nil {
			cerror.AsError(err).Reply(c)
			return
		}

		c.JSON(http.StatusCreated, rel)
	}
}

// BatchRegisterApps godoc
//
//	@Summary		批量注册WebAPP
//	@Description	注册WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			manifests	body	[]webapp.Manifest	true	"WebApp列表"
//	@Success		201			"注册WebAPP成功"
//	@Failure		400			"注册WebAPP失败, 参数异常"
//	@Router			/api/workstation/v1/webapp [post]
//	@Router			/api/workstation/v1/webapp [put]
func (api *API) BatchRegisterApps(deleteBefore bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data []webapp.Manifest
		err := c.ShouldBindBodyWithJSON(&data)
		if err != nil {
			cerror.Reply(
				cerror.NewError(
					cerror.CodeParamsInvalidError,
					"body data parse failed",
					err.Error(),
				),
				c,
			)
			return
		}
		if len(data) == 0 {
			cerror.Reply(
				cerror.NewError(cerror.CodeParamsInvalidError, "body data is empty", ""),
				c,
			)
			return
		}

		err = api.Logic.BatchRegisterApps(data, deleteBefore)
		if err != nil {
			cerror.AsError(err).Reply(c)
			return
		}

		c.JSON(http.StatusCreated, gin.H{})
	}
}

// UnregisterApp godoc
//
//	@Summary		注销WebAPP
//	@Description	注销WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			name	path	string	true	"注销的WebAPP名"
//	@Success		200		"注销成功"
//	@Failure		500		"注销失败"
//	@Router			/api/workstation/v1/webapp/{name} [delete]
func (api *API) UnregisterApp(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}
	err := api.Logic.BatchUnregisterApps([]string{name})
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}

// BatchUnregisterApps godoc
//
//	@Summary		批量注销WebAPP
//	@Description	批量注销WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			names	body	array	true	"注销的WebAPP名列表"
//	@Success		200		"注销成功"
//	@Failure		500		"注销失败"
//	@Router			/api/workstation/v1/webapp [delete]
func (api *API) BatchUnregisterApps(c *gin.Context) {
	var names []string
	err := c.ShouldBindBodyWithJSON(&names)
	if err != nil {
		cerror.Reply(
			cerror.NewError(cerror.CodeParamsInvalidError, "body data parse failed", err.Error()),
			c,
		)
		return
	}
	if len(names) == 0 {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "body data is empty", ""), c)
		return
	}

	err = api.Logic.BatchUnregisterApps(names)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{})
}
