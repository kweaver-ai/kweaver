package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

func Delete(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token).SetLogOperator(actx.Operator)

		bdid := c.Param("bdid")

		err := svc.Delete(actx.UserInfo, bdid)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}
}
