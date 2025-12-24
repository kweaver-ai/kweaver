package resource

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	"system-backend/internal/model"
	service "system-backend/internal/service/resource"

	"github.com/gin-gonic/gin"
)

type connectRequest struct {
	ID   string `json:"id" binding:"required"`
	Type string `json:"type" binding:"required"`
	BDID string `json:"bd_id" binding:"required"`
}

func Connect(svc *service.ResourceService) gin.HandlerFunc {

	return func(c *gin.Context) {
		var req connectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		err := svc.Connect(actx.UserInfo, &service.ResourceObject{
			CreateBy:     actx.UserInfo.ID,
			ResourceID:   req.ID,
			ResourceType: req.Type,
			BDID:         req.BDID,
		})

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}

}

func InternalConnect(svc *service.ResourceService) gin.HandlerFunc {

	return func(c *gin.Context) {
		var req connectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		obj := &service.ResourceObject{
			CreateBy:     model.CreatorSystem,
			ResourceID:   req.ID,
			ResourceType: req.Type,
			BDID:         req.BDID,
		}

		actx := c.MustGet(midware.KeyAccountContext).(*midware.AccountContext) // bypass auth midware

		var err error
		if actx.UserInfo != nil {
			obj.CreateBy = actx.UserInfo.ID
			err = svc.Connect(actx.UserInfo, obj)
		} else {
			err = svc.InternalConnect(obj)
		}

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}

}

func InternalBatchConnect(svc *service.ResourceService) gin.HandlerFunc {

	return func(c *gin.Context) {
		var req []connectRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		objs := make([]*service.ResourceObject, 0, len(req))
		if len(req) == 0 {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("request body is empty").
				GinFailed(c)
			return
		}

		bdid := req[0].BDID
		for _, i := range req {
			if i.BDID != bdid {
				cerror.
					New(cerror.ErrCodeBadRequest).
					SetHttpCode(http.StatusBadRequest).
					WithMessage("bdid in request body is not equal").
					GinFailed(c)
				return
			}
			objs = append(objs, &service.ResourceObject{
				CreateBy:     model.CreatorSystem,
				ResourceID:   i.ID,
				ResourceType: i.Type,
				BDID:         bdid,
			})
		}

		err := svc.InternalBatchConnect(bdid, objs)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}

}
