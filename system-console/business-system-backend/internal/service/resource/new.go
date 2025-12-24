package resource

import (
	"context"
	"errors"
	"net/http"
	"system-backend/internal/cerror"
	"system-backend/internal/config"
	"system-backend/internal/model"
	"system-backend/internal/pkg/authorization"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ResourceService struct {
	app *config.AppConfig
	log *logrus.Entry
	db  *gorm.DB

	cliAuthorization *authorization.Authorization
}

func NewResourceService(app *config.AppConfig, log *logrus.Entry, db *gorm.DB) *ResourceService {
	return &ResourceService{
		app:              app,
		log:              log,
		db:               db,
		cliAuthorization: authorization.NewAuthorization(app, log),
	}
}

func (svc *ResourceService) assertBusinessDomainExist(ctx context.Context, bdid string) error {
	// 检查业务域是否存在
	_, err := gorm.G[model.BusinessDomain](svc.db).Where("f_bd_id = ?", bdid).First(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return cerror.
				New(cerror.ErrCodeNotFound).
				SetHttpCode(http.StatusNotFound).
				SetErr(err).
				WithMessage("business domain not found").
				WithData(map[string]string{"bdid": bdid})
		}
		return err
	}
	return nil
}
