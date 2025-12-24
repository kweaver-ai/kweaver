package router

import (
	"system-backend/internal/router/resource"
	svc "system-backend/internal/service/resource"

	"github.com/gin-gonic/gin"
)

func RegistryResource(svc *svc.ResourceService, authMW, accountMW gin.HandlerFunc) func(g *gin.Engine) error {
	return func(g *gin.Engine) error {
		gra := g.Group("/api/business-system/v1/resource").Use(authMW)
		{
			gra.DELETE("", resource.Unlink(svc))
			gra.POST("", resource.Connect(svc))
			gra.GET("", resource.Search(svc))
		}
		gri := g.Group("/internal/api/business-system/v1/resource").Use(accountMW)
		{
			gri.DELETE("", resource.InternalUnlink(svc))
			gri.POST("", resource.InternalConnect(svc))
			gri.POST("/batch", resource.InternalBatchConnect(svc))
			gri.GET("", resource.InternalSearch(svc))
		}

		return nil
	}
}
