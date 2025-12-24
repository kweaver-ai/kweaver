package resource

import (
	"context"
	"net/http"
	"slices"
	"system-backend/internal/cerror"
	"system-backend/internal/model"
	"system-backend/internal/pkg/usermgnt"

	"gorm.io/gorm"
)

func (svc *ResourceService) Search(u *usermgnt.UserInfo, obj *ResourceObject, limit, offset int) ([]*ResourceObject, int64, error) {
	isSuperAdmin := slices.Contains(u.Roles, "super_admin")
	if !isSuperAdmin {
		roles, err := svc.cliAuthorization.CheckBDMember(obj.BDID, u.ID, "user")
		if err != nil {
			return nil, 0, err
		}

		if len(roles) == 0 {
			return nil, 0, cerror.
				New(cerror.ErrCodeForbidden).
				SetHttpCode(http.StatusForbidden).
				WithMessage("insufficient permissions to search resource")
		}
	}

	return svc.InternalSearch(obj, limit, offset)
}

func (svc *ResourceService) InternalSearch(obj *ResourceObject, limit, offset int) ([]*ResourceObject, int64, error) {
	ctx := context.TODO() // TODO: use upstream context

	svc.log.WithField("search_obj", obj).Debug("debug search request")
	query := gorm.G[model.BDResourceR](svc.db).Where("f_bd_id = ?", obj.BDID)
	if obj.ResourceType != "" {
		query = query.Where("f_resource_type = ?", obj.ResourceType)
	}
	if obj.ResourceID != "" {
		query = query.Where("f_resource_id = ?", obj.ResourceID)
	}

	cnt, err := query.Count(ctx, "id")
	if err != nil {
		return nil, 0, err
	}

	if limit != -1 {
		query = query.Limit(limit).Offset(offset)
	}

	srs, err := query.Find(ctx)
	if err != nil {
		return nil, 0, err
	}

	result := make([]*ResourceObject, 0, len(srs))
	for _, sr := range srs {
		result = append(result, &ResourceObject{
			BDID:         sr.DBID,
			CreateBy:     sr.CreateBy,
			ResourceID:   sr.ResourceID,
			ResourceType: sr.ResourceType,
		})
	}

	return result, cnt, nil
}
