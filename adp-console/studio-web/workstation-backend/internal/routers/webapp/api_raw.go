package webapp

import (
	"net/http"

	"workstation-backend/internal/cache"
	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"

	"github.com/gin-gonic/gin"
)

// ListRawApp godoc
//
//	@Summary		查询原始WebAPP
//	@Description	查询原始WebAPP
//	@Tags			WebApp
//	@Accept			json
//	@Produce		json
//	@Success		200	array	webapp.Manifest	"查询的WebAPP数据"
//	@Failure		500	"查询的WebAPP失败"
//	@Router			/api/workstation/v1/raw/webapp/ [get]
func (api *API) ListRawApp(c *gin.Context) {
	cacheKey := "raw:webapp"

	var rel []model.WebApp
	if cacheRel, ok := cache.Get(cacheKey); ok {
		rel = cacheRel.([]model.WebApp)
	} else {
		// 未命中缓存
		var err error
		rel, err = api.Logic.ListRawApp()
		if err != nil {
			cerror.AsError(err).Reply(c)
			return
		}
		cache.Set(cacheKey, rel, api.Config.CommonConfig.CacheTimeDuration())
	}

	c.JSON(http.StatusOK, rel)
}
