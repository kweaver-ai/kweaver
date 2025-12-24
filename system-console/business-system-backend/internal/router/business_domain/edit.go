package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

type editRequest struct {
	Name        string                `json:"name" binding:"required"`
	Description string                `json:"description"`
	Products    []string              `json:"products" binding:"required"`
	Members     []createRequestMember `json:"members"`
}

func editRequest2Obj(req editRequest) *svc.BusinessDomainObject {
	return &svc.BusinessDomainObject{
		Name:        req.Name,
		Description: req.Description,
		Products:    req.Products,
	}
}

func Edit(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req editRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token).SetLogOperator(actx.Operator)
		bdid := c.Param("bdid")

		err := svc.Edit(actx.UserInfo, bdid, editRequest2Obj(req))
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}
}
