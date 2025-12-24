package businessdomain

import (
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/slice"
)

func (svc *BusinessDomainService) MemberList(u *usermgnt.UserInfo, bdid string, limit, offset int) ([]*BusinessDomainMemberObject, int, error) {
	// ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(bdid, u.ID, "user")
		if err != nil {
			return nil, 0, err
		}

		if !slice.Contain(roles, model.MemberRoleAdminitrator) {
			return nil, 0, cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions or not found")
		}

		// if role != model.MemberRoleAdminitrator {
		// 	return nil, 0, cerror.
		// 		New(cerror.ErrCodeForbidden).
		// 		SetHttpCode(http.StatusForbidden).
		// 		WithMessage("insufficient permissions, your role is not administrator").
		// 		WithData(map[string]string{"role": role})
		// }
	}

	mbrs, all, err := svc.cliAuthorization.BDGetMember(bdid, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	result := make([]*BusinessDomainMemberObject, 0, len(mbrs))
	for _, m := range mbrs {
		result = append(result, &BusinessDomainMemberObject{
			UID:        m.UID,
			UName:      m.UName,
			UType:      m.UType,
			Role:       m.Role,
			ParentDeps: m.ParentDeps,
		})
	}

	return result, all, nil
}
