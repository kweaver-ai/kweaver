package drivenadapters

import (
	"context"
	"fmt"
	"testing"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/mocks"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"
)

func TestGetUsersInfo(t *testing.T) {
	Convey("GetUsersInfo", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()
		logger := mocks.NewMockLogger(ctrl)
		httpClient := mocks.NewMockHTTPClient(ctrl)
		logger.EXPECT().WithContext(gomock.Any()).Return(logger).AnyTimes()
		mockClient := &userManagementClient{
			baseURL: fmt.Sprintf("%s://%s:%d/api/user-management", "http",
				"127.0.0.1", 30980),
			logger:     logger,
			httpClient: httpClient,
		}
		Convey("Get请求报错", func() {
			logger.EXPECT().Warnf(gomock.Any(), gomock.Any()).Return()
			httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(0, nil, fmt.Errorf("http get error"))
			_, err := mockClient.GetUsersInfo(context.Background(), []string{"test"}, []string{"name"})
			So(err, ShouldNotBeNil)
		})
		Convey("Get请求成功,返回结果错误,Unmarshal报错", func() {
			httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(200, 0, nil)
			logger.EXPECT().Warnf(gomock.Any(), gomock.Any()).Return()
			_, err := mockClient.GetUsersInfo(context.Background(), []string{"test"}, []string{"name"})
			fmt.Println(err)
			So(err, ShouldNotBeNil)
		})
		Convey("用户不存在", func() {
			logger.EXPECT().Warnf(gomock.Any(), gomock.Any()).Return()
			httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(404, &interfaces.BaseError{
				Code:        "NotFound",
				Description: "用户不存在",
			}, nil)
			_, err := mockClient.GetUsersInfo(context.Background(), []string{"test"}, []string{"name"})
			fmt.Println(err)
			So(err, ShouldNotBeNil)
		})
		Convey("成功", func() {
			httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(200, []*interfaces.UserInfo{}, nil)
			_, err := mockClient.GetUsersInfo(context.Background(), []string{"test"}, []string{"name"})
			fmt.Println(err)
			So(err, ShouldBeNil)
		})
	})
}

// func TestGetUsersInfo(t *testing.T) {
// 	um = &userManagementClient{
// 		baseURL: fmt.Sprintf("%s://%s:%d/api/user-management", "http",
// 			"10.4.111.251", 30980),
// 		logger:     interfaces.DefaultLogger(),
// 		httpClient: rest.NewHTTPClient(),
// 	}
// 	resp, err := um.GetUsersInfo(context.Background(), []string{"test"}, []string{"name"})
// 	if err != nil {
// 		t.Errorf("get users info failed, err: %v", err)
// 	}
// 	fmt.Println(utils.ObjectToJSON(resp))
// }
