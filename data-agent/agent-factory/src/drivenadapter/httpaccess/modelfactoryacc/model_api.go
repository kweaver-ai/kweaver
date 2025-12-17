package modelfactoryacc

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/cmp/httpclient"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/imodelfactoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	jsoniter "github.com/json-iterator/go"
	"github.com/sashabaranov/go-openai"
)

// 编译器检查是否异常
var _ imodelfactoryacc.IModelApiAcc = (*modelApiAcc)(nil)

type modelApiAcc struct {
	logger icmp.Logger

	streamClient    httpclient.HTTPClient
	client          rest.HTTPClient
	modelApiSvcHost string
	modelApiSvcPort int
}

func NewModelApiAcc(httpClient httpclient.HTTPClient, client rest.HTTPClient, logger icmp.Logger) imodelfactoryacc.IModelApiAcc {
	return &modelApiAcc{
		logger:          logger,
		streamClient:    httpClient,
		client:          client,
		modelApiSvcHost: global.GConfig.ModelFactory.ModelApiSvc.Host,
		modelApiSvcPort: global.GConfig.ModelFactory.ModelApiSvc.Port,
	}
}

func (m modelApiAcc) StreamChatCompletion(ctx context.Context, req *imodelfactoryacc.ChatCompletionReq) (chan string, chan error, error) {
	url := fmt.Sprintf("http://%s:%d/api/private/mf-model-api/v1/chat/completions", m.modelApiSvcHost, m.modelApiSvcPort)
	fmt.Println("Calling " + url)

	headers := map[string]string{
		"Content-Type": "application/json",
		//"X-User-Id":    req.UserID,
		// cenum.HeaderXAccountID.String():    req.UserID,
	}

	chelper.SetAccountInfoToHeaderMap(headers, req.UserID, req.AccountType)

	messageChan, errorChan, err := m.streamClient.StreamPost(ctx, url, headers, req)
	if err != nil {
		return nil, nil, fmt.Errorf("stream chat completion failed: %s", err.Error())
	}

	return messageChan, errorChan, nil
}

func (m modelApiAcc) ChatCompletion(ctx context.Context, req *imodelfactoryacc.ChatCompletionReq) (openai.ChatCompletionResponse, error) {
	url := fmt.Sprintf("http://%s:%d/api/private/mf-model-api/v1/chat/completions", m.modelApiSvcHost, m.modelApiSvcPort)
	fmt.Println("Calling " + url)

	headers := map[string]string{
		"Content-Type": "application/json",
		//"X-User-Id":    req.UserID,
		// cenum.HeaderXAccountID.String():    req.UserID,
	}

	chelper.SetAccountInfoToHeaderMap(headers, req.UserID, req.AccountType)

	respCode, respBody, err := m.client.PostNoUnmarshal(ctx, url, headers, req)
	if err != nil {
		return openai.ChatCompletionResponse{}, fmt.Errorf("chat completion failed: %s", err.Error())
	}

	if respCode != http.StatusOK {
		return openai.ChatCompletionResponse{}, fmt.Errorf("chat completion failed: %s", respBody)
	}

	var resp openai.ChatCompletionResponse

	err = jsoniter.Unmarshal(respBody, &resp)
	if err != nil {
		return openai.ChatCompletionResponse{}, fmt.Errorf("chat completion failed: %s", err.Error())
	}

	return resp, nil
}
