package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

type listMemberResponseItem struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Role       string `json:"role"`
	Type       string `json:"type"`
	ParentDeps []any  `json:"parent_deps"`
}

type paginationResonse struct {
	Limit  int                      `json:"limit"`
	Offset int                      `json:"offset"`
	Total  int                      `json:"total"`
	Items  []listMemberResponseItem `json:"items"`
}

func MemberList(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token)

		queryData := struct {
			Limit  int `form:"limit,default=20"`
			Offset int `form:"offset,default=0"`
		}{}

		if err := c.ShouldBindQuery(&queryData); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("failed to parse query parameters").
				WithCause(err.Error()).
				GinFailed(c)
			return
		}

		mbrs, total, err := svc.MemberList(actx.UserInfo, c.Param("bdid"), queryData.Limit, queryData.Offset)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		result := make([]listMemberResponseItem, 0, len(mbrs))
		for _, m := range mbrs {
			result = append(result, listMemberResponseItem{
				ID:         m.UID,
				Name:       m.UName,
				Role:       m.Role,
				Type:       m.UType,
				ParentDeps: m.ParentDeps,
			})
		}

		c.JSON(http.StatusOK, paginationResonse{
			Limit:  queryData.Limit,
			Offset: queryData.Offset,
			Total:  total,
			Items:  result,
		})

	}
}
