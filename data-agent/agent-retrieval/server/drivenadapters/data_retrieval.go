package drivenadapters

import (
	"context"
	"fmt"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	infraErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/utils"
)

var (
	knowledgeRerank = "/tools/knowledge_rerank" // 知识重排接口
)

var (
	drOnce sync.Once
	dr     interfaces.DataRetrieval
)

type dataRetrievalClient struct {
	baseURL    string
	logger     interfaces.Logger
	httpClient interfaces.HTTPClient
}

// NewDataRetrievalClient 新建DataRetrievalClient
func NewDataRetrievalClient() interfaces.DataRetrieval {
	drOnce.Do(func() {
		conf := config.NewConfigLoader()
		dr = &dataRetrievalClient{
			baseURL: fmt.Sprintf("%s://%s:%d", conf.DataRetrieval.PrivateProtocol,
				conf.DataRetrieval.PrivateHost, conf.DataRetrieval.PrivatePort),
			logger:     conf.GetLogger(),
			httpClient: rest.NewHTTPClient(),
		}
	})
	return dr
}

// KnowledgeRerank 知识重排
func (dr *dataRetrievalClient) KnowledgeRerank(ctx context.Context, req *interfaces.KnowledgeRerankReq) (results []*interfaces.ConceptResult, err error) {
	src := fmt.Sprintf("%s%s", dr.baseURL, knowledgeRerank)
	header := map[string]string{
		rest.ContentTypeKey: rest.ContentTypeJSON,
	}
	_, respData, err := dr.httpClient.Post(ctx, src, header, req)
	if err != nil {
		dr.logger.WithContext(ctx).Errorf("KnowledgeRerank failed, err: %v", err)
		return
	}
	results = []*interfaces.ConceptResult{}
	err = utils.AnyToObject(respData, &results)
	if err != nil {
		dr.logger.WithContext(ctx).Errorf("KnowledgeRerank failed, err: %v", err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return
}
