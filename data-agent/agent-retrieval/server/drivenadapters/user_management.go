package drivenadapters

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/utils"
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

func (u *userManagementClient) GetAppInfo(ctx context.Context, appID string) (appInfo *interfaces.AppInfo, err error) {
	src := fmt.Sprintf("%s/v1/apps/%s", u.baseURL, appID)
	header := map[string]string{}
	_, respParam, err := u.httpClient.Get(ctx, src, nil, header)
	if err != nil {
		u.logger.Errorf("GetAppInfo failed:%v, url:%v", err, src)
		return
	}
	appInfo = &interfaces.AppInfo{}
	resultByt := utils.ObjectToByte(respParam)
	err = jsoniter.Unmarshal(resultByt, appInfo)
	if err != nil {
		u.logger.Errorf("GetAppInfo response unmarshal error:%s", err.Error())
	}
	return
}

// GetUserInfo 获取用户信息
func (u *userManagementClient) GetUserInfo(ctx context.Context, userID string, fields ...string) (info *interfaces.UserInfo, err error) {
	if len(fields) == 0 {
		fields = []string{"name", "account", "roles"}
	}
	infos, err := u.GetUsersInfo(ctx, []string{userID}, fields)
	if err != nil {
		return
	}
	if len(infos) == 0 {
		u.logger.WithContext(ctx).Errorf("GetUserInfo failed, user %s info not found", userID)
		err = errors.DefaultHTTPError(ctx, http.StatusNotFound, fmt.Sprintf("user %s info not found", userID))
		return
	}
	info = infos[0]
	return
}

// GetUsersName 批量获取用户信息
func (u *userManagementClient) GetUsersInfo(ctx context.Context, userIDs, fields []string) (infos []*interfaces.UserInfo, err error) {
	src := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, strings.Join(userIDs, ","), strings.Join(fields, ","))
	header := map[string]string{}
	respCode, result, err := u.httpClient.Get(ctx, src, nil, header)
	infos = []*interfaces.UserInfo{}
	if err != nil {
		if respCode == http.StatusNotFound {
			// 解析404错误响应中的用户ID列表
			notFoundUserIDs, parseErr := u.parseNotFoundUserIDs(ctx, result)
			if parseErr != nil {
				u.logger.WithContext(ctx).Warnf("Failed to parse 404 error details: %v", parseErr)
				return nil, parseErr
			}
			for _, userID := range notFoundUserIDs {
				infos = append(infos, &interfaces.UserInfo{UserID: userID, DisplayName: interfaces.UnknownUser})
			}
		}
		u.logger.WithContext(ctx).Warnf("GetUsersInfo failed, err: %v", err)
		return
	}

	resultByt := utils.ObjectToByte(result)
	err = jsoniter.Unmarshal(resultByt, &infos)
	if err != nil {
		u.logger.WithContext(ctx).Warnf("GetUsersName Unmarshal %s failed, err: %v", string(resultByt), err)
	}
	return
}

// GetUsersName 批量获取用户名称
func (u *userManagementClient) GetUsersName(ctx context.Context, userIDs []string) (userMap map[string]string, err error) {
	userIDs = utils.UniqueStrings(userIDs)
	userMap = make(map[string]string)
	checkUserIDs := []string{}
	for _, userID := range userIDs {
		if userID == interfaces.SystemUser {
			userMap[userID] = interfaces.SystemUser
			continue
		}
		checkUserIDs = append(checkUserIDs, userID)
	}

	if len(checkUserIDs) == 0 {
		return
	}

	// 循环处理404错误，直到所有用户都被处理
	for len(checkUserIDs) > 0 {
		info, err := u.GetUsersInfo(ctx, checkUserIDs, []string{interfaces.DisplayName})
		if err != nil {
			// 检查是否是HTTPError类型的404错误
			if httpErr, ok := err.(*errors.HTTPError); ok && httpErr.HTTPCode == http.StatusNotFound {
				// 解析404错误响应中的用户ID
				notFoundUserIDs := []string{}
				for _, userInfo := range info {
					notFoundUserIDs = append(notFoundUserIDs, userInfo.UserID)
					userMap[userInfo.UserID] = userInfo.DisplayName
				}

				// 从checkUserIDs中移除已处理的用户ID
				checkUserIDs = u.removeUserIDs(checkUserIDs, notFoundUserIDs)
				continue
			}

			// 其他错误直接返回
			return nil, err
		}

		// 处理成功返回的用户信息
		for _, user := range info {
			userMap[user.UserID] = user.DisplayName
		}
		// 所有用户都已成功处理
		break
	}
	return
}

// parseNotFoundUserIDs 解析404错误响应中的用户ID列表
func (u *userManagementClient) parseNotFoundUserIDs(ctx context.Context, errorResult interface{}) (userIDs []string, err error) {
	resultByt := utils.ObjectToByte(errorResult)
	var errResp interfaces.ErrorResponse
	err = jsoniter.Unmarshal(resultByt, &errResp)
	if err != nil {
		err = fmt.Errorf("[parseNotFoundUserIDs], failed to parse 404 error response, Unmarshal %s failed, err: %v", string(resultByt), err)
		u.logger.WithContext(ctx).Warnf(err.Error())
		return
	}
	userIDs = errResp.Detail.IDs
	return
}

// removeUserIDs 从源数组中移除指定的用户ID
func (u *userManagementClient) removeUserIDs(source, toRemove []string) []string {
	toRemoveSet := make(map[string]bool)
	for _, id := range toRemove {
		toRemoveSet[id] = true
	}
	result := make([]string, 0, len(source))
	for _, id := range source {
		if !toRemoveSet[id] {
			result = append(result, id)
		}
	}

	return result
}
