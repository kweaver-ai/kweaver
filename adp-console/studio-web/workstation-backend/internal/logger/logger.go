package logger

import (
	"strings"

	"github.com/sirupsen/logrus"
	"workstation-backend/internal/config"
)

func NewLogger(app *config.AppConfig) logrus.FieldLogger {
	logger := logrus.New()
	switch strings.ToLower(strings.TrimSpace(app.LogConfig.Format)) {
	case "json":
		logger.SetFormatter(&logrus.JSONFormatter{})
	case "text":
		logger.SetFormatter(&logrus.TextFormatter{})
	default:
		logger.SetFormatter(&logrus.TextFormatter{})
	}
	level, err := logrus.ParseLevel(strings.ToLower(strings.TrimSpace(app.LogConfig.Level)))
	if err != nil {
		logrus.WithError(err).Error("parse log level failed, default to debug")
		level = logrus.DebugLevel
	}
	logger.SetLevel(level)
	logger.WithField("config", app).Debug("debug config info")
	return logger.WithFields(logrus.Fields{
		"app": app.CommonConfig.Name,
	})
}
