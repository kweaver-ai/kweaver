package main

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/driveradapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	logicscommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/common"
	"github.com/gin-gonic/gin"
)

// Server 服务
type Server struct {
	// 健康检查
	httpHealthHandler  interfaces.HTTPRouterInterface
	restPublicHandler  interfaces.HTTPRouterInterface
	restPrivateHandler interfaces.HTTPRouterInterface
	outboxMessageEvent interfaces.App
	config             *config.Config
}

// Start 开启服务
func (s *Server) Start() {
	gin.SetMode(gin.ReleaseMode)
	err := s.outboxMessageEvent.Start()
	if err != nil {
		s.config.Logger.Errorf("start outbox message event failed, error: %v", err)
		panic(err)
	}
	go func() {
		// 注册路由 - 健康检查
		engine := gin.New()
		engine.Use(gin.Recovery())
		engine.UseRawPath = true
		routerHealth := engine.Group("/health")
		s.httpHealthHandler.RegisterRouter(routerHealth)

		// 注册内部接口路由 - 算子相关接口
		routerInternalGroup := engine.Group("/api/agent-operator-integration/internal-v1")
		routerInternalGroup.Use(gin.Recovery())
		s.restPrivateHandler.RegisterRouter(routerInternalGroup)

		// 注册外部路由 - 算子相关接口
		routerGroup := engine.Group("/api/agent-operator-integration/v1")
		routerGroup.Use(gin.Recovery())
		s.restPublicHandler.RegisterRouter(routerGroup)

		url := fmt.Sprintf("%s:%d", s.config.Project.Host, s.config.Project.Port)
		err := engine.Run(url)
		if err != nil {
			s.config.Logger.Errorf("start server failed, error: %v", err)
		}
	}()
}

// Stop 停止服务
func (s *Server) Stop(ctx context.Context) {
	s.config.Logger.Info("stop agent-operator-integration server")
	s.outboxMessageEvent.Stop(ctx)
}

func main() {
	// 初始化全局配置
	config := config.NewConfigLoader()
	// 设置错误码语言
	common.SetLang(config.Project.Language)
	s := &Server{
		config:             config,
		httpHealthHandler:  driveradapters.NewHTTPHealthHandler(),
		restPublicHandler:  driveradapters.NewRestPublicHandler(),
		restPrivateHandler: driveradapters.NewRestPrivateHandler(),
		outboxMessageEvent: logicscommon.NewOutboxMessageEvent(),
	}
	s.config.Logger.Info("start agent-operator-integration server")
	// 检查是否开启了可观测性
	if config.Observability.TraceEnabled {
		defer telemetry.StopTrace()
	}
	s.Start()
	defer s.Stop(context.Background())
	select {}
}
