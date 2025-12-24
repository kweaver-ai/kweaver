package routers

import (
	"net/http"

	_ "workstation-backend/docs"
	"workstation-backend/internal/config"
	webappOverrideLogic "workstation-backend/internal/logic/override"
	webappLogic "workstation-backend/internal/logic/webapp"
	"workstation-backend/internal/persist"
	"workstation-backend/internal/routers/health"
	"workstation-backend/internal/routers/webapp"
	"workstation-backend/internal/routers/webappoverride"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func RegistrySwag() func(g *gin.Engine) error {
	return func(g *gin.Engine) error {
		g.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
		g.GET("/api-docs", func(ctx *gin.Context) {
			ctx.Redirect(http.StatusMovedPermanently, "/swagger/index.html")
		})
		return nil
	}
}

func RegistryHealth(s persist.Persist) func(g *gin.Engine) error {
	api := &health.API{Persist: s}
	return func(g *gin.Engine) error {
		g.GET("/health/alive", api.ApiHealthAlive)
		g.GET("/health/ready", api.ApiHealthReady)
		return nil
	}
}

func RegistryWebapp(
	l *webappLogic.WebappLogic,
	app *config.AppConfig,
	log logrus.FieldLogger,
) func(g *gin.Engine) error {
	api := &webapp.API{Logic: l, Config: app, Log: log}
	return func(g *gin.Engine) error {
		r := g.Group(app.CommonConfig.Prefix).Group("/v1")

		r.PUT("/custom/webapp/:name", api.CreateCustomApp(true))
		r.POST("/custom/webapp/:name", api.CreateCustomApp(false))
		r.DELETE("/custom/webapp/:name", api.DeleteCustomApp)

		r.PUT("/webapp/:name", api.RegisterApp(true))
		r.POST("/webapp/:name", api.RegisterApp(false))
		r.DELETE("/webapp/:name", api.UnregisterApp)

		r.PUT("/webapp", api.BatchRegisterApps(true))
		r.POST("/webapp", api.BatchRegisterApps(false))
		r.DELETE("/webapp", api.BatchUnregisterApps)

		r.GET("/webapp/:name", api.QueryApp)

		r.GET("/raw/webapp", api.ListRawApp)
		r.GET("/menu", api.ListMenu)
		return nil
	}
}

func RegistryWebappConfig(
	l *webappOverrideLogic.OverrideLogic,
	app *config.AppConfig,
	log logrus.FieldLogger,
) func(g *gin.Engine) error {
	api := &webappoverride.API{Logic: l, Config: app, Log: log}
	return func(g *gin.Engine) error {
		r := g.Group(app.CommonConfig.Prefix).Group("/v1")
		r.GET("/webappconfig/:name", api.QueryAppConfig)
		r.GET("/webappconfig", api.BatchQueryAppConfig)
		r.PATCH("/webappconfig/:name", api.SetAppConfig)
		r.PATCH("/webappconfig", api.BatchSetAppConfig)
		r.DELETE("/webappconfig/:name", api.RemoveAppConfig)
		r.DELETE("/webappconfig", api.BatchRemoveAppConfig)
		return nil
	}
}
