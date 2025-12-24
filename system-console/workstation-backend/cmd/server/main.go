package main

import (
	_ "github.com/joho/godotenv/autoload"
	"workstation-backend/internal/config"
	"workstation-backend/internal/logger"
	"workstation-backend/internal/logic"
	"workstation-backend/internal/persist/database"
	"workstation-backend/internal/routers"
	"workstation-backend/internal/server"
)

func Main() {
	cfg := config.NewConfig()
	log := logger.NewLogger(cfg)
	svc := server.NewServer(cfg, log)
	opt := database.NewGorm(cfg, log.WithField("module", "persist"))
	logics := logic.NewLogics(opt, cfg, log.WithField("module", "logic"))
	//nolint:errcheck
	svc.RgistryRoute(
		routers.RegistrySwag(),
		routers.RegistryHealth(opt),
		routers.RegistryWebapp(logics.Webapp, cfg, log.WithField("api", "webapp")),
		routers.RegistryWebappConfig(
			logics.WebappOverride,
			cfg,
			log.WithField("api", "webappoverride"),
		),
	)
	svc.Start()
}

// @title			StudioWeb Backend API
// @version		0.0.1
// @description	工作站服务API接口
// @contact.name	Kain.Jiang
// @contact.email	Kain.Jiang@aishu.cn
// @BasePath		/
func main() {
	Main()
}
