package drivenadapters

import (
	"context"
	"fmt"
	"testing"

	"github.com/go-playground/assert/v2"
	"github.com/golang/mock/gomock"
	. "github.com/smartystreets/goconvey/convey"
)

func NewMockAnyData(clients *HttpClientMock) AnyData {
	InitARLog()
	return &AnyDataImpl{
		baseURL:              "http://localhost:8080",
		httpClient:           clients.httpClient,
		appID:                "appid",
		model:                "model",
		agentFactoryBaseURL:  "http://localhost:8081",
		modelManagerBaseURL:  "http://localhost:8082",
		knowledgeDataBaseURL: "http://localhost:8083",
	}
}

func TestGetAgentByID(t *testing.T) {
	httpClient := NewHttpClientMock(t)
	anyData := NewMockAnyData(httpClient)

	Convey("TestGetAgentByID", t, func() {
		Convey("Get Agent By ID Error", func() {
			httpClient.httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any()).Return(500, nil, fmt.Errorf("error"))
			_, err := anyData.GetAgentByID(context.Background(), "id")
			assert.NotEqual(t, err, nil)
		})
		Convey("Get Agent By ID Success", func() {
			mockResp := map[string]interface{}{
				"res": map[string]interface{}{
					"agent_id": "agent_id",
				},
			}
			httpClient.httpClient.EXPECT().Get(gomock.Any(), gomock.Any(), gomock.Any()).Return(200, mockResp, nil)
			agent, err := anyData.GetAgentByID(context.Background(), "id")
			assert.Equal(t, err, nil)
			assert.Equal(t, agent.AgentID, "agent_id")
		})
	})
}
