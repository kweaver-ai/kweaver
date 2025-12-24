package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

type createRequestMember struct {
	ID   string `json:"id"`
	Role string `json:"role"`
	Type string `json:"type" binding:"required,oneof=user"`
}
type createRequest struct {
	Name        string                `json:"name" binding:"required"`
	Description string                `json:"description"`
	Products    []string              `json:"products" binding:"required"`
	Members     []createRequestMember `json:"members"`
}

type createResponse struct {
	ID string `json:"id"`
}

func createRequest2Obj(req createRequest) *svc.BusinessDomainObject {
	ms := make([]svc.BusinessDomainMemberObject, 0, len(req.Members)+1)
	for _, m := range req.Members {
		ms = append(ms, svc.BusinessDomainMemberObject{
			UID:   m.ID,
			Role:  m.Role,
			UType: m.Type,
		})
	}
	return &svc.BusinessDomainObject{
		Name:        req.Name,
		Description: req.Description,
		Products:    req.Products,
		Members:     ms,
	}
}

func Create(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req createRequest
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

		bdid, err := svc.Create(actx.UserInfo, createRequest2Obj(req))
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.JSON(http.StatusCreated, createResponse{ID: bdid})
	}
}
