package drivenadapters

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	otelHttp "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/http"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
)

//go:generate mockgen -package mock_drivenadapters -source ../drivenadapters/appstore.go -destination ../tests/mock_drivenadapters/appstore_mock.go

// Appstore method interface
type Appstore interface {
	// 获取白名单状态
	GetWhiteListStatus(context.Context, string, string) (map[string]interface{}, error)
}

type appList struct {
	log        commonLog.Logger
	baseURL    string
	httpClient otelHttp.HTTPClient
}

// AppInfo 小程序基本信息
type AppInfo struct {
	Command    string `json:"command"`
	FunctionID string `json:"functionid"`
	HomePage   string `json:"homepage"`
	Route      string `json:"route"`
}

var (
	aOnce sync.Once
	a     Appstore
)

// NewAppStore 创建appstore服务
func NewAppStore() Appstore {
	aOnce.Do(func() {
		config := common.NewConfig()
		a = &appList{
			log:        commonLog.NewLogger(),
			baseURL:    fmt.Sprintf("http://%s:%v", config.Appstore.PublicHost, config.Appstore.PublicPort),
			httpClient: NewOtelHTTPClient(),
		}
	})
	return a
}

func (a *appList) GetWhiteListStatus(ctx context.Context, name, token string) (map[string]interface{}, error) {
	log := traceLog.WithContext(ctx)
	target := fmt.Sprintf("%s/api/appstore/v1/app/%s/accessible", a.baseURL, name)
	headers := map[string]string{
		"Authorization": token,
		"Content-Type":  "application/json;charset=UTF-8",
	}
	_, respParam, err := a.httpClient.Get(ctx, target, headers)
	if err != nil {
		log.Warnf("GetWhiteListStatus failed: %v, url: %v", err, target)
		return nil, err
	}
	res := respParam.(map[string]interface{})

	return res, nil
}
