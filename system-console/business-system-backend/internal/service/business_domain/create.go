package businessdomain

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/database"
	"system-backend/internal/model"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/usermgnt"

	"github.com/duke-git/lancet/v2/maputil"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (svc *BusinessDomainService) Create(u *usermgnt.UserInfo, obj *BusinessDomainObject) (string, error) {
	ctx := context.TODO() // TODO: use upstream context
	if !slices.Contains(u.Roles, "super_admin") {
		return "", cerror.
			New(cerror.ErrCodeForbidden).
			SetHttpCode(http.StatusForbidden).
			WithMessage("you are not allowed to create business domain")
	}

	svc.log.WithField("create_obj", obj).Debug("debug create request")

	memberRoles := make(map[string]BusinessDomainMemberObject, len(obj.Members)+1)
	for _, m := range obj.Members {
		memberRoles[m.UID] = m
		switch m.Role {
		case model.MemberRoleDeveloper, model.MemberRoleAdminitrator:
			// correct
		default:
			return "", cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("invalid member role").
				WithData(map[string]string{m.UID: m.Role})
		}
	}

	productsDetails, err := svc.cliDeployService.Products()
	if err != nil {
		return "", err
	}
	for _, pId := range obj.Products {
		if _, ok := productsDetails[pId]; !ok {
			return "", cerror.
				New(cerror.ErrCodeBadRequest).
				SetHttpCode(http.StatusBadRequest).
				WithMessage("invalid product id").
				WithData(map[string]string{"product_id": pId})
		}
	}

	memberRoles[u.ID] = BusinessDomainMemberObject{
		Role:  model.MemberRoleAdminitrator,
		UID:   u.ID,
		UName: u.Name,
		UType: "user",
	}

	bdID := uuid.New().String()

	products := make([]model.BDProductR, 0, len(obj.Products))
	for _, pId := range obj.Products {
		products = append(products, model.BDProductR{
			BDID:     bdID,
			PID:      pId,
			CreateBy: u.ID,
		})
	}

	err = svc.db.Transaction(func(tx *gorm.DB) error {
		var bdm = model.BusinessDomain{
			BDID:          bdID,
			BDName:        obj.Name,
			BDDescription: obj.Description,
			BDCreator:     u.ID,
			//
			BDIcon:          "",
			BDStatus:        1,
			BDResourceCount: 0,
			BDMemberCount:   len(memberRoles),
		}
		if err := gorm.G[model.BusinessDomain](tx).Create(ctx, &bdm); err != nil {
			// 创建失败
			return err
		}

		err := svc.memberEditAdd(ctx, &bdm, maputil.Values(memberRoles))
		if err != nil {
			return err // 加入成员失败
		}

		if err := gorm.G[model.BDProductR](tx).CreateInBatches(ctx, &products, len(obj.Products)); err != nil {
			// 管理产品失败
			return err
		}

		return nil
	})
	if err != nil {
		_ = svc.createClearMembers(bdID)
		if errors.Is(err, gorm.ErrDuplicatedKey) || database.MysqlErrCode(err) == database.ErrDuplicateEntryCode {
			err = cerror.
				New(cerror.ErrCodeConflict).
				SetHttpCode(http.StatusConflict).
				SetErr(err).
				WithMessage("this business name is exist").
				WithData(map[string]string{"bd_name": obj.Name})
		}
		return "", err
	}

	err = svc.cliAuditLog.SLog(ctx, auditlog.BDMessage{
		Level:       auditlog.LevelINFO,
		Operation:   auditlog.OperationCreate,
		Description: fmt.Sprintf("新建业务域“%s”成功", obj.Name),
		Object: auditlog.Tobject{
			ID:   bdID,
			Name: obj.Name,
			Type: auditlog.BDObjectType,
		},
		EXMsg: fmt.Sprintf("业务域描述：%s、所属产品线：dip", obj.Description),
	})
	if err != nil {
		return "", err
	}

	return bdID, nil
}

func (svc *BusinessDomainService) createClearMembers(bdid string) error {
	return svc.cliAuthorization.BDResetMember(bdid)
}
