package businessdomain

import (
	"system-backend/internal/config"
	"system-backend/internal/pkg/auditlog"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/deployservice"
	"system-backend/internal/pkg/usermgnt"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// BusinessDomainService 实现了 BusinessDomainServiceInterface 接口
type BusinessDomainService struct {
	app *config.AppConfig
	log *logrus.Entry
	db  *gorm.DB

	cliAuthorization authorization.AuthorizationInterface
	cliDeployService deployservice.DeployServiceInterface
	cliUserMgnt      usermgnt.UserMgntInterface
	cliAuditLog      auditlog.AuditLogInterface
}

// 确保 BusinessDomainService 实现了 BusinessDomainServiceInterface 接口
var _ BusinessDomainServiceInterface = (*BusinessDomainService)(nil)

func NewBusinessDomainService(app *config.AppConfig, log *logrus.Entry, db *gorm.DB) *BusinessDomainService {
	return &BusinessDomainService{
		app:              app,
		log:              log,
		db:               db,
		cliAuthorization: authorization.NewAuthorization(app, log),
		cliDeployService: deployservice.NewDeployService(app),
		cliUserMgnt:      usermgnt.NewUserMgnt(app),
		cliAuditLog:      auditlog.NewAuditLog(app, log),
	}
}
