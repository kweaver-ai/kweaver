package main

import (
	"workstation-backend/internal/config"
	"workstation-backend/internal/logger"
	"workstation-backend/internal/persist/database"

	_ "github.com/joho/godotenv/autoload"
)

func Main() {
	cfg := config.NewConfig()
	log := logger.NewLogger(cfg)
	opt := database.NewGorm(cfg, log.WithField("module", "persist"))
	err := opt.InitDatabase()
	if err != nil {
		log.WithError(err).Fatalln("init database data failed.")
	}
}

func main() {
	Main()
}
