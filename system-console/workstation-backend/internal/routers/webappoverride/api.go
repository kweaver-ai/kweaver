package webappoverride

import (
	"net/http"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/config"
	"workstation-backend/internal/logic/override"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type API struct {
	Logic  *override.OverrideLogic
	Config *config.AppConfig
	Log    logrus.FieldLogger
}

// QueryAppConfig godoc
//
//	@Summary		查询App配置
//	@Description	查询App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			name	path		string			true	"WebApp名"
//	@Param			uid		query		string			true	"设置ID"
//	@Success		200		{object}	override.Config	"查询App配置成功"
//	@Failure		400		"查询App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig/{name} [get]
func (api *API) QueryAppConfig(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}

	uid := c.Query("uid")
	if uid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "uid is empty", ""), c)
		return
	}

	cfg, err := api.Logic.GetConfig(uid, name)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// BatchQueryAppConfig godoc
//
//	@Summary		批量查询App配置
//	@Description	批量查询App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			names	body		[]string					true	"WebApp名"
//	@Param			uid		query		string						true	"设置ID"
//	@Success		200		{object}	map[string]override.Config	"查询App配置成功"
//	@Failure		400		"查询App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig [get]
func (api *API) BatchQueryAppConfig(c *gin.Context) {
	uid := c.Query("uid")
	if uid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "uid is empty", ""), c)
		return
	}

	var names []string
	err := c.BindJSON(&names)
	if err != nil {
		cerror.NewError(cerror.CodeParamsInvalidError, "params invalid", err.Error()).Reply(c)
		return
	}

	cfgs, err := api.Logic.BatchGetConfig(uid, names)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, cfgs)
}

// SetAppConfig godoc
//
//	@Summary		设置App配置
//	@Description	设置App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			config	body	override.Config	true	"WebApp配置内容"
//	@Param			name	path	string			true	"WebApp名"
//	@Param			sid		query	string			true	"设置ID"
//	@Success		200		"设置App配置成功"
//	@Failure		400		"设置App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig/{name} [patch]
func (api *API) SetAppConfig(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}

	sid := c.Query("sid")
	if sid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "sid is empty", ""), c)
		return
	}

	var cfg override.Config
	err := c.ShouldBindBodyWithJSON(&cfg)
	if err != nil {
		cerror.Reply(
			cerror.NewError(cerror.CodeParamsInvalidError, "config parse failed", err.Error()),
			c,
		)
		return
	}

	err = api.Logic.SetConfig(sid, name, cfg)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, nil)
}

// BatchSetAppConfig godoc
//
//	@Summary		批量设置App配置
//	@Description	批量设置App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			config	body	map[string]override.Config	true	"WebApp配置内容"
//	@Param			sid		query	string						true	"设置ID"
//	@Success		200		"设置App配置成功"
//	@Failure		400		"设置App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig [patch]
func (api *API) BatchSetAppConfig(c *gin.Context) {
	sid := c.Query("sid")
	if sid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "sid is empty", ""), c)
		return
	}

	var cfgs map[string]override.Config
	err := c.ShouldBindBodyWithJSON(&cfgs)
	if err != nil {
		cerror.Reply(
			cerror.NewError(cerror.CodeParamsInvalidError, "config parse failed", err.Error()),
			c,
		)
		return
	}

	err = api.Logic.BatchSetConfig(sid, cfgs)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, nil)
}

// RemoveAppConfig godoc
//
//	@Summary		清空App配置
//	@Description	清空App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			name	path	string	true	"WebApp名, *代表所有"
//	@Param			sid		query	string	true	"设置ID"
//	@Success		200		"清空App配置成功"
//	@Failure		400		"清空App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig/{name} [delete]
func (api *API) RemoveAppConfig(c *gin.Context) {
	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}

	sid := c.Query("sid")
	if sid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "sid is empty", ""), c)
		return
	}

	err := api.Logic.DeleteConfig(sid, name)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, nil)
}

// BatchRemoveAppConfig godoc
//
//	@Summary		批量清空App配置
//	@Description	批量清空App配置
//	@Tags			WebAppConfig
//	@Accept			json
//	@Produce		json
//	@Param			name	body	[]string	true	"WebApp名"
//	@Param			sid		query	string		true	"设置ID"
//	@Success		200		"清空App配置成功"
//	@Failure		400		"清空App配置失败, 服务异常"
//	@Router			/api/workstation/v1/webappconfig/ [delete]
func (api *API) BatchRemoveAppConfig(c *gin.Context) {
	sid := c.Query("sid")
	if sid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "sid is empty", ""), c)
		return
	}

	var names []string
	err := c.BindJSON(&names)
	if err != nil {
		cerror.NewError(cerror.CodeParamsInvalidError, "params invalid", err.Error()).Reply(c)
		return
	}

	err = api.Logic.BatchDeleteConfig(sid, names)
	if err != nil {
		cerror.AsError(err).Reply(c)
		return
	}

	c.JSON(http.StatusOK, nil)
}
