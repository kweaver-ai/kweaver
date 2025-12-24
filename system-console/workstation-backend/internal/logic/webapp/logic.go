package webapp

import (
	"github.com/sirupsen/logrus"
	"workstation-backend/internal/config"
	"workstation-backend/internal/persist"
	"workstation-backend/internal/pkg/authorization"
)

type WebappLogic struct {
	operator persist.Persist
	app      *config.AppConfig
	log      logrus.FieldLogger
	authCli  *authorization.Client
}

func NewLogic(opt persist.Persist, app *config.AppConfig, log logrus.FieldLogger) *WebappLogic {
	return &WebappLogic{
		operator: opt,
		app:      app,
		log:      log,
		authCli:  authorization.NewClient(app.DepsConfig.AuthBaseURL),
	}
}
