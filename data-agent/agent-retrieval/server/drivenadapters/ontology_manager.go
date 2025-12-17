package drivenadapters

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/config"
	infraErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
	"github.com/bytedance/sonic"
)

type ontologyManagerAccess struct {
	logger     interfaces.Logger
	baseURL    string
	httpClient interfaces.HTTPClient
}

var (
	omAccessOnce sync.Once
	omAccess     interfaces.OntologyManagerAccess
)

// NewOntologyManagerAccess 创建OntologyManagerAccess
func NewOntologyManagerAccess() interfaces.OntologyManagerAccess {
	omAccessOnce.Do(func() {
		conf := config.NewConfigLoader()
		omAccess = &ontologyManagerAccess{
			logger: conf.GetLogger(),
			baseURL: fmt.Sprintf("%s://%s:%d/api/ontology-manager",
				conf.OntologyManager.PrivateProtocol,
				conf.OntologyManager.PrivateHost,
				conf.OntologyManager.PrivatePort),
			httpClient: rest.NewHTTPClient(),
		}
	})
	return omAccess
}

// SearchObjectTypes 搜索对象类
func (oma *ontologyManagerAccess) SearchObjectTypes(ctx context.Context, query *interfaces.QueryConceptsReq) (objectTypes *interfaces.ObjectTypeConcepts, err error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/object-types", oma.baseURL, query.KnID)
	header := common.GetHeaderFromCtx(ctx)
	header["Content-Type"] = "application/json"
	header["x-http-method-override"] = "GET"
	respCode, respBody, err := oma.httpClient.PostNoUnmarshal(ctx, src, header, query)

	objectTypes = &interfaces.ObjectTypeConcepts{}
	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] SearchObjectTypes request failed, err: %v", err)
		return objectTypes, fmt.Errorf("[OntologyManagerAccess] SearchObjectTypes request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return objectTypes, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] SearchObjectTypes， get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return objectTypes, err
		}

		return objectTypes, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	if len(respBody) == 0 {
		return objectTypes, nil
	}

	// 处理返回结果
	if err := sonic.Unmarshal(respBody, objectTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]SearchObjectTypes unmalshal ObjectTypes failed: %v\n", err)
		return nil, err
	}

	return objectTypes, nil
}

// GetObjectTypeDetail 获取对象类详情
func (oma *ontologyManagerAccess) GetObjectTypeDetail(ctx context.Context, knID string, otIds []string, includeDetail bool) ([]*interfaces.ObjectType, error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/object-types/%s", oma.baseURL, knID, strings.Join(otIds, ","))
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	queryValues := url.Values{}
	queryValues.Set("include_detail", strconv.FormatBool(includeDetail))

	respCode, respBody, err := oma.httpClient.GetNoUnmarshal(ctx, src, queryValues, header)

	var emptyObjectTypes []*interfaces.ObjectType
	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] GetObjectTypeDetail request failed, err: %v", err)
		return emptyObjectTypes, fmt.Errorf("[OntologyManagerAccess] GetObjectTypeDetail request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return emptyObjectTypes, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] GetObjectTypeDetail get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return emptyObjectTypes, err
		}

		return emptyObjectTypes, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	if len(respBody) == 0 {
		return emptyObjectTypes, nil
	}

	// 处理返回结果
	var objectTypes []*interfaces.ObjectType
	if err := sonic.Unmarshal(respBody, &objectTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]GetObjectTypeDetail unmalshal ObjectTypes failed: %v\n", err)
		return emptyObjectTypes, err
	}

	return objectTypes, nil
}

// SearchRelationTypes 搜索关系类
func (oma *ontologyManagerAccess) SearchRelationTypes(ctx context.Context, query *interfaces.QueryConceptsReq) (releationTypes *interfaces.RelationTypeConcepts, err error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/relation-types", oma.baseURL, query.KnID)
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	respCode, respBody, err := oma.httpClient.PostNoUnmarshal(ctx, src, header, query)

	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] SearchRelationTypes request failed, err: %v", err)
		return nil, fmt.Errorf("[OntologyManagerAccess] SearchRelationTypes request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return nil, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] SearchRelationTypes get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return nil, err
		}

		return nil, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	releationTypes = &interfaces.RelationTypeConcepts{}
	if len(respBody) == 0 {
		return releationTypes, nil
	}

	// 处理返回结果
	if err := sonic.Unmarshal(respBody, releationTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]SearchRelationTypes unmalshal RelationTypes failed: %v\n", err)
		return nil, err
	}

	return releationTypes, nil
}

// GetRelationTypeDetail 获取关系类详情
func (oma *ontologyManagerAccess) GetRelationTypeDetail(ctx context.Context, knID string, rtIDs []string, includeDetail bool) ([]*interfaces.RelationType, error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/relation-types/%s", oma.baseURL, knID, strings.Join(rtIDs, ","))
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	queryValues := url.Values{}
	queryValues.Set("include_detail", strconv.FormatBool(includeDetail))

	respCode, respBody, err := oma.httpClient.GetNoUnmarshal(ctx, src, queryValues, header)

	var emptyRelationTypes []*interfaces.RelationType
	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] GetRelationTypeDetail request failed, err: %v", err)
		return emptyRelationTypes, fmt.Errorf("[OntologyManagerAccess] GetRelationTypeDetail request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return emptyRelationTypes, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] GetRelationTypeDetail get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return emptyRelationTypes, err
		}

		return emptyRelationTypes, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	if len(respBody) == 0 {
		return emptyRelationTypes, nil
	}

	// 处理返回结果
	var releationTypes []*interfaces.RelationType
	if err := sonic.Unmarshal(respBody, &releationTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]GetRelationTypeDetail unmalshal releationTypes failed: %v\n", err)
		return emptyRelationTypes, err
	}

	return releationTypes, nil
}

// SearchActionTypes 搜索行动类
func (oma *ontologyManagerAccess) SearchActionTypes(ctx context.Context, query *interfaces.QueryConceptsReq) (actionTypes *interfaces.ActionTypeConcepts, err error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/action-types", oma.baseURL, query.KnID)
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	respCode, respBody, err := oma.httpClient.PostNoUnmarshal(ctx, src, header, query)

	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] SearchActionTypes request failed, err: %v", err)
		return nil, fmt.Errorf("[OntologyManagerAccess] SearchActionTypes request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return nil, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] SearchActionTypes get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return nil, err
		}

		return nil, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	actionTypes = &interfaces.ActionTypeConcepts{}
	if len(respBody) == 0 {
		return actionTypes, nil
	}

	// 处理返回结果
	if err := sonic.Unmarshal(respBody, actionTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]SearchActionTypes unmalshal actionTypes failed: %v\n", err)
		return nil, err
	}

	return actionTypes, nil
}

// GetActionTypeDetail 获取行动类详情
func (oma *ontologyManagerAccess) GetActionTypeDetail(ctx context.Context, knID string, atIDs []string, includeDetail bool) ([]*interfaces.ActionType, error) {
	src := fmt.Sprintf("%s/in/v1/knowledge-networks/%s/action-types/%s", oma.baseURL, knID, strings.Join(atIDs, ","))
	header := common.GetHeaderFromCtx(ctx)
	header[rest.ContentTypeKey] = rest.ContentTypeJSON
	header["x-http-method-override"] = "GET"
	queryValues := url.Values{}
	queryValues.Set("include_detail", strconv.FormatBool(includeDetail))

	respCode, respBody, err := oma.httpClient.GetNoUnmarshal(ctx, src, queryValues, header)

	var emptyActionTypes []*interfaces.ActionType
	if err != nil {
		oma.logger.WithContext(ctx).Errorf("[OntologyManagerAccess] GetActionTypeDetail request failed, err: %v", err)
		return emptyActionTypes, fmt.Errorf("[OntologyManagerAccess] GetActionTypeDetail request failed, err: %v", err)
	}

	if respCode == http.StatusNotFound {
		oma.logger.WithContext(ctx).Warnf("[OntologyManagerAccess] request not found, [%s]", src)
		return emptyActionTypes, fmt.Errorf("[OntologyManagerAccess] request not found, [%s]", src)
	}

	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		oma.logger.Errorf("[OntologyManagerAccess] GetActionTypeDetail get resp failed, [%s], %v\n", src, respBody)

		var baseError interfaces.KnBaseError
		if err := sonic.Unmarshal(respBody, &baseError); err != nil {
			oma.logger.Errorf("unmalshal KnBaseError failed: %v\n", err)
			return emptyActionTypes, err
		}

		return emptyActionTypes, &infraErr.HTTPError{
			HTTPCode:     respCode,
			Code:         baseError.ErrorCode,
			Description:  baseError.Description,
			Solution:     baseError.Solution,
			ErrorLink:    baseError.ErrorLink,
			ErrorDetails: baseError.ErrorDetails,
		}
	}

	if len(respBody) == 0 {
		return emptyActionTypes, nil
	}

	// 处理返回结果
	var actionTypes []*interfaces.ActionType
	if err := sonic.Unmarshal(respBody, &actionTypes); err != nil {
		oma.logger.Errorf("[OntologyManagerAccess]GetActionTypeDetail unmalshal actionTypes failed: %v\n", err)
		return emptyActionTypes, err
	}

	return actionTypes, nil
}
