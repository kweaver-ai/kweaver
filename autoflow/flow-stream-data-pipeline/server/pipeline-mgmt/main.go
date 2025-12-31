package main

import (
	// _ "net/http/pprof"

	"context"
	"net/http"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/audit"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	_ "go.uber.org/automaxprocs"

	"flow-stream-data-pipeline/common"
	access "flow-stream-data-pipeline/pipeline-mgmt/drivenadapters"
	"flow-stream-data-pipeline/pipeline-mgmt/driveradapters"
	"flow-stream-data-pipeline/pipeline-mgmt/logics"
)

type mgrService struct {
	appSetting  *common.AppSetting
	restHandler driveradapters.RestHandler
}

func (server *mgrService) start() {
	logger.Info("Server Starting")

	// 初始化内置管道
	init := logics.NewPipelineInit(server.appSetting)
	init.Init()
	logger.Info("Server Init Internal Pipeline Success")

	// 创建gin.engine 并注册Public API
	engine := gin.New()

	server.restHandler.RegisterPublic(engine)
	logger.Info("Server Register API Success")

	// 监听中断信号（SIGINT、SIGTERM）
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	// 在收到信号的时候，会自动触发 ctx 的 Done ，这个 stop 是不再捕获注册的信号的意思，算是一种释放资源。
	defer stop()

	// 初始化http服务
	s := &http.Server{
		Addr:           ":" + strconv.Itoa(server.appSetting.ServerSetting.HttpPort),
		Handler:        engine,
		ReadTimeout:    server.appSetting.ServerSetting.ReadTimeOut * time.Second,
		WriteTimeout:   server.appSetting.ServerSetting.WriteTimeout * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// 启动http服务
	go func() {
		err := s.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			logger.Fatalf("s.ListenAndServe err:%v", err)
		}
	}()

	<-ctx.Done()
	// 重置系统中断信号处理
	// stop()

	// 设置系统最后处理时间
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 停止http服务
	logger.Info("Server Start Shutdown")
	if err := s.Shutdown(ctx); err != nil {
		logger.Fatalf("Server Shutdown:%v", err)
	}
	logger.Info("Server Exiting")
}

func main() {
	// 开启 pprof
	// go func() {
	//     logger.Info(http.ListenAndServe(":9999", nil))
	// }()

	logger.Info("Server Starting")

	// 初始化服务配置
	appSetting := common.NewSetting()

	logger.Info("Server Init Setting Success")

	// 设置错误码语言
	rest.SetLang(appSetting.ServerSetting.Language)
	logger.Info("Server Set Language Success")

	// 设置gin运行模式
	gin.SetMode(appSetting.ServerSetting.RunMode)
	logger.Info("Server Set RunMode Success")

	logger.Infof("Server Start By Port:%d", appSetting.ServerSetting.HttpPort)

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

	audit.Init(&appSetting.MQSetting)

	// Set顺序按字母升序排序
	logics.SetIndexBaseAccess(access.NewIndexBaseAccess(appSetting))
	logics.SetMQAccess(access.NewMQAccess(appSetting))
	logics.SetPermissionAccess(access.NewPermissionAccess(appSetting))
	logics.SetPipelineMgmtAccess(access.NewPipelineMgmtAccess(appSetting))

	server := &mgrService{
		appSetting:  appSetting,
		restHandler: driveradapters.NewRestHandler(appSetting),
	}
	server.start()
}
