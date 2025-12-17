package main

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/driveradapters"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/logics/mcp"

	"github.com/gin-gonic/gin"
)

// Server 服务
type Server struct {
	// 健康检查
	httpHealthHandler  interfaces.HTTPRouterInterface
	restPublicHandler  interfaces.HTTPRouterInterface
	restPrivateHandler interfaces.HTTPRouterInterface
	config             *config.Config
}

// Start 开启服务
func (s *Server) Start() {
	// 初始化mcp服务实例
	mcpInstanceService := mcp.NewMCPInstanceService()
	err := mcpInstanceService.InitOnStartup(context.Background())
	if err != nil {
		s.config.Logger.Errorf("init mcp instance on startup failed, error: %v", err)
	}

	gin.SetMode(gin.ReleaseMode)

	go func() {
		// 注册路由 - 健康检查
		engine := gin.New()
		engine.Use(gin.Recovery())
		engine.UseRawPath = true
		routerHealth := engine.Group("/health")
		s.httpHealthHandler.RegisterRouter(routerHealth)

		// 注册内部接口路由 - 算子相关接口
		routerInternalGroup := engine.Group("/api/agent-operator-app/internal-v1")
		routerInternalGroup.Use(gin.Recovery())
		s.restPrivateHandler.RegisterRouter(routerInternalGroup)

		// 注册外部路由
		routerGroup := engine.Group("/api/agent-operator-app/v1")
		routerGroup.Use(gin.Recovery())
		s.restPublicHandler.RegisterRouter(routerGroup)

		url := fmt.Sprintf("%s:%d", s.config.Project.Host, s.config.Project.Port)
		err := engine.Run(url)
		if err != nil {
			s.config.Logger.Errorf("start server failed, error: %v", err)
		}

	}()

}

func main() {
	// 初始化全局配置
	config := config.NewConfigLoader()
	// 设置错误码语言
	common.SetLang(config.Project.Language)
	s := &Server{
		config:             config,
		httpHealthHandler:  driveradapters.NewHTTPHealthHandler(),
		restPublicHandler:  driveradapters.NewRestPublicHandler(config.Logger),
		restPrivateHandler: driveradapters.NewRestPrivateHandler(config.Logger),
	}
	s.config.Logger.Info("start agent-operator-app server")
	defer s.config.Logger.Info("stop agent-operator-app server")
	s.Start()
	select {}
}
