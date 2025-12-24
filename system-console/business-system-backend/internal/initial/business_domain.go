package initial

import (
	"context"
	"errors"
	"system-backend/internal/model"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/deployservice"
	businessdomain "system-backend/internal/service/business_domain"

	"github.com/duke-git/lancet/v2/slice"
	"gorm.io/gorm"
)

var PublicBusinessDomain = businessdomain.BusinessDomainObject{
	ID:          "bd_public",
	Name:        "公共业务域",
	Description: "面向所有用户，存放公共资源",
	Members: []businessdomain.BusinessDomainMemberObject{
		{
			Role:  model.MemberRoleDeveloper,
			UID:   "00000000-0000-0000-0000-000000000000",
			UType: "department",
			UName: "00000000-0000-0000-0000-000000000000",
		},
	},
}

func InitBusinessDomain(
	db *gorm.DB,
	cliAuthorization *authorization.Authorization,
	cliDeployService *deployservice.DeployService,
) error {
	ctx := context.TODO()
	_, err := gorm.G[model.BusinessDomain](db).Where("f_bd_id = ?", PublicBusinessDomain.ID).First(ctx)
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
	}
	if err == nil {
		return nil
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		products, err := cliDeployService.Products()
		if err != nil {
			return err
		}

		mps := make([]model.BDProductR, 0, len(products))
		for _, p := range products {
			mps = append(mps, model.BDProductR{
				BDID:     PublicBusinessDomain.ID,
				PID:      p.ID,
				CreateBy: model.CreatorSystem,
			})
		}

		err = gorm.G[model.BDProductR](tx).CreateInBatches(ctx, &mps, len(mps))
		if err != nil {
			return err
		}

		err = gorm.G[model.BusinessDomain](tx).Create(ctx, &model.BusinessDomain{
			BDID:            PublicBusinessDomain.ID,
			BDName:          PublicBusinessDomain.Name,
			BDDescription:   PublicBusinessDomain.Description,
			BDCreator:       model.CreatorSystem,
			BDStatus:        1,
			BDResourceCount: 0,
			BDMemberCount:   len(PublicBusinessDomain.Members),
		})
		if err != nil {
			return err
		}

		members := slice.Map(
			PublicBusinessDomain.Members,
			func(_ int, member businessdomain.BusinessDomainMemberObject) *authorization.MemberInfo {
				return &authorization.MemberInfo{
					UID:   member.UID,
					UName: member.UName,
					UType: member.UType,
					Role:  member.Role,
				}
			},
		)

		err = cliAuthorization.BDAddMembers(
			PublicBusinessDomain.ID,
			PublicBusinessDomain.Name,
			members,
		)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		_ = cliAuthorization.BDResetMember(PublicBusinessDomain.ID)
		return err
	}
	return nil
}
