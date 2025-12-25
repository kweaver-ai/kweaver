package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"workstation-backend/internal/persist"
)

type API struct {
	Persist persist.Persist
}

type (
	ResponseAlive struct {
		Alive bool `json:"alive"`
	}
	ResponseReady struct {
		Ready bool `json:"ready"`
	}
	ResponseError struct {
		Error string `json:"error"`
	}
)

// ApiHealthAlive godoc
//
//	@Summary		健康探针
//	@Description	健康探针
//	@Tags			Heath
//	@Produce		json
//	@Success		200	{object}	ResponseAlive	"成功返回存活状态"
//	@Router			/health/alive [get]
func (api *API) ApiHealthAlive(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"alive": true})
}

// ApiHealthReady godoc
//
//	@Summary		就绪探针
//	@Description	就绪探针
//	@Tags			Heath
//	@Produce		json
//	@Success		200	{object}	ResponseReady	"成功返回就绪状态"
//	@Success		503	{object}	ResponseError	"失败返回未就绪错误"
//	@Router			/health/ready [get]
func (api *API) ApiHealthReady(c *gin.Context) {
	err := api.Persist.Check()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ready": true})
}
