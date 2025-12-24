package initdb

import (
	"system-backend/internal/config"
	"system-backend/internal/database"
	"system-backend/internal/initial"
	"system-backend/internal/logger"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/deployservice"

	_ "github.com/joho/godotenv/autoload"
)

func Main() {
	var (
		app              = config.NewConfig()
		log              = logger.NewLogger(app)
		db               = database.NewGorm(app, log.WithField("module", "database"))
		cliAuthorization = authorization.NewAuthorization(app, log)
		cliDeployService = deployservice.NewDeployService(app)
	)

	{ // init
		err := initial.InitAuthorization(cliAuthorization, log.WithField("module", "initial"))
		if err != nil {
			log.WithError(err).Fatal("init stage failed: init authorization")
		}

		err = initial.InitBusinessDomain(db, cliAuthorization, cliDeployService)
		if err != nil {
			log.WithError(err).Fatal("init stage failed: init business domain")
		}
	}

}
