package operator

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	jsoniter "github.com/json-iterator/go"
)

// DebugOperator 调试接口
func (m *operatorManager) DebugOperator(ctx context.Context, req *interfaces.DebugOperatorReq) (resp *interfaces.HTTPResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 检查算子是否存在
	exist, operator, err := m.DBOperatorManager.SelectByOperatorID(ctx, nil, req.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select operator by id failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		m.Logger.WithContext(ctx).Warnf("operator not exist, operator_id: %s", req.OperatorID)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorNotFound, "operator not exist")
		return
	}
	// 校验使用权限
	accessor, err := m.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = m.AuthService.CheckExecutePermission(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator)
	if err != nil {
		return
	}
	if operator.MetadataType != string(interfaces.MetadataTypeAPI) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOperatorUnparsed, "operator is not api")
		return
	}
	executionMode := operator.ExecutionMode
	if operator.MetadataVersion != req.Version {
		// 查询历史记录
		var historyDB *model.OperatorReleaseHistoryDB
		exist, historyDB, err = m.OpReleaseHistoryDB.SelectByOpIDAndMetdata(ctx, req.OperatorID, req.Version)
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("select operator release history by id failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		if !exist {
			m.Logger.WithContext(ctx).Warnf("operator not exist, operator_id: %s, version: %s", req.OperatorID, req.Version)
			err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorNotFound, "operator not exist")
			return
		}
		releaseDB := &model.OperatorReleaseDB{}
		err = jsoniter.Unmarshal([]byte(historyDB.OpRelease), releaseDB)
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("unmarshal operator release failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		executionMode = releaseDB.ExecutionMode
	}

	// 检查执行模式
	if executionMode != string(interfaces.ExecutionModeSync) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOnlySyncModeDebug, fmt.Sprintf("operator execution mode is %s, not supported", operator.ExecutionMode))
		return
	}
	// 获取元数据
	exist, metadata, err := m.DBAPIMetadataManager.SelectByVersion(ctx, req.Version)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select metadata by id failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		m.Logger.WithContext(ctx).Warnf("metadata not exist, operator_id: %s, version: %s", req.OperatorID, req.Version)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorMetadataNotFound, "metadata not exist")
		return
	}
	resp, err = m.Proxy.HandlerRequest(ctx, &interfaces.HTTPRequest{
		ClientID:      req.OperatorID,
		URL:           fmt.Sprintf("%s%s", metadata.ServerURL, metadata.Path),
		Method:        metadata.Method,
		Headers:       req.Headers,
		Body:          req.Body,
		QueryParams:   req.QueryParams,
		PathParams:    req.PathParams,
		ExecutionMode: interfaces.ExecutionModeSync,
	})
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("handler request failed, err: %v", err)
		return
	}
	// 记录日志
	go func() {
		tokenInfo, _ := common.GetTokenInfoFromCtx(ctx)
		m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationExecute,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectOperator,
				ID:   operator.OperatorID,
				Name: operator.Name,
			},
		})
	}()
	return
}

// ExecuteOperator 执行算子
func (m *operatorManager) ExecuteOperator(ctx context.Context, req *interfaces.ExecuteOperatorReq) (resp *interfaces.HTTPResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 检查算子是否存在
	exist, operator, err := m.OpReleaseDB.SelectByOpID(ctx, req.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select release operator by id failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 检查算子状态
	if !exist || operator.Status != string(interfaces.BizStatusPublished) {
		m.Logger.WithContext(ctx).Warnf("release operator not exist or not published, operator_id: %s", req.OperatorID)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorNotFound, "release operator not exist or not published")
		return
	}
	// 校验使用权限
	accessor, err := m.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = m.AuthService.CheckExecutePermission(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator)
	if err != nil {
		return
	}
	// 检查算子类型
	if operator.MetadataType != string(interfaces.MetadataTypeAPI) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOperatorUnparsed, "operator is not api")
		return
	}
	executionMode := operator.ExecutionMode
	// 检查执行模式
	if executionMode != string(interfaces.ExecutionModeSync) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOnlySyncModeDebug, fmt.Sprintf("operator execution mode is %s, not supported", operator.ExecutionMode))
		return
	}
	// 获取元数据
	exist, metadata, err := m.DBAPIMetadataManager.SelectByVersion(ctx, operator.MetadataVersion)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select metadata by id failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		m.Logger.WithContext(ctx).Warnf("metadata not exist, operator_id: %s, metadata_type: %s", req.OperatorID, operator.MetadataType)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorMetadataNotFound, "metadata not exist")
		return
	}
	// 执行算子
	resp, err = m.Proxy.HandlerRequest(ctx, &interfaces.HTTPRequest{
		ClientID:      req.OperatorID,
		URL:           fmt.Sprintf("%s%s", metadata.ServerURL, metadata.Path),
		Method:        metadata.Method,
		Headers:       req.Headers,
		Body:          req.Body,
		QueryParams:   req.QueryParams,
		PathParams:    req.PathParams,
		ExecutionMode: interfaces.ExecutionModeSync,
		Timeout:       time.Duration(req.Timeout) * time.Second,
	})
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("handler request failed, err: %v", err)
		return
	}
	// 记录日志
	go func() {
		tokenInfo, ok := common.GetTokenInfoFromCtx(ctx)
		if !ok {
			return
		}
		m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationExecute,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectOperator,
				ID:   operator.OpID,
				Name: operator.Name,
			},
		})
	}()
	return
}
