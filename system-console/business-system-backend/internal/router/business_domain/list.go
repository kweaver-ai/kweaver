package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"
	"time"

	"github.com/gin-gonic/gin"
)

type listResponseItem struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Creator     string    `json:"creator"`
	Products    []string  `json:"products"`
	CreateTime  time.Time `json:"create_time"`
}

func List(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		bds, err := svc.List(actx.UserInfo)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		result := make([]listResponseItem, 0, len(bds))
		for _, bd := range bds {
			result = append(result, listResponseItem{
				ID:          bd.ID,
				Name:        bd.Name,
				Description: bd.Description,
				Creator:     bd.CreatorInfo.Name,
				Products:    bd.Products,
				CreateTime:  bd.CreateTime,
			})
		}
		c.JSON(http.StatusOK, result)
	}
}
