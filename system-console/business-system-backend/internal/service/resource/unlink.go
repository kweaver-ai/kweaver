package resource

import (
	"context"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/slice"
	"gorm.io/gorm"
)

func (svc *ResourceService) Unlink(u *usermgnt.UserInfo, obj *ResourceObject) error {

	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(obj.BDID, u.ID, "user")
		if err != nil {
			return err
		}

		if !slice.ContainAny(roles, []string{
			model.MemberRoleAdminitrator,
			model.MemberRoleDeveloper,
		}) {
			return cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions to update business domain resource").
				WithData(map[string][]string{"role": roles})
		}
	}

	return svc.InternalUnlink(obj)
}

func (svc *ResourceService) InternalUnlink(obj *ResourceObject) error {
	ctx := context.TODO() // TODO: use upstream context

	svc.log.WithField("unlink_obj", obj).Debug("debug unlink request")

	if err := svc.assertBusinessDomainExist(ctx, obj.BDID); err != nil {
		return err
	}

	err := svc.db.Transaction(func(tx *gorm.DB) error {
		// _, err = gorm.G[model.BDResourceR](svc.db.Unscoped()).
		// 	Where("f_resource_id = ?", obj.ResourceID).
		// 	Where("f_resource_type = ?", obj.ResourceType).
		// 	Delete(ctx)
		result := tx.Unscoped().
			Where("f_resource_id = ?", obj.ResourceID).
			Where("f_resource_type = ?", obj.ResourceType).
			Delete(&model.BDResourceR{})
		if result.Error != nil {
			return result.Error
		}

		_, err := gorm.G[model.BusinessDomain](svc.db).
			Where("f_bd_id = ?", obj.BDID).
			Update(ctx,
				"f_bd_resource_count",
				gorm.Expr("f_bd_resource_count - ?", result.RowsAffected),
			)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return err
	}

	return nil
}
