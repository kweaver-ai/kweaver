package resource

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	service "system-backend/internal/service/resource"

	"github.com/gin-gonic/gin"
)

type listResourceItem struct {
	BDID     string `json:"bd_id"`
	ID       string `json:"id"`
	Type     string `json:"type"`
	CreateBy string `json:"create_by"`
}

type paginationResponse struct {
	Limit  int                `json:"limit"`
	Offset int                `json:"offset"`
	Total  int64              `json:"total"`
	Items  []listResourceItem `json:"items"`
}

type searchRequest struct {
	Limit  int    `form:"limit,default=20"`
	Offset int    `form:"offset,default=0"`
	BDID   string `form:"bd_id" binding:"required"`
	Type   string `form:"type"`
	ID     string `form:"id"`
}

func Search(svc *service.ResourceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var query searchRequest
		if err := c.ShouldBindQuery(&query); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}

		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		rel, total, err := svc.Search(actx.UserInfo, &service.ResourceObject{
			BDID:         query.BDID,
			ResourceID:   query.ID,
			ResourceType: query.Type,
		}, query.Limit, query.Offset)

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		items := make([]listResourceItem, 0, len(rel))
		for _, r := range rel {
			items = append(items, listResourceItem{
				BDID:     r.BDID,
				ID:       r.ResourceID,
				Type:     r.ResourceType,
				CreateBy: r.CreateBy,
			})
		}

		c.JSON(http.StatusOK, paginationResponse{
			Items:  items,
			Limit:  query.Limit,
			Offset: query.Offset,
			Total:  total,
		})
	}
}

func InternalSearch(svc *service.ResourceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var query searchRequest
		if err := c.ShouldBindQuery(&query); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				SetErr(err).
				GinFailed(c)
			return
		}
		obj := &service.ResourceObject{
			BDID:         query.BDID,
			ResourceID:   query.ID,
			ResourceType: query.Type,
		}
		actx := c.MustGet(midware.KeyAccountContext).(*midware.AccountContext) // bypass auth midware

		var err error
		var rel []*service.ResourceObject
		var total int64
		if actx.UserInfo != nil {
			rel, total, err = svc.Search(actx.UserInfo, obj, query.Limit, query.Offset)
		} else {
			rel, total, err = svc.InternalSearch(obj, query.Limit, query.Offset)
		}

		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		items := make([]listResourceItem, 0, len(rel))
		for _, r := range rel {
			items = append(items, listResourceItem{
				BDID:     r.BDID,
				ID:       r.ResourceID,
				Type:     r.ResourceType,
				CreateBy: r.CreateBy,
			})
		}

		c.JSON(http.StatusOK, paginationResponse{
			Items:  items,
			Limit:  query.Limit,
			Offset: query.Offset,
			Total:  total,
		})
	}
}
