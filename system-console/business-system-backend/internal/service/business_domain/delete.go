package businessdomain

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/usermgnt"

	"gorm.io/gorm"
)

func (svc *BusinessDomainService) Delete(u *usermgnt.UserInfo, bdid string) error {
	ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		return cerror.
			New(cerror.ErrCodeForbidden).
			SetHttpCode(http.StatusForbidden).
			WithMessage("you are not allowed to delete business domain")
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

	// 不能删除系统业务域
	if m.BDCreator == model.CreatorSystem {
		return cerror.
			New(cerror.ErrCodeForbidden).
			SetHttpCode(http.StatusForbidden).
			WithMessage("you are not allowed to delete system business domain")
	}

	// TODO: indirect use f_member_count
	cnt, err := gorm.G[model.BDResourceR](svc.db).Where("f_bd_id = ?", bdid).Count(ctx, "id")
	if err != nil {
		return err
	}

	if cnt > 0 {
		return cerror.
			New(cerror.ErrCodeResourceExist).
			SetHttpCode(http.StatusForbidden).
			WithMessage("business domain has resources").
			WithData(map[string]int64{"resource_count": cnt})
	}

	err = svc.db.Transaction(func(tx *gorm.DB) error {
		// bug: https://github.com/go-gorm/gorm/issues/7555
		// _, err := gorm.G[model.BDProductR](tx.Unscoped()).Where("f_bd_id = ?", bdid).Delete(ctx)
		err := tx.Unscoped().Where("f_bd_id = ?", bdid).Delete(&model.BDProductR{}).Error
		if err != nil {
			return err
		}
		// num, err := gorm.G[model.BusinessDomain](tx).Where("f_bd_id = ?", bdid).Delete(ctx)
		delResult := tx.Unscoped().Where("f_bd_id = ?", bdid).Delete(&model.BusinessDomain{})
		if delResult.Error != nil {
			return delResult.Error
		}
		if delResult.RowsAffected == 0 {
			return cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				WithMessage("business domain not found")
		}

		err = svc.createClearMembers(bdid)
		if err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return err
	}

	err = svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
		Level:       auditlog.LevelWARN,
		Operation:   auditlog.OperationDelete,
		Description: fmt.Sprintf("删除 业务域“%s” 成功", m.BDName),
		Object: auditlog.Tobject{
			ID:   bdid,
			Name: m.BDName,
			Type: auditlog.BDObjectType,
		},
	})
	if err != nil {
		return err
	}

	return nil
}
