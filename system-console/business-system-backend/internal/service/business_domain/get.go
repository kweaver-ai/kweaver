package businessdomain

import (
	"context"
	"errors"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"gorm.io/gorm"
)

func (svc *BusinessDomainService) Get(u *usermgnt.UserInfo, bdid string) (*BusinessDomainObject, error) {
	ctx := context.TODO() // TODO: use upstream context
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(bdid, u.ID, "user")
		if err != nil {
			return nil, err
		}

		if len(roles) == 0 {
			return nil, cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions or not found")
		}
	}

	bd, err := gorm.G[model.BusinessDomain](svc.db).Where("f_bd_id = ?", bdid).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				SetErr(err).
				WithMessage("business_domain not found")
		}
	}

	prs, err := gorm.G[model.BDProductR](svc.db).Where("f_bd_id = ?", bd.BDID).Find(ctx)
	if err != nil {
		return nil, err
	}

	products := make([]string, 0, len(prs))
	for _, pr := range prs {
		products = append(products, pr.PID)
	}

	creator, err := svc.cliUserMgnt.UserInfo(bd.BDCreator)
	if err != nil {
		return nil, err
	}

	return &BusinessDomainObject{
		ID:          bd.BDID,
		Name:        bd.BDName,
		Description: bd.BDDescription,
		Products:    products,
		CreateTime:  bd.CreatedAt,
		CreatorInfo: BusinessDomainCreatorInfo{
			ID:   creator.ID,
			Name: creator.Name,
		},
	}, nil
}
