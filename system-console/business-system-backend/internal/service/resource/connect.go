package resource

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/slice"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (svc *ResourceService) Connect(u *usermgnt.UserInfo, obj *ResourceObject) error {
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

	return svc.InternalConnect(obj)
}

func (svc *ResourceService) InternalConnect(obj *ResourceObject) error {
	ctx := context.TODO() // TODO: use upstream context

	svc.log.WithField("connect_obj", obj).Debug("debug connect request")

	if err := svc.assertBusinessDomainExist(ctx, obj.BDID); err != nil {
		return err
	}

	_, err := gorm.G[model.BDResourceR](svc.db).
		Where("f_resource_id = ?", obj.ResourceID).
		Where("f_resource_type = ?", obj.ResourceType).
		First(ctx)
	if err == nil {
		return cerror.
			New(cerror.ErrCodeConflict).
			SetHttpCode(http.StatusConflict).
			WithMessage("resource already connected to business domain")
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	// 不存在，正常连接: 事务
	err = svc.db.Transaction(func(tx *gorm.DB) error {
		err := gorm.G[model.BDResourceR](svc.db).Create(ctx, &model.BDResourceR{
			DBID:         obj.BDID,
			ResourceID:   obj.ResourceID,
			ResourceType: obj.ResourceType,
			CreateBy:     obj.CreateBy,
		})
		if err != nil {
			return err
		}

		_, err = gorm.G[model.BusinessDomain](svc.db).
			Where("f_bd_id = ?", obj.BDID).
			Update(ctx,
				"f_bd_resource_count",
				gorm.Expr("f_bd_resource_count + ?", 1),
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

func (svc *ResourceService) InternalBatchConnect(bdid string, objs []*ResourceObject) error {
	ctx := context.TODO() // TODO: use upstream context

	svc.log.WithField("bdid", bdid).Debug("debug batch connect request")

	if err := svc.assertBusinessDomainExist(ctx, bdid); err != nil {
		return err
	}

	err := svc.db.Transaction(func(tx *gorm.DB) error {
		all := slice.Map(
			objs, func(index int, item *ResourceObject) model.BDResourceR {
				return model.BDResourceR{
					DBID:         bdid,
					ResourceID:   item.ResourceID,
					ResourceType: item.ResourceType,
					CreateBy:     item.CreateBy,
				}
			})

		// err := gorm.G[model.BDResourceR](svc.db).CreateInBatches(ctx, &all, len(all))
		result := svc.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "f_resource_id"}, {Name: "f_resource_type"}},
			DoNothing: true,
		}).CreateInBatches(all, len(all))
		if result.Error != nil {
			return result.Error
		}

		// 重新计数
		cnt, err := gorm.G[model.BDResourceR](svc.db).Where("f_bd_id = ?", bdid).Count(ctx, "id")
		if err != nil {
			return err
		}

		_, err = gorm.G[model.BusinessDomain](svc.db).
			Where("f_bd_id = ?", bdid).
			Update(ctx,
				"f_bd_resource_count",
				cnt,
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
