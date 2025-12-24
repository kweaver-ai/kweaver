package router

import (
	"errors"
	"net/http"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/deployservice"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func dbHealth(db *gorm.DB) error {
	return db.Raw("select 1").Error
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func RegistryHealth(db *gorm.DB,
	auth *authorization.Authorization,
	dcli *deployservice.DeployService,
) func(g *gin.Engine) error {
	return func(g *gin.Engine) error {
		g.GET("/health/alive", func(ctx *gin.Context) {
			ctx.JSON(http.StatusOK, gin.H{
				"status": "ok",
			})
		})
		g.GET("/health/ready", func(ctx *gin.Context) {
			dbErr := dbHealth(db)
			authErr := auth.Health()
			dcliErr := dcli.Health()

			if errors.Join(dbErr, authErr) != nil {
				ctx.JSON(http.StatusServiceUnavailable, gin.H{
					"status": "error",
					"errors": gin.H{
						"database":       errString(dbErr),
						"authorization":  errString(authErr),
						"deploy-service": errString(dcliErr),
					},
				})
				return
			}

			ctx.JSON(http.StatusOK, gin.H{
				"status": "ok",
			})
		})
		return nil
	}
}
