package server

import (
	"system-backend/internal/config"
	"system-backend/internal/database"
	"system-backend/internal/logger"
	"system-backend/internal/midware"
	"system-backend/internal/pkg/authorization"
	"system-backend/internal/pkg/deployservice"
	"system-backend/internal/pkg/hydra"
	"system-backend/internal/pkg/usermgnt"
	"system-backend/internal/router"
	"system-backend/internal/server"
	businessdomain "system-backend/internal/service/business_domain"
	"system-backend/internal/service/resource"

	_ "github.com/joho/godotenv/autoload"
)

func Main() {
	var (
		app               = config.NewConfig()
		log               = logger.NewLogger(app)
		db                = database.NewGorm(app, log.WithField("module", "database"))
		cliAuthorization  = authorization.NewAuthorization(app, log)
		cliDeployService  = deployservice.NewDeployService(app)
		cliUserMgnt       = usermgnt.NewUserMgnt(app)
		cliHydra          = hydra.NewHydra(app)
		svcBusinessDomain = businessdomain.NewBusinessDomainService(app, log.WithField("module", "business_domain"), db)
		svcResource       = resource.NewResourceService(app, log.WithField("module", "resource"), db)
		mwAuth            = midware.AuthMiddleware(cliAuthorization, cliHydra, cliUserMgnt)
		mwAccount         = midware.AccountMiddleware(cliUserMgnt)
	)

	// srv
	srv := server.NewServer(app, log,
		router.RegistryHealth(db, cliAuthorization, cliDeployService),
		router.RegistryBusinessDomain(svcBusinessDomain, mwAuth),
		router.RegistryResourceTypeInstanceList(svcBusinessDomain),
		router.RegistryResource(svcResource, mwAuth, mwAccount),
	)

	srv.Start()
}
