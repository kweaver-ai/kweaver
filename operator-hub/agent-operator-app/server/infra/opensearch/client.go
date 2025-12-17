package opensearch

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"github.com/olivere/elastic/v7"
)

var (
	once      sync.Once
	rawClient *elastic.Client
)

func NewRawEsClient() *elastic.Client {
	once.Do(func() {
		conf := config.NewConfigLoader()
		logger := conf.GetLogger()
		es := conf.OpenSearch

		// 创建一个自定义的HTTP客户端，添加详细日志
		httpClient := &http.Client{
			Timeout: 30 * time.Second,
		}

		// 使用最简单的配置
		var err error
		rawClient, err = elastic.NewClient(
			elastic.SetURL(GetHTTPAccess(es.Host, es.Port, es.Protocol)),
			elastic.SetBasicAuth(es.UserName, es.Password),
			elastic.SetHttpClient(httpClient),
			elastic.SetHealthcheck(false),
			elastic.SetSniff(false),
		)

		if err != nil {
			logger.Error("init es client failed", err)
			panic(err)
		} else {
			logger.Info("ES客户端初始化成功")
		}
	})
	return rawClient
}

// GetHTTPAccess 格式化http访问
func GetHTTPAccess(addr string, port int, protocol string) string {
	addr = ParseHost(addr)
	address := fmt.Sprintf("%s:%d", addr, port)
	if port == 0 {
		address = addr
	}

	return fmt.Sprintf("%s://%s", protocol, address)
}

// ParseHost 判定host是否为IPv6格式，如果是，返回 [host]
func ParseHost(host string) string {
	if strings.Contains(host, ":") && !strings.Contains(host, "[") && !strings.Contains(host, "]") {
		return fmt.Sprintf("[%s]", host)
	}
	if strings.Contains(host, ":") && !strings.Contains(host, "[") && strings.Contains(host, "]") {
		return fmt.Sprintf("[%s", host)
	}
	if strings.Contains(host, ":") && !strings.Contains(host, "]") && strings.Contains(host, "[") {
		return fmt.Sprintf("%s]", host)
	}
	return host
}
