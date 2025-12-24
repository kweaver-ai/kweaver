package router

import (
	businessdomain "system-backend/internal/router/business_domain"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

func RegistryBusinessDomain(svc svc.BusinessDomainServiceInterface, authMW gin.HandlerFunc) func(g *gin.Engine) error {
	return func(g *gin.Engine) error {
		gr := g.Group("/api/business-system/v1/business-domain")
		gra := gr.Use(authMW)
		{
			gra.POST("", businessdomain.Create(svc))
			gra.GET("", businessdomain.List(svc))
			gra.GET("/:bdid", businessdomain.Get(svc))
			gra.DELETE("/:bdid", businessdomain.Delete(svc))
			gra.PUT("/:bdid", businessdomain.Edit(svc))
		}
		grma := gr.Group("/members").Use(authMW)
		{
			grma.GET("/:bdid", businessdomain.MemberList(svc))
			grma.POST("/:bdid", businessdomain.MemberEdit(svc))
		}

		return nil
	}
}
