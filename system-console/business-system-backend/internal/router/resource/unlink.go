package resource

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	service "system-backend/internal/service/resource"

	"github.com/gin-gonic/gin"
)

type unlinkRequest struct {
	BDID string `form:"bd_id"  binding:"required"`
	ID   string `form:"id" binding:"required"`
	Type string `form:"type" binding:"required"`
}

func Unlink(svc *service.ResourceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req unlinkRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		err := svc.Unlink(actx.UserInfo, &service.ResourceObject{
			BDID:         req.BDID,
			ResourceID:   req.ID,
			ResourceType: req.Type,
		})

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}
}

func InternalUnlink(svc *service.ResourceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req unlinkRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		obj := &service.ResourceObject{
			BDID:         req.BDID,
			ResourceID:   req.ID,
			ResourceType: req.Type,
		}

		actx := c.MustGet(midware.KeyAccountContext).(*midware.AccountContext) // bypass auth midware

		var err error
		if actx.UserInfo != nil {
			err = svc.Unlink(actx.UserInfo, obj)
		} else {
			err = svc.InternalUnlink(obj)
		}

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}
}
