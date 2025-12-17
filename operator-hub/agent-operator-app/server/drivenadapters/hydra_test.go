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

func TestIntrospect(t *testing.T) {
	Convey("TestIntrospect", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()
		logger := mocks.NewMockLogger(ctrl)
		httpClient := mocks.NewMockHTTPClient(ctrl)
		logger.EXPECT().WithContext(gomock.Any()).Return(logger).AnyTimes()

		hydraClient := &hydra{
			adminAddress: "http://localhost:1234",
			logger:       logger,
			httpClient:   httpClient,
		}

		Convey("HTTP请求错误", func() {
			logger.EXPECT().Error(gomock.Any()).Return()
			httpClient.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(0, nil, fmt.Errorf("connection error"))

			_, err := hydraClient.Introspect(context.Background(), "test-token")
			So(err, ShouldNotBeNil)
		})

		Convey("JSON序列化错误", func() {
			logger.EXPECT().Warnf(gomock.Any(), gomock.Any()).Return()
			httpClient.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(200, "invalid-response", nil)

			_, err := hydraClient.Introspect(context.Background(), "test-token")
			So(err, ShouldNotBeNil)
		})

		Convey("令牌无效", func() {
			logger.EXPECT().Warnf(gomock.Any(), gomock.Any()).Return()
			httpClient.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(200, &IntrospectInfo{Active: false}, nil)

			_, err := hydraClient.Introspect(context.Background(), "test-token")
			So(err, ShouldNotBeNil)
		})

		Convey("客户端凭证模式", func() {
			httpClient.EXPECT().Post(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(200, &IntrospectInfo{
					Active:    true,
					SubID:     "client-id",
					ClientID:  "client-id",
					TokenType: "access_token",
				}, nil)

			info, err := hydraClient.Introspect(context.Background(), "test-token")
			So(err, ShouldBeNil)
			So(info.VisitorTyp, ShouldEqual, interfaces.Business)
		})
	})
}
