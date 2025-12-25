package webapp

import (
	"fmt"
	"net/http"
	"strconv"

	"workstation-backend/internal/cache"
	"workstation-backend/internal/cerror"
	"workstation-backend/internal/logic/webapp"

	"github.com/gin-gonic/gin"
)

// QueryApp godoc
//
//	@Summary		查询WebAPP
//	@Description	查询WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Param			uid			query		string			true	"用户ID"
//	@Param			sid			query		string			false	"设置ID"
//	@Param			with-setted	query		bool			false	"是否附加设置项：默认true"
//	@Param			with-moved	query		bool			false	"是否附加移动项：默认true"
//	@Param			with-authed	query		bool			false	"附加用户权限过滤：默认true"
//	@Param			name		path		string			true	"查询的WebAPP名"
//	@Success		200			{object}	webapp.Manifest	"查询的WebAPP数据"
//	@Failure		500			"查询的WebAPP失败"
//	@Failure		404			"查询的WebAPP不存在"
//	@Router			/api/workstation/v1/webapp/{name} [get]
func (api *API) QueryApp(c *gin.Context) {
	uid := c.Query("uid")
	if uid == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "uid is empty", ""), c)
		return
	}

	name := c.Param("name")
	if name == "" {
		cerror.Reply(cerror.NewError(cerror.CodeParamsInvalidError, "name is empty", ""), c)
		return
	}

	sid := c.DefaultQuery("sid", api.Config.CommonConfig.GlobalSID)

	// 解析布尔失败则为 `false`
	queryBoolFor := func(key string, defaultValue bool) bool {
		boolStr := c.DefaultQuery(key, strconv.FormatBool(defaultValue))
		rel, err := strconv.ParseBool(boolStr)
		if err != nil {
			// cerror.NewError(cerror.CodeParamsInvalidError, "invalid "+key, "").Reply(c)
			return false
		}
		return rel
	}

	withSetted := queryBoolFor("with-setted", true)
	withMoved := queryBoolFor("with-moved", true)
	withAuthed := queryBoolFor("with-authed", true)

	cacheKey := fmt.Sprintf("webapp:%s:%s:%s:%t:%t:%t", name, uid, sid, withSetted, withMoved, withAuthed)

	var rel webapp.Manifest
	if cacheRel, ok := cache.Get(cacheKey); ok {
		rel = cacheRel.(webapp.Manifest)
	} else {
		// 未命中缓存
		var err error
		rel, err = api.Logic.QueryApp(webapp.QueryWebAppParams{
			Name:       name,
			Uid:        uid,
			Sid:        sid,
			WithSetted: withSetted,
			WithMoved:  withMoved,
			WithAuthed: withAuthed,
		})
		if err != nil {
			cerror.AsError(err).Reply(c)
			return
		}
		cache.Set(cacheKey, rel, api.Config.CommonConfig.CacheTimeDuration())
	}

	c.JSON(http.StatusOK, rel)
}
