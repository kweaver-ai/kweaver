package server

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"workstation-backend/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type Serve struct {
	app    *config.AppConfig
	server *http.Server
	logger logrus.FieldLogger
	engine *gin.Engine
}

//nolint:errcheck
func NewServer(app *config.AppConfig, log logrus.FieldLogger) *Serve {
	srv := &Serve{
		app:    app,
		logger: log,
	}
	srv.engine = gin.New()
	ginLogger := gin.Logger()
	if !app.LogConfig.EnableHealth {
		ginLogger = gin.LoggerWithConfig(gin.LoggerConfig{
			SkipPaths: []string{"/health/ready", "/health/alive"},
		})
	}
	srv.engine.Use(
		ginLogger,
		gin.Recovery(),
		// bodyLogger(log),
	)

	srv.server = &http.Server{
		Addr:    app.CommonConfig.ServeHost(),
		Handler: srv.engine,
	}

	return srv
}

func (srv *Serve) Start() {
	go func() {
		err := srv.server.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			srv.logger.WithError(err).Fatal("run server failed.")
		}
	}()
	srv.waitShutDownHttpServe()
}

func (srv *Serve) RgistryRoute(fcs ...func(*gin.Engine) error) error {
	for _, fc := range fcs {
		if err := fc(srv.engine); err != nil {
			return err
		}
	}
	return nil
}

func (srv *Serve) waitShutDownHttpServe() {
	srv.logger.Info("start wait shutdown server ...")
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	srv.logger.Info("shutdown server ...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := srv.server.Shutdown(ctx)
	if err != nil {
		srv.logger.WithError(err).Fatal("server shutdown failed.")
	}

	srv.logger.Info("server exiting ...")
}
