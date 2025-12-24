package businessdomain

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/slice"
	"gorm.io/gorm"
)

func defaultTo(v, els string) string {
	if v == "" {
		return els
	}
	return v
}

func roleString(role string) string {
	switch role {
	case model.MemberRoleAdminitrator:
		return "管理员"
	case model.MemberRoleDeveloper:
		return "成员"
	default:
		return role
	}
}

func (svc *BusinessDomainService) MemberEdit(u *usermgnt.UserInfo, bdid string, add, update, remove []BusinessDomainMemberObject) error {
	ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(bdid, u.ID, "user")
		if err != nil {
			return err
		}

		if len(roles) == 0 {
			return cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions or not found")
		}

		if !slice.Contain(roles, model.MemberRoleAdminitrator) {
			return cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions, your role is not administrator").
				WithData(map[string][]string{"role": roles})
		}
	}

	m, err := gorm.G[model.BusinessDomain](svc.db).Where("f_bd_id = ?", bdid).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				WithMessage("business domain not found")
		}
		return err
	}

	// // 检查管理员是否被全部移除
	// if err := svc.memberEditValid(u, bdid, remove); err != nil {
	// 	return err
	// }

	if err := svc.memberEditAdd(ctx, &m, add); err != nil {
		return err
	}

	if err := svc.memberEditUpdate(ctx, &m, update); err != nil {
		return err
	}

	if err := svc.memberEditRemove(ctx, &m, remove); err != nil {
		return err
	}

	return nil
}

func (svc *BusinessDomainService) memberEditAdd(ctx context.Context, bdm *model.BusinessDomain, add []BusinessDomainMemberObject) error {

	mbrs := slice.Map(add, func(_ int, i BusinessDomainMemberObject) *authorization.MemberInfo {
		return &authorization.MemberInfo{
			Role:  i.Role,
			UID:   i.UID,
			UName: i.UName,
			UType: i.UType,
		}
	})

	err := svc.cliAuthorization.BDAddMembers(bdm.BDID, bdm.BDName, mbrs)
	if err != nil {
		if errors.Is(err, authorization.ErrUserNotFount) {
			return cerror.
				New(cerror.ErrCodeInternal).
				SetErr(err).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("failed to add members, member user not found")

		}
		return cerror.
			New(cerror.ErrCodeInternal).
			SetErr(err).
			SetHttpCode(http.StatusInternalServerError).
			WithMessage("failed to add members").
			WithData(slice.Map(mbrs, func(_ int, i *authorization.MemberInfo) map[string]string {
				return map[string]string{
					"id":   i.UID,
					"role": i.Role,
				}
			}))
	}
	if len(add) > 0 {
		err = svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
			Level:     auditlog.LevelINFO,
			Operation: auditlog.OperationAdd,
			Description: fmt.Sprintf(
				"业务域“%s”添加成员 %s 成功",
				bdm.BDName,
				strings.Join(
					slice.Map(add, func(_ int, a BusinessDomainMemberObject) string {
						return fmt.Sprintf("“%s”", defaultTo(a.UName, a.UID))
					}),
					"、",
				),
			),
			Object: auditlog.Tobject{
				ID:   bdm.BDID,
				Name: bdm.BDName,
				Type: auditlog.BDObjectType,
			},
			EXMsg: strings.Join(
				slice.Map(add, func(_ int, a BusinessDomainMemberObject) string {
					return fmt.Sprintf("%s权限：%s", defaultTo(a.UName, a.UID), roleString(a.Role))
				}),
				"；",
			),
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (svc *BusinessDomainService) memberEditUpdate(ctx context.Context, bdm *model.BusinessDomain, update []BusinessDomainMemberObject) error {
	for _, updateMember := range update {
		if err := svc.cliAuthorization.BDChangeMemberRole(bdm.BDID, updateMember.UID, updateMember.UType, updateMember.Role); err != nil {
			return cerror.
				New(cerror.ErrCodeInternal).
				SetErr(err).
				SetHttpCode(http.StatusInternalServerError).
				WithMessage("failed to update member").
				WithData(map[string]string{"id": updateMember.UID, "role": updateMember.Role})
		}
	}

	if len(update) > 0 {
		err := svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
			Level:     auditlog.LevelINFO,
			Operation: auditlog.OperationUpdate,
			Description: fmt.Sprintf(
				"将业务域“%s”里 %s",
				bdm.BDName,
				strings.Join(
					slice.Map(update, func(_ int, a BusinessDomainMemberObject) string {
						return fmt.Sprintf(
							"%s的权限从“%s”改成%s",
							defaultTo(a.UName, a.UID),
							roleString(a.ORole),
							roleString(a.Role),
						)
					}),
					";",
				),
			),
			Object: auditlog.Tobject{
				ID:   bdm.BDID,
				Name: bdm.BDName,
				Type: auditlog.BDObjectType,
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (svc *BusinessDomainService) memberEditRemove(ctx context.Context, bdm *model.BusinessDomain, remove []BusinessDomainMemberObject) error {

	for _, removeMember := range remove {
		if err := svc.cliAuthorization.BDRemoveMember(bdm.BDID, removeMember.UID, removeMember.UType); err != nil {
			return cerror.
				New(cerror.ErrCodeInternal).
				SetErr(err).
				SetHttpCode(http.StatusInternalServerError).
				WithMessage("failed to remove member").
				WithData(map[string]string{"id": removeMember.UID})
		}
	}

	if len(remove) > 0 {
		err := svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
			Level:     auditlog.LevelWARN,
			Operation: auditlog.OperationDelete,
			Description: fmt.Sprintf(
				"删除 业务域“%s”的成员“%s”成功",
				bdm.BDName,
				strings.Join(
					slice.Map(remove, func(_ int, a BusinessDomainMemberObject) string {
						return defaultTo(a.UName, a.UID)
					}),
					"、",
				),
			),
			Object: auditlog.Tobject{
				ID:   bdm.BDID,
				Name: bdm.BDName,
				Type: auditlog.BDObjectType,
			},
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// TODO: 检查管理员是否被全部移除
func (svc *BusinessDomainService) memberEditValid(u *usermgnt.UserInfo, bdid string, remove []BusinessDomainMemberObject) error {
	mbrs, _, err := svc.MemberList(u, bdid, -1, 0)
	if err != nil {
		return err
	}
	administrators := slice.Filter(mbrs, func(_ int, i *BusinessDomainMemberObject) bool {
		return i.Role == model.MemberRoleAdminitrator
	})

	administratorIDs := slice.Map(administrators, func(_ int, i *BusinessDomainMemberObject) string {
		return i.UID
	})

	removedIDs := slice.Map(remove, func(_ int, i BusinessDomainMemberObject) string {
		return i.UID
	})

	// 检查管理员是否被全部移除
	if slice.ContainSubSlice(removedIDs, administratorIDs) {
		return cerror.
			New(cerror.ErrCodeForbidden).
			SetHttpCode(http.StatusForbidden).
			WithMessage("insufficient permissions, at least one administrator must be left").
			WithData(map[string]string{"role": model.MemberRoleAdminitrator})
	}

	return nil
}
