package drivenadapters

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	infraErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/utils"
)

type ontologyQueryClient struct {
	logger     interfaces.Logger
	baseURL    string
	httpClient interfaces.HTTPClient
}

var (
	ontologyQueryOnce sync.Once
	ontologyQuery     interfaces.DrivenOntologyQuery
)

const (
	// https://{host}:{port}/api/ontology-query/in/v1/knowledge-networks/:kn_id/object-types/:ot_id?include_type_info=true
	queryObjectInstancesURI = "/in/v1/knowledge-networks/%s/object-types/%s?include_type_info=%v&include_logic_params=%v"
)

// NewOntologyQueryAccess 创建OntologyQueryAccess
func NewOntologyQueryAccess() interfaces.DrivenOntologyQuery {
	ontologyQueryOnce.Do(func() {
		configLoader := config.NewConfigLoader()
		ontologyQuery = &ontologyQueryClient{
			logger: configLoader.GetLogger(),
			baseURL: fmt.Sprintf("%s://%s:%d/api/ontology-query",
				configLoader.OntologyQuery.PrivateProtocol,
				configLoader.OntologyQuery.PrivateHost,
				configLoader.OntologyQuery.PrivatePort),
			httpClient: rest.NewHTTPClient(),
		}
	})
	return ontologyQuery
}

// QueryObjectInstances 检索指定对象类的对象的详细数据
func (o *ontologyQueryClient) QueryObjectInstances(ctx context.Context, req *interfaces.QueryObjectInstancesReq) (resp *interfaces.QueryObjectInstancesResp, err error) {
	uri := fmt.Sprintf(queryObjectInstancesURI, req.KnID, req.OtID, req.IncludeTypeInfo, req.IncludeLogicParams)
	url := fmt.Sprintf("%s%s", o.baseURL, uri)
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	_, respBody, err := o.httpClient.Post(ctx, url, header, req)
	if err != nil {
		o.logger.WithContext(ctx).Warnf("[OntologyQuery#QueryObjectInstances] QueryObjectInstances request failed, err: %v", err)
		return
	}
	resp = &interfaces.QueryObjectInstancesResp{}
	resultByt := utils.ObjectToByte(respBody)
	err = json.Unmarshal(resultByt, resp)
	if err != nil {
		o.logger.WithContext(ctx).Errorf("[OntologyQuery#QueryObjectInstances] Unmarshal %s err:%v", string(resultByt), err)
		err = infraErr.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	return
}
