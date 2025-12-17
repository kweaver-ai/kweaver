package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/boot"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/server"
)

func main() {
	boot.Init()

	s := server.NewHTTPServer()
	s.Start()

	// 创建一个通道来接收操作系统信号
	quit := make(chan os.Signal, 1)
	// 注册通道接收特定的信号
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 阻塞，直到接收到信号
	<-quit
	log.Println("正在关闭服务器...")

	// 创建一个超时上下文，给服务器10秒时间优雅关闭
	timeout := 10 * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	// 尝试优雅关闭服务器
	if err := s.Shutdown(ctx); err != nil {
		log.Printf("服务器强制关闭: %v", err)
		os.Exit(1)
	}

	log.Println("服务器已退出")
}
