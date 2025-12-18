package drivenadapters

import (
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
)

//go:generate mockgen -package mock_drivenadapters -source ../drivenadapters/anyshare.go -destination ../tests/mock_drivenadapters/anyshare_mock.go

// Anyshare method interface
type Anyshare interface {
	// 获取anyshare 集群地址
	ClusterAccess() (ClusterAccess, error)
}

var (
	anyshareOnce sync.Once
	anyshare     Anyshare
)

type anyshareClient struct {
	log        commonLog.Logger
	baseURL    string
	httpClient HTTPClient
}

// ClusterAccess 集群访问地址
type ClusterAccess struct {
	Host string `json:"host"`
	Port string `json:"port"`
}

// NewAnyshare deploy服务
func NewAnyshare() Anyshare {
	anyshareOnce.Do(
		func() {
			config := common.NewConfig()
			anyshare = &anyshareClient{
				log:        commonLog.NewLogger(),
				baseURL:    fmt.Sprintf("http://%s:%s", config.DeployService.Host, config.DeployService.Port),
				httpClient: NewHTTPClient(),
			}
		})

	return anyshare
}

func (ac *anyshareClient) ClusterAccess() (ClusterAccess, error) {
	target := fmt.Sprintf("%s/api/deploy-manager/v1/access-addr/app", ac.baseURL)
	respParam, err := ac.httpClient.Get(target, nil)
	if err != nil {
		ac.log.Errorf("get cluster access failed: %v, url: %v", err, target)
		return ClusterAccess{}, err
	}
	host := respParam.(map[string]interface{})["host"].(interface{}) //nolint
	port := respParam.(map[string]interface{})["port"].(interface{}) //nolint
	clusterAccess := ClusterAccess{
		Host: host.(string),
		Port: port.(string),
	}
	return clusterAccess, nil
}
