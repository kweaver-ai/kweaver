package override

import (
	"github.com/sirupsen/logrus"
	"workstation-backend/internal/config"
	"workstation-backend/internal/persist"
)

type OverrideLogic struct {
	operator persist.Persist
	app      *config.AppConfig
	log      logrus.FieldLogger
}

func NewLogic(opt persist.Persist, app *config.AppConfig, log logrus.FieldLogger) *OverrideLogic {
	return &OverrideLogic{
		operator: opt,
		app:      app,
		log:      log,
	}
}
