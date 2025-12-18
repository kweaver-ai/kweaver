// Package main 模块
package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/admin"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/alarm"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/anydata"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/auth"
	cognitiveassistant "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/cognitive_assistant"
	cconfig "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/config"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/database_con"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/dataflow"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/executor"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/health"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/master"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/mgnt"
	modellib "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/model_lib"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/observability"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/operators"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/policy"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/security_policy"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/trigger"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/driveradapters/versions"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/module/initial"
	wlHttp "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/http"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
	threadPool "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/pools"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
)

type app struct {
	hRESTHandler        health.RESTHandler
	mRESTHandler        mgnt.RESTHandler
	aRESTHandler        auth.RESTHandler
	pRESTHandler        policy.RESTHandler
	tRESTHandler        trigger.RESTHandler
	tMQHandler          trigger.MQHandler
	spRESTHandler       security_policy.RESTHandler
	mLRESTHandler       modellib.RESTHandler
	tMaster             master.Master
	cRESTHandler        cognitiveassistant.RESTHandler
	executorRESTHandler executor.RESTHandler
	adminRESTHandler    admin.RESTHandler
	cfRESTHandler       cconfig.RESTHandler
	adRESTHandler       anydata.RESTHandler
	alarmRESTHandler    alarm.RESTHandler
	dfRESTHandler       dataflow.RESTHandler
	coRESTHandler       operators.RESTHandler
	obsRESTHandler      observability.RESTHandler
	dvRESTHandler       versions.RESTHandler
	dbRESTHandler       database_con.RESTHandler
}

func CacheControl() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Cache-Control", "no-cache")
	}
}

func (a *app) Start() {
	log := commonLog.NewLogger()
	log.Infoln("start server.....")

	debugMode := os.Getenv("DEBUG")
	if debugMode == "false" {
		gin.SetMode(gin.ReleaseMode)
	}

	go func() {
		engine := gin.New()
		engine.Use(gin.Recovery())
		engine.Use(CacheControl())
		engine.UseRawPath = true
		port := os.Getenv("API_SERVER_PORT")
		prefix := os.Getenv("API_PREFIX")

		group := engine.Group(prefix)
		group.Use(wlHttp.MiddlewareTrace(), wlHttp.LanguageMiddleware())

		// 注册API
		a.hRESTHandler.RegisterAPI(group)
		a.mRESTHandler.RegisterAPI(group)
		a.aRESTHandler.RegisterAPI(group)
		a.pRESTHandler.RegisterAPI(group)
		a.mLRESTHandler.RegisterAPI(group)
		a.executorRESTHandler.RegisterAPI(group)
		a.adminRESTHandler.RegisterAPI(group)
		a.cfRESTHandler.RegisterAPI(group)
		a.alarmRESTHandler.RegisterAPI(group)
		a.tRESTHandler.RegisterAPI(group)
		a.adRESTHandler.RegisterAPI(group)
		a.coRESTHandler.RegisterAPI(group)
		a.obsRESTHandler.RegisterAPI(group)
		a.dvRESTHandler.RegisterAPI(group)
		a.dbRESTHandler.RegisterAPI(group)
		spGroup := group.Group("security-policy")
		a.spRESTHandler.RegisterAPI(spGroup)

		cGroup := group.Group("cognitive-assistant")
		a.cRESTHandler.RegisterAPI(cGroup)

		dfGroup := group.Group("data-flow")
		a.dfRESTHandler.RegisterAPI(dfGroup)

		groupV2 := engine.Group(common.APIPREFIXV2)
		groupV2.Use(wlHttp.MiddlewareTrace())
		a.mRESTHandler.RegisterAPIv2(groupV2)

		if err := engine.Run(":" + port); err != nil {
			log.Errorln(err)
		}
	}()

	go func() {
		engine := gin.New()
		engine.Use(gin.Recovery())
		engine.Use(CacheControl())
		engine.UseRawPath = true
		port := os.Getenv("API_SERVER_PRIVATE_PORT")
		prefix := os.Getenv("API_PREFIX")

		group := engine.Group(prefix)

		// 注册API
		a.tRESTHandler.RegisterPrivateAPI(group)
		a.cfRESTHandler.RegisterPrivateAPI(group)
		a.mRESTHandler.RegisterPrivateAPI(group)
		a.coRESTHandler.RegisterPrivateAPI(group)

		spGroup := group.Group("security-policy")
		a.spRESTHandler.RegisterPrivateAPI(spGroup)

		if err := engine.Run(":" + port); err != nil {
			log.Errorln(err)
		}
	}()

	// 订阅nsq 处理订阅消息
	go func() {
		a.tMQHandler.Subscribe()
	}()

	go func() {
		a.tMaster.Run()
	}()
}

func main() {

	config, err := common.InitConfig()
	if err != nil {
		panic(err.Error())
	}
	defer traceLog.Close()
	defer traceLog.CloseFlowO11yLogger()

	if err := initial.Init(&initial.InitialOption{
		ParserWorkersCnt:         config.Server.ParserrCount,
		LowestExecutorWorkerCnt:  config.Server.LowestExecutorCount,
		LowExecutorWorkerCnt:     config.Server.LowExecutorCount,
		MediumExecutorWorkerCnt:  config.Server.MediumExecutorCount,
		HighExecutorWorkerCnt:    config.Server.HighExecutorCount,
		HighestExecutorWorkerCnt: config.Server.HighestExecutorCount,
		ListInsCount:             config.Server.ListInsCount,
		ExecutorTimeout:          time.Duration(config.Server.ExecutorTimeout) * time.Second,
		DagScheduleTimeout:       time.Duration(config.Server.ScheduleTimeout) * time.Second,
	}); err != nil {
		panic(err.Error())
	}
	defer initial.Close()

	tracerProvider := trace.SetTraceExporter(&config.Telemetry)
	defer func() {
		trace.ExitTraceExporter(context.Background(), tracerProvider)
	}()
	// 主动释放所有线程池资源
	defer threadPool.Pools.ShutdownAll()

	server := &app{
		hRESTHandler:        health.NewRESTHandler(),
		mRESTHandler:        mgnt.NewRESTHandler(),
		aRESTHandler:        auth.NewRESTHandler(),
		pRESTHandler:        policy.NewRESTHandler(),
		tRESTHandler:        trigger.NewRESTHandler(),
		tMQHandler:          trigger.NewMQHandler(),
		spRESTHandler:       security_policy.NewRESTHandler(),
		mLRESTHandler:       modellib.NewRESTHandler(),
		tMaster:             master.NewOnMaster(),
		cRESTHandler:        cognitiveassistant.NewRESTHandler(),
		executorRESTHandler: executor.NewRESTHandler(),
		adminRESTHandler:    admin.NewRESTHandler(),
		cfRESTHandler:       cconfig.NewRESTHandler(),
		alarmRESTHandler:    alarm.NewRESTHandler(),
		adRESTHandler:       anydata.NewRestHandler(),
		dfRESTHandler:       dataflow.NewRESTHandler(),
		coRESTHandler:       operators.NewRESTHandler(),
		obsRESTHandler:      observability.NewRESTHandler(),
		dvRESTHandler:       versions.NewRESTHandler(),
		dbRESTHandler:       database_con.NewRestHandler(),
	}
	server.Start()

	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT) //nolint
	<-c
}
