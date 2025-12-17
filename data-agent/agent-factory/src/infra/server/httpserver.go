package server

import (
    "context"
    "fmt"
    "net/http"

    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/apimiddleware"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/anysharedshandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/categoryhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/otherhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/permissionhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/personalspacehandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/producthandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/publishedhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/releasehandler"

    //"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/spacehandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/squarehandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/testhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/tplhandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/public/v3/v3agentconfighandler"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/ihandlerportdriver"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/cenvhelper"
    "github.com/gin-gonic/gin"
)

type httpServer struct {
    // HTTP 服务器实例
    httpSrv *http.Server

    // 健康检查
    httpHealthHandler ihandlerportdriver.IHTTPHealthRouter

    // agent 配置
    v3AgentConfigHandler ihandlerportdriver.IHTTPRouter

    // agent 模板
    v3AgentTplHandler ihandlerportdriver.IHTTPRouter

    // 产品相关接口
    productHandler ihandlerportdriver.IHTTPRouter

    // 分类相关接口
    categoryHandler ihandlerportdriver.IHTTPRouter

    // 发布相关接口
    releaseHandler ihandlerportdriver.IHTTPRouter

    // agent 广场相关接口
    squareHandler ihandlerportdriver.IHTTPRouter

    // 权限相关接口
    permissionHandler ihandlerportdriver.IHTTPRouter

    // 空间相关接口
    // spaceHandler *spacehandler.SpaceHTTPHandler

    // 个人空间相关接口
    personalSpaceHandler *personalspacehandler.PersonalSpaceHTTPHandler

    // 发布相关接口
    publishedHandler ihandlerportdriver.IHTTPRouter

    // other
    otherHandler ihandlerportdriver.IHTTPRouter
    // test
    testHandler ihandlerportdriver.IHTTPRouter
    // anyshare 文档库代理接口（临时）
    anysharedsHandler ihandlerportdriver.IHTTPRouter
}

func NewHTTPServer() IServer {
    s := &httpServer{
        httpHealthHandler:    api.NewHTTPHealthHandler(),
        v3AgentConfigHandler: v3agentconfighandler.NewDAConfHTTPHandler(),
        v3AgentTplHandler:    tplhandler.NewDATplHTTPHandler(),
        productHandler:       producthandler.NewProductHTTPHandler(),
        categoryHandler:      categoryhandler.NewCategoryHandler(),
        releaseHandler:       releasehandler.NewReleaseHandler(),
        squareHandler:        squarehandler.NewSquareHandler(),
        publishedHandler:     publishedhandler.NewPublishedHandler(),
        permissionHandler:    permissionhandler.NewPermissionHandler(),
        // spaceHandler:         spacehandler.NewSpaceHTTPHandler(),
        personalSpaceHandler: personalspacehandler.GetPersonalSpaceHTTPHandler(),
        otherHandler:         otherhandler.NewOtherHTTPHandler(),
        testHandler:          testhandler.NewTestHTTPHandler(),
        anysharedsHandler:    anysharedshandler.NewAnysharedsHandler(),
    }

    return s
}

func (s *httpServer) Start() {
    // 内部接口（通过AD的网关转发）
    go func() {
        // 初始化AR Tracer
        // arTrace := scartrace.NewARTrace()
        gin.SetMode(gin.ReleaseMode)

        if cenvhelper.IsLocalDev() {
            gin.SetMode(gin.DebugMode)
        }

        engine := gin.New()

        // 开启 ContextWithFallback
        engine.ContextWithFallback = true

        engine.Use(gin.Logger())

        // 注册路由 - 健康检查
        routerHealth := engine.Group("/health")
        s.httpHealthHandler.RegHealthRouter(routerHealth)

        // v3 router 2025-04-10 add
        s.v3PubRouter(engine)
        s.v3PriRouter(engine)

        url := fmt.Sprintf("%s:%d", global.GConfig.Project.Host, global.GConfig.Project.Port)

        // 创建 HTTP 服务器
        s.httpSrv = &http.Server{
            Addr:    url,
            Handler: engine,
        }

        // 启动服务器
        err := s.httpSrv.ListenAndServe()
        if err != nil && err != http.ErrServerClosed {
            err = fmt.Errorf("http server start failed, err: %w", err)
            panic(err)
        }
    }()
}

// Shutdown 优雅关闭服务器
func (s *httpServer) Shutdown(ctx context.Context) error {
    if s.httpSrv == nil {
        return nil
    }

    // 直接使用传入的上下文，由调用方控制超时
    return s.httpSrv.Shutdown(ctx)
}

func (s *httpServer) v3PubRouter(engine *gin.Engine) {
    router := engine.Group("/api/agent-factory/v3")

    // 外部接口默认不使用默认业务域
    isUseDefaultBizDomain := false

    if cenvhelper.IsLocalDev() {
        isUseDefaultBizDomain = true

        router.Use(capimiddleware.Cors())

        // 添加通用OPTIONS路由处理CORS预检请求
        router.OPTIONS("/*path", func(c *gin.Context) {})
    }

    router.Use(
        capimiddleware.Recovery(),
        capimiddleware.RequestLoggerMiddleware(),
        capimiddleware.ErrorHandler(),
        // 获取访问语言
        capimiddleware.Language(),
        // 新增 Hydra 接口鉴权，开发环境可以临时屏蔽
        capimiddleware.VerifyOAuthMiddleWare(),
        // 业务域
        capimiddleware.HandleBizDomain(isUseDefaultBizDomain),
        apimiddleware.VisitorTypeCheck(),
    )

    s.v3AgentConfigHandler.RegPubRouter(router)
    s.v3AgentTplHandler.RegPubRouter(router)
    s.productHandler.RegPubRouter(router)
    s.categoryHandler.RegPubRouter(router)
    s.releaseHandler.RegPubRouter(router)
    s.squareHandler.RegPubRouter(router)
    s.permissionHandler.RegPubRouter(router)
    s.publishedHandler.RegPubRouter(router)

    s.personalSpaceHandler.RegPubRouter(router)
    // s.spaceHandler.RegPubRouter(router)
    s.otherHandler.RegPubRouter(router)
    s.testHandler.RegPubRouter(router)
    s.anysharedsHandler.RegPubRouter(router)
}

func (s *httpServer) v3PriRouter(engine *gin.Engine) {
    internalRouterG := engine.Group("/api/agent-factory/internal/v3")

    // 内部接口默认使用默认业务域
    isUseDefaultBizDomain := true

    if cenvhelper.IsLocalDev() {
        //isUseDefaultBizDomain = false
    }

    internalRouterG.Use(
        capimiddleware.Recovery(),
        capimiddleware.ErrorHandler(),
        capimiddleware.RequestLoggerMiddleware(),
        capimiddleware.Language(),
        capimiddleware.HandleBizDomain(isUseDefaultBizDomain),
    )

    s.releaseHandler.RegPriRouter(internalRouterG)
    s.v3AgentConfigHandler.RegPriRouter(internalRouterG)
    s.v3AgentTplHandler.RegPriRouter(internalRouterG)
    s.squareHandler.RegPriRouter(internalRouterG)
    s.publishedHandler.RegPriRouter(internalRouterG)
    s.permissionHandler.RegPriRouter(internalRouterG)
    s.otherHandler.RegPriRouter(internalRouterG)
    s.testHandler.RegPriRouter(internalRouterG)
}
