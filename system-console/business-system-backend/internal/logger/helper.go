package logger

import (
	"strings"
	"system-backend/internal/config"

	"github.com/sirupsen/logrus"
)

func NewLogger(app *config.AppConfig) *logrus.Entry {
	logger := logrus.New()

	switch strings.ToLower(strings.TrimSpace(app.LogConfig.Format)) {
	case "json":
		logger.SetFormatter(&logrus.JSONFormatter{})
	case "text":
		logger.SetFormatter(&logrus.TextFormatter{})
	default:
		logrus.WithField("format", app.LogConfig.Format).Warn("unknown log format, default to text")
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
