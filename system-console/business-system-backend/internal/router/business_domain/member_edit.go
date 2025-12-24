package businessdomain

import (
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/midware"
	svc "system-backend/internal/service/business_domain"

	"github.com/gin-gonic/gin"
)

type memberEditRequestItem struct {
	ID    string `json:"id"   binding:"required"`
	Type  string `json:"type" binding:"required"`
	Role  string `json:"role" binding:"required,oneof=administrator developer"`
	Name  string `json:"name"`
	ORole string `json:"old_role" binding:"omitempty,oneof=administrator developer"`
}

type memberRemoveRequestItem struct {
	ID   string `json:"id"   binding:"required"`
	Type string `json:"type" binding:"required"`
	Name string `json:"name"`
}

type memberEditRequest struct {
	Add    []memberEditRequestItem   `json:"add"    binding:"dive"`
	Update []memberEditRequestItem   `json:"update" binding:"dive"`
	Remove []memberRemoveRequestItem `json:"remove" binding:"dive"`
}

func membersEdit2Obj(items []memberEditRequestItem) []svc.BusinessDomainMemberObject {
	result := make([]svc.BusinessDomainMemberObject, 0, len(items))
	for _, i := range items {
		result = append(result, svc.BusinessDomainMemberObject{
			UID:   i.ID,
			UType: i.Type,
			Role:  i.Role,
			ORole: i.ORole,
			UName: i.Name,
		})
	}
	return result
}

func membersRemove2Obj(items []memberRemoveRequestItem) []svc.BusinessDomainMemberObject {
	result := make([]svc.BusinessDomainMemberObject, 0, len(items))
	for _, i := range items {
		result = append(result, svc.BusinessDomainMemberObject{
			UID:   i.ID,
			UType: i.Type,
			UName: i.Name,
		})
	}
	return result
}

func MemberEdit(svc svc.BusinessDomainServiceInterface) gin.HandlerFunc {
	return func(c *gin.Context) {
		actx := c.MustGet(midware.KeyAuthContext).(*midware.AuthContext) // bypass auth midware
		svc.SetToken(actx.Token).SetLogOperator(actx.Operator)
		bdid := c.Param("bdid")

		var requestData memberEditRequest

		if err := c.ShouldBindJSON(&requestData); err != nil {
			cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("failed to parse query parameters").
				WithCause(err.Error()).
				GinFailed(c)
			return
		}

		err := svc.MemberEdit(
			actx.UserInfo, bdid,
			membersEdit2Obj(requestData.Add),
			membersEdit2Obj(requestData.Update),
			membersRemove2Obj(requestData.Remove),
		)
		if err != nil {
			cerror.GinAutoFailed(c, err)
			return
		}

		c.Status(http.StatusOK)
	}
}
