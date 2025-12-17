package operator

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	jsoniter "github.com/json-iterator/go"
)

// QueryOperatorHistoryDetail 查询操作历史详情
func (m *operatorManager) QueryOperatorHistoryDetail(ctx context.Context, req *interfaces.OperatorHistoryDetailReq) (result *interfaces.OperatorDataInfo, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 检查算子是否存在
	has, historyDB, err := m.OpReleaseHistoryDB.SelectByOpIDAndMetdata(ctx, req.OperatorID, req.Version)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator history failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator history failed")
		return
	}
	if !has {
		err = errors.DefaultHTTPError(ctx, http.StatusNotFound, "operator versioin not found")
		return
	}
	// 检查查看权限或者公开访问权限
	if common.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = m.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		var authorized bool
		authorized, err = m.AuthService.OperationCheckAny(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator,
			interfaces.AuthOperationTypeView, interfaces.AuthOperationTypePublicAccess)
		if err != nil {
			return
		}
		if !authorized {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden, nil)
			return
		}
	}
	// 解析算子数据
	releaseDB := &model.OperatorReleaseDB{}
	err = jsoniter.Unmarshal([]byte(historyDB.OpRelease), releaseDB)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("unmarshal operator failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, fmt.Sprintf("unmarshal operator failed, err: %v", err))
		return
	}
	// 获取算子元数据
	has, metadataDB, err := m.DBAPIMetadataManager.SelectByVersion(ctx, releaseDB.MetadataVersion)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator metadata failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator metadata failed")
		return
	}
	if !has {
		// TODO: 这里需要处理没有元数据
		m.Logger.WithContext(ctx).Errorf("metadata not found, metadata_version: %v", releaseDB.MetadataVersion)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "metadata not found")
		return
	}
	// 组装算子信息结果
	userIDs, result, err := m.assembleReleaseResult(ctx, releaseDB, metadataDB)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("assemble release result failed, err: %v", err)
		return
	}
	userMap, err := m.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("get users info failed, err: %v", err)
		return
	}
	result.CreateUser = utils.GetValueOrDefault(userMap, result.CreateUser, interfaces.UnknownUser)
	result.UpdateUser = utils.GetValueOrDefault(userMap, result.UpdateUser, interfaces.UnknownUser)
	return
}

// QueryOperatorHistoryList 获取历史版本列表
func (m *operatorManager) QueryOperatorHistoryList(ctx context.Context, req *interfaces.OperatorHistoryListReq) (result []*interfaces.OperatorDataInfo, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 检查算子是否存在
	var has bool
	has, _, err = m.DBOperatorManager.SelectByOperatorID(ctx, nil, req.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator failed, OperatorID: %s, err: %v", req.OperatorID, err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator failed")
		return
	}
	if !has {
		// 算子不存在
		err = errors.DefaultHTTPError(ctx, http.StatusNotFound, "operator not found")
		return
	}
	if common.IsPublicAPIFromCtx(ctx) {
		// 检查查看权限或者公开访问权限
		var accessor *interfaces.AuthAccessor
		accessor, err = m.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		var authorized bool
		authorized, err = m.AuthService.OperationCheckAny(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator,
			interfaces.AuthOperationTypeView, interfaces.AuthOperationTypePublicAccess)
		if err != nil {
			return
		}
		if !authorized {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden, nil)
			return
		}
	}

	// 查询历史数据
	result = []*interfaces.OperatorDataInfo{}
	histories, err := m.OpReleaseHistoryDB.SelectByOpID(ctx, req.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator history failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator history failed")
		return
	}
	if histories == nil {
		return
	}
	var metadataVersions []string
	for _, history := range histories {
		metadataVersions = append(metadataVersions, history.MetadataVersion)
	}
	// 获取元数据
	metadataMap, err := m.getAPIMetadataMap(ctx, metadataVersions)
	if err != nil {
		return
	}
	var userList []string
	for _, historyDB := range histories {
		metadataDB, ok := metadataMap[historyDB.MetadataVersion]
		if !ok || metadataDB == nil {
			m.Logger.WithContext(ctx).Errorf("select operator metadata failed, err: %v", err)
			continue
		}
		releaseDB := &model.OperatorReleaseDB{}
		err = jsoniter.Unmarshal([]byte(historyDB.OpRelease), releaseDB)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("unmarshal op release error: %v", err)
			continue
		}
		var userIDs []string
		var info *interfaces.OperatorDataInfo
		userIDs, info, err = m.assembleReleaseResult(ctx, releaseDB, metadataDB)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("assemble release result failed, err: %v", err)
			continue
		}
		result = append(result, info)
		userList = append(userList, userIDs...)
	}
	userMap, err := m.UserMgnt.GetUsersName(ctx, userList)
	if err != nil {
		return
	}
	for i := range result {
		result[i].CreateUser = utils.GetValueOrDefault(userMap, result[i].CreateUser, "")
		result[i].UpdateUser = utils.GetValueOrDefault(userMap, result[i].UpdateUser, "")
		result[i].ReleaseUser = utils.GetValueOrDefault(userMap, result[i].ReleaseUser, "")
	}
	return
}

// 组装算子信息结果
func (m *operatorManager) assembleReleaseResult(ctx context.Context, releaseDB *model.OperatorReleaseDB, metadataDB *model.APIMetadataDB) (
	userIDs []string, info *interfaces.OperatorDataInfo, err error) {
	executeControl := &interfaces.OperatorExecuteControl{}
	err = jsoniter.Unmarshal([]byte(releaseDB.ExecuteControl), executeControl)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("unmarshal execute control failed, err: %v", err)
		return
	}
	var extendInfo map[string]interface{}
	err = jsoniter.Unmarshal([]byte(releaseDB.ExtendInfo), &extendInfo)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("unmarshal extend info failed, err: %v", err)
		return
	}
	apiSpec := &interfaces.APISpec{}
	err = jsoniter.Unmarshal([]byte(metadataDB.APISpec), apiSpec)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("unmarshal api spec failed, err: %v", err)
		return
	}
	info = &interfaces.OperatorDataInfo{
		Name:         releaseDB.Name,
		OperatorID:   releaseDB.OpID,
		Version:      releaseDB.MetadataVersion,
		Status:       interfaces.BizStatus(releaseDB.Status),
		MetadataType: interfaces.MetadataType(releaseDB.MetadataType),
		Metadata: &interfaces.APIMetadata{
			Summary:     metadataDB.Summary,
			Version:     metadataDB.Version,
			Description: metadataDB.Description,
			Path:        metadataDB.Path,
			ServerURL:   metadataDB.ServerURL,
			Method:      metadataDB.Method,
			CreateTime:  metadataDB.CreateTime,
			UpdateTime:  metadataDB.UpdateTime,
			UpdateUser:  metadataDB.UpdateUser,
			CreateUser:  metadataDB.CreateUser,
			APISpec:     apiSpec,
		},
		ExtendInfo: extendInfo,
		OperatorInfo: &interfaces.OperatorInfo{
			Type:          interfaces.OperatorType(releaseDB.OperatorType),
			ExecutionMode: interfaces.ExecutionMode(releaseDB.ExecutionMode),
			Category:      interfaces.BizCategory(releaseDB.Category),
			CategoryName:  m.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(releaseDB.Category)),
			Source:        releaseDB.Source,
			IsDataSource:  &releaseDB.IsDataSource,
		},
		OperatorExecuteControl: executeControl,
		CreateTime:             releaseDB.CreateTime,
		UpdateTime:             releaseDB.UpdateTime,
		UpdateUser:             releaseDB.UpdateUser,
		CreateUser:             releaseDB.CreateUser,
		ReleaseUser:            releaseDB.ReleaseUser,
		ReleaseTime:            releaseDB.ReleaseTime,
		Tag:                    releaseDB.Tag,
		IsInternal:             releaseDB.IsInternal,
	}
	userIDs = []string{releaseDB.CreateUser, releaseDB.UpdateUser, releaseDB.ReleaseUser, metadataDB.CreateUser, metadataDB.UpdateUser}
	return
}
