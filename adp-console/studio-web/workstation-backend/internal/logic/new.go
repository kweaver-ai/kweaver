package logic

import (
	"github.com/sirupsen/logrus"
	"workstation-backend/internal/config"
	"workstation-backend/internal/logic/override"
	"workstation-backend/internal/logic/webapp"
	"workstation-backend/internal/persist"
)

type Logics struct {
	Webapp         *webapp.WebappLogic
	WebappOverride *override.OverrideLogic
}

func NewLogics(opt persist.Persist, app *config.AppConfig, log logrus.FieldLogger) *Logics {
	return &Logics{
		Webapp:         webapp.NewLogic(opt, app, log.WithField("api", "webapp")),
		WebappOverride: override.NewLogic(opt, app, log.WithField("api", "webapp_override")),
	}
}
