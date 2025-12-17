package drivenadapters

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
	jsoniter "github.com/json-iterator/go"
)

var (
	syncOnce sync.Once
	um       interfaces.UserManagement
)

type userManagementClient struct {
	baseURL    string
	logger     interfaces.Logger
	httpClient interfaces.HTTPClient
}

// NewUserManagementClient 创建用户管理服务对象
func NewUserManagementClient() interfaces.UserManagement {
	syncOnce.Do(func() {
		conf := config.NewConfigLoader()
		um = &userManagementClient{
			baseURL: fmt.Sprintf("%s://%s:%d/api/user-management", conf.UserMgnt.PrivateProtocol,
				conf.UserMgnt.PrivateHost, conf.UserMgnt.PrivatePort),
			logger:     conf.GetLogger(),
			httpClient: rest.NewHTTPClient(),
		}
	})
	return um
}

// GetUsersName 批量获取用户信息
func (u *userManagementClient) GetUsersInfo(ctx context.Context, userIDs, fields []string) (infos []*interfaces.UserInfo, err error) {
	src := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, strings.Join(userIDs, ","), strings.Join(fields, ","))
	header := map[string]string{}
	_, result, err := u.httpClient.Get(ctx, src, nil, header)
	if err != nil {
		u.logger.WithContext(ctx).Warnf("GetUsersName failed, err: %v", err)
		return
	}
	infos = []*interfaces.UserInfo{}
	resultByt := utils.ObjectToByte(result)
	err = jsoniter.Unmarshal(resultByt, &infos)
	if err != nil {
		u.logger.WithContext(ctx).Warnf("GetUsersName Unmarshal %s failed, err: %v", string(resultByt), err)
	}
	return
}
