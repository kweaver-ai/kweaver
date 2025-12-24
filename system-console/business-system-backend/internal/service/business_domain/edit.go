package businessdomain

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"system-backend/internal/cerror"
	"system-backend/internal/database"
	"system-backend/internal/model"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/slice"
	"gorm.io/gorm"
)

func (svc *BusinessDomainService) Edit(u *usermgnt.UserInfo, bdid string, obj *BusinessDomainObject) error {
	ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(bdid, u.ID, "user")
		if err != nil {
			return err
		}

		if !slice.Contain(roles, model.MemberRoleAdminitrator) {
			return cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions to edit business domain").
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

	if len(obj.Products) > 0 {
		productsDetails, err := svc.cliDeployService.Products()
		if err != nil {
			return err
		}
		for _, pId := range obj.Products {
			if _, ok := productsDetails[pId]; !ok {
				return cerror.
					New(cerror.ErrCodeBadRequest).
					SetHttpCode(http.StatusBadRequest).
					WithMessage("invalid product id").
					WithData(map[string]string{"product_id": pId})
			}
		}
	}

	err = svc.db.Transaction(func(tx *gorm.DB) error {
		r, err := gorm.G[model.BusinessDomain](tx).Where("f_bd_id = ?", bdid).Updates(ctx, model.BusinessDomain{
			BDName:        obj.Name,
			BDDescription: obj.Description,
		})
		if err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) || database.MysqlErrCode(err) == database.ErrDuplicateEntryCode {
				return cerror.
					New(cerror.ErrCodeConflict).
					SetErr(err).
					SetHttpCode(http.StatusConflict).
					WithMessage("this business name is exist").
					WithData(map[string]string{"bd_name": obj.Name})
			}
			return err
		}

		if r == 0 {
			return cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				SetErr(err).
				WithMessage("business_domain not found")
		}
		if len(obj.Products) > 0 {
			// _, err := gorm.G[model.BDProductR](tx.Unscoped()).Where("f_bd_id = ?", bdid).Delete(ctx)
			err := tx.Unscoped().Where("f_bd_id = ?", bdid).Delete(&model.BDProductR{}).Error
			if err != nil {
				return err
			}
			products := make([]model.BDProductR, 0, len(obj.Products))
			for _, pid := range obj.Products {
				products = append(products, model.BDProductR{
					BDID:     bdid,
					PID:      pid,
					CreateBy: u.ID,
				})
			}
			err = gorm.G[model.BDProductR](tx).CreateInBatches(ctx, &products, len(products))
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return err
	}

	err = svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
		Level:       auditlog.LevelWARN,
		Operation:   auditlog.OperationUpdate,
		Description: fmt.Sprintf("修改 业务域“%s” 信息成功", m.BDName),
		Object: auditlog.Tobject{
			ID:   bdid,
			Name: m.BDName,
			Type: auditlog.BDObjectType,
		},
		EXMsg: func() string {
			infos := make([]string, 0, 2)
			if obj.Name != "" {
				infos = append(infos, fmt.Sprintf("将业务域名称“%s”改成“%s”；", m.BDName, obj.Name))
			}
			if obj.Description != "" {
				infos = append(infos, fmt.Sprintf("将业务域描述“%s”改成“%s”；", m.BDDescription, obj.Description))
			}
			return strings.Join(infos, "")
		}(),
	})
	if err != nil {
		return err
	}

	return nil
}
