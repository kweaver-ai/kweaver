package router

import (
	"net/http"
	"system-backend/internal/pkg/authorization"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

type errorRespone struct {
	Code        string `json:"code"`
	Description string `json:"description"`
}
type entry struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
}
type successRespone struct {
	TotalCount int64   `json:"total_count"`
	Entries    []entry `json:"entries"`
}

func RegistryResourceTypeInstanceList(svc *svc.BusinessDomainService) func(g *gin.Engine) error {
	return func(g *gin.Engine) error {
		g.GET(authorization.BDResourceTypeInstanceURL, func(ctx *gin.Context) {
			var query struct {
				Limit   int    `form:"limit,default=50"`
				Offset  int    `form:"offset,default=0"`
				Keyword string `form:"keyword"`
			}
			if err := ctx.ShouldBindQuery(&query); err != nil {
				ctx.JSON(http.StatusBadRequest, errorRespone{
					Code:        "Public.BadRequest",
					Description: err.Error(),
				})
				return
			}
			rel, cnt, err := svc.ResourceTypeInstanceList(query.Limit, query.Offset, query.Keyword)
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, errorRespone{
					Code:        "Public.InternalServerError",
					Description: err.Error(),
				})
				return
			}

			items := make([]entry, 0, len(rel))
			for _, v := range rel {
				items = append(items, entry{
					ID:   v.ID,
					Name: v.Name,
					Type: authorization.BDResourceTypeName,
				})
			}
			ctx.JSON(http.StatusOK, successRespone{
				TotalCount: cnt,
				Entries:    items,
			})
		})
		return nil
	}
}
