package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

func Get(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		bdid := c.Param("bdid")

		bd, err := svc.Get(actx.UserInfo, bdid)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		result := &listResponseItem{
			ID:          bd.ID,
			Name:        bd.Name,
			Description: bd.Description,
			Creator:     bd.CreatorInfo.Name,
			Products:    bd.Products,
			CreateTime:  bd.CreateTime,
		}
		c.JSON(http.StatusOK, result)
	}
}
