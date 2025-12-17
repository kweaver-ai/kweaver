package operator

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	icommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// EditOperator 编辑算子（仅支持编辑当前版本）
func (m *operatorManager) EditOperator(ctx context.Context, req *interfaces.OperatorEditReq) (resp *interfaces.OperatorEditResp, err error) {
	// 记录可观测性
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"operator_id": req.OperatorID,
		"user_id":     req.UserID,
	})
	// 校验数据的合法性
	operator, metadata, accessor, err := m.preCheckEdit(ctx, req, false)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("pre check edit failed, err: %v", err)
		return
	}
	editMetdataParam, err := m.buildEditMetdataParam(ctx, req, metadata)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("build edit metdata param failed, err: %v", err)
		return
	}
	var isDataSource bool
	if req.OperatorInfoEdit != nil {
		isDataSource, err = checkIsDataSource(ctx, req.OperatorInfoEdit.ExecutionMode, req.OperatorInfoEdit.IsDataSource)
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("check is data source failed, err: %v", err)
			return
		}
	}
	resp, err = m.editOperator(ctx, req, operator, metadata, editMetdataParam, false, isDataSource)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("edit operator failed, err: %v", err)
		return
	}
	// 异步记录审计日志
	go func() {
		tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
		m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectOperator,
				ID:   operator.OperatorID,
				Name: operator.Name,
			},
		})
	}()
	return resp, nil
}

// editOperator
func (m *operatorManager) editOperator(ctx context.Context, req *interfaces.OperatorEditReq, operator *model.OperatorRegisterDB,
	metadata *model.APIMetadataDB, editMetdataParam *interfaces.APIMetadataEdit, directPublish, isDataSource bool) (resp *interfaces.OperatorEditResp, err error) {
	// 判断名字是否变更
	var nameChanged bool
	if req.Name != "" && req.Name != operator.Name {
		// TODO: 检查名字是否重名
		nameChanged = true
	}
	tx, err := m.DBTx.GetTx(ctx)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("get tx failed, OperatorID: %s, Version: %s, err: %v", operator.OperatorID, operator.MetadataVersion, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	switch interfaces.BizStatus(operator.Status) {
	case interfaces.BizStatusUnpublish, interfaces.BizStatusEditing:
		if directPublish {
			operator.Status = string(interfaces.BizStatusPublished)
		}
		err = m.modifyOperatorInfo(ctx, tx, req, operator, metadata, editMetdataParam, isDataSource)
	case interfaces.BizStatusPublished:
		operator.Status = string(interfaces.BizStatusEditing)
		if directPublish {
			operator.Status = string(interfaces.BizStatusPublished)
		}
		err = m.upgradeOperatorInfo(ctx, tx, req, operator, metadata, editMetdataParam, isDataSource)
	case interfaces.BizStatusOffline:
		operator.Status = string(interfaces.BizStatusUnpublish)
		if directPublish {
			operator.Status = string(interfaces.BizStatusPublished)
		}
		err = m.upgradeOperatorInfo(ctx, tx, req, operator, metadata, editMetdataParam, isDataSource)
	default: // 无效状态
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorUnSupportEdit, "invalid operator status")
	}
	if err != nil {
		return
	}
	if operator.Status == interfaces.BizStatusPublished.String() {
		err = m.publishRelease(ctx, tx, operator, req.UserID)
		if err != nil {
			return
		}
	}
	if nameChanged {
		// 名字变更，通知所有订阅者
		err = m.AuthService.NotifyResourceChange(ctx, &interfaces.AuthResource{
			Type: interfaces.AuthResourceTypeOperator.String(),
			ID:   operator.OperatorID,
			Name: operator.Name,
		})
		if err != nil {
			return
		}
	}
	// 检查名字是否变更，如果变更需要检查是否重名
	resp = &interfaces.OperatorEditResp{
		Status:     interfaces.BizStatus(operator.Status),
		OperatorID: operator.OperatorID,
		Version:    operator.MetadataVersion,
	}
	return
}

// UpdateOperatorStatus 更新算子状态
func (m *operatorManager) UpdateOperatorStatus(ctx context.Context, req *interfaces.OperatorStatusUpdateReq, userID string) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 获取事务
	tx, err := m.DBTx.GetTx(ctx)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("get tx failed, err: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "get tx failed")
		return
	}
	defer func() {
		if err != nil {
			e := tx.Rollback()
			if e != nil {
				m.Logger.Errorf("rollback failed, err: %v", e)
			}
		} else {
			e := tx.Commit()
			if e != nil {
				m.Logger.Errorf("commit failed, err: %v", e)
			}
		}
	}()
	// 更新算子状态
	for _, item := range req.StatusItems {
		err = m.updateSinglOperatorStatus(ctx, tx, item, userID)
		if err != nil {
			return
		}
	}
	return
}

// updateSinglOperatorStatus 更新单个算子状态
func (m *operatorManager) updateSinglOperatorStatus(ctx context.Context, tx *sql.Tx, itemReq *interfaces.OperatorStatusItem, userID string) (err error) {
	var has bool
	var operator *model.OperatorRegisterDB
	// 获取算子
	has, operator, err = m.DBOperatorManager.SelectByOperatorID(ctx, tx, itemReq.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select operator failed, OperatorID: %s, err: %v", itemReq.OperatorID, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator failed")
		return err
	}
	if !has {
		// 算子不存在
		err = infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "operator not found")
		return err
	}
	// 验证并执行状态转换
	if !common.CheckStatusTransition(interfaces.BizStatus(operator.Status), itemReq.Status) {
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorStatusInvalid,
			fmt.Sprintf("invalid status transition from %s to %s", operator.Status, itemReq.Status.String()))
		return
	}
	operator.Status = itemReq.Status.String()
	accessor, err := m.AuthService.GetAccessor(ctx, userID)
	if err != nil {
		return
	}
	// 根据状态处理变更操作
	var operation metric.AuditLogOperationType
	switch interfaces.BizStatus(operator.Status) {
	case interfaces.BizStatusPublished:
		operation = metric.AuditLogOperationPublish
		// 检查发布权限
		err = m.AuthService.CheckPublishPermission(ctx, accessor, operator.OperatorID, interfaces.AuthResourceTypeOperator)
		if err != nil {
			return
		}
		// 检查是否重名
		err = m.checkDuplicateName(ctx, operator.Name, operator.OperatorID)
		if err != nil {
			return
		}
		// 更新配置
		err = m.DBOperatorManager.UpdateOperatorStatus(ctx, tx, operator, userID)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("update operator status failed, err: %v")
			return infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
		err = m.publishRelease(ctx, tx, operator, userID)
	case interfaces.BizStatusUnpublish, interfaces.BizStatusEditing:
		// 检查编辑权限
		err = m.AuthService.CheckModifyPermission(ctx, accessor, operator.OperatorID, interfaces.AuthResourceTypeOperator)
		if err != nil {
			return
		}
		// 仅更新状态
		err = m.DBOperatorManager.UpdateOperatorStatus(ctx, tx, operator, userID)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("update operator status failed, err: %v")
			err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
	case interfaces.BizStatusOffline:
		operation = metric.AuditLogOperationUnpublish
		// 检查下架权限
		err = m.AuthService.CheckUnpublishPermission(ctx, accessor, operator.OperatorID, interfaces.AuthResourceTypeOperator)
		if err != nil {
			return
		}
		// 更新配置
		err = m.DBOperatorManager.UpdateOperatorStatus(ctx, tx, operator, userID)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("update operator status failed, err: %v")
			return infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
		// 下架
		err = m.unpublishRelease(ctx, tx, operator, userID)
	default:
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorStatusInvalid, "invalid operator status")
	}
	if err != nil {
		return
	}
	if operation == "" {
		return
	}
	// 异步记录审计日志
	go func() {
		tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
		m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: operation,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectOperator,
				ID:   operator.OperatorID,
				Name: operator.Name,
			},
		})
	}()
	return
}

// checkDuplicateName 检查是否重名
func (m *operatorManager) checkDuplicateName(ctx context.Context, name, operatorID string) (err error) {
	has, operatorDB, err := m.DBOperatorManager.SelectByNameAndStatus(ctx, nil, name, interfaces.BizStatusPublished.String())
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select operator by name failed, err: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator by name failed")
		return
	}
	if !has || (operatorID != "" && operatorDB.OperatorID == operatorID) {
		return
	}
	err = infraerrors.NewHTTPError(ctx, http.StatusConflict, infraerrors.ErrExtOperatorExistsSameName,
		"operator name already exists, please use a different name", name)
	return
}

// 编辑前置检查:校验编辑请求的合法性: 检查数据是否存在、是否合法、是否有权限修改，并返回查询信息
func (m *operatorManager) preCheckEdit(ctx context.Context, req *interfaces.OperatorEditReq, directPublish bool) (operatorDB *model.OperatorRegisterDB,
	metadata *model.APIMetadataDB, accessor *interfaces.AuthAccessor, err error) {
	// 获取算子
	var has bool
	has, operatorDB, err = m.DBOperatorManager.SelectByOperatorID(ctx, nil, req.OperatorID)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator failed, OperatorID: %s, err: %v", req.OperatorID, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select operator failed")
		return
	}
	if !has {
		// 算子不存在
		err = infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "operator not found")
		return
	}
	// TODO：理论上系统算子需要增加校验，系统算子发布后不允许编辑(例如，只有系统管理员可以编辑系统算子)
	accessor, err = m.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	if directPublish {
		err = m.AuthService.MultiCheckOperationPermission(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator,
			interfaces.AuthOperationTypeModify, interfaces.AuthOperationTypePublish)
	} else {
		// 检查是否有编辑权限
		err = m.AuthService.CheckModifyPermission(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator)
	}
	if err != nil {
		return
	}
	// 检查元数据类型
	if operatorDB.MetadataType != string(interfaces.MetadataTypeAPI) {
		// 当前算子不支持升级
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorUnSupportUpgrade, "operator metadata type not support upgrade")
		return
	}
	// 检查参数合法性
	if req.Name == "" {
		req.Name = operatorDB.Name
	}
	err = m.Validator.ValidateOperatorName(ctx, req.Name)
	if err != nil {
		return
	}
	// 根据version获取元数据
	has, metadata, err = m.DBAPIMetadataManager.SelectByVersion(ctx, operatorDB.MetadataVersion)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("select api metadata failed, OperatorID: %s, Version: %s, err: %v", operatorDB.OperatorID, operatorDB.MetadataVersion, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select api metadata failed")
		return
	}
	if !has {
		// 算子元数据不存在
		err = infraerrors.DefaultHTTPError(ctx, http.StatusNotFound, "operator metadata not found")
		return
	}
	if req.Description == "" {
		req.Description = metadata.Description
	}
	err = m.Validator.ValidateOperatorDesc(ctx, req.Description)
	return
}

// 构造元数据编辑参数
func (m *operatorManager) buildEditMetdataParam(ctx context.Context, req *interfaces.OperatorEditReq, metadata *model.APIMetadataDB) (editMetdataParam *interfaces.APIMetadataEdit, err error) {
	editMetdataParam = &interfaces.APIMetadataEdit{
		Summary:     metadata.Summary,
		Description: req.Description,
		Path:        metadata.Path,
		Method:      metadata.Method,
		ServerURL:   metadata.ServerURL,
	}
	if req.MetadataType == interfaces.MetadataTypeAPI && req.Data != nil {
		// 检查导入的元数据信息
		var item *interfaces.PathItemContent
		item, err = m.OpenAPIParser.GetPathItemContent(ctx, req.Data, metadata.Path, metadata.Method)
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("get path item content failed, err: %v", err)
			httErr := &infraerrors.HTTPError{}
			if errors.As(err, &httErr) && httErr.HTTPCode == http.StatusNotFound {
				err = httErr.WithDescription(infraerrors.ErrExtOperatorNotExistInFile)
			}
			return
		}
		if item.Summary != "" {
			err = m.Validator.ValidateOperatorName(ctx, item.Summary)
			if err != nil {
				return
			}
		}
		editMetdataParam.Summary = item.Summary
		editMetdataParam.ServerURL = item.ServerURL
		editMetdataParam.APISpec = &item.APISpec
	}
	err = m.Validator.ValidatorStruct(ctx, editMetdataParam)
	return
}

// 构建元数据更新参数
func (m *operatorManager) buildUpdateMetdataParam(ctx context.Context, item *interfaces.PathItemContent) (editMetdataParam *interfaces.APIMetadataEdit, err error) {
	editMetdataParam = &interfaces.APIMetadataEdit{
		Summary:     item.Summary,
		Description: item.Description,
		Path:        item.Path,
		Method:      item.Method,
		ServerURL:   item.ServerURL,
		APISpec:     &item.APISpec,
	}
	err = m.Validator.ValidateOperatorName(ctx, item.Summary)
	if err != nil {
		return
	}
	err = m.Validator.ValidatorStruct(ctx, editMetdataParam)
	return
}

// modifyOperatorInfo 修改算子注册配置
func (m *operatorManager) modifyOperatorInfo(ctx context.Context, tx *sql.Tx, req *interfaces.OperatorEditReq, operator *model.OperatorRegisterDB,
	currentAPIMetadata *model.APIMetadataDB, editMetdataParam *interfaces.APIMetadataEdit, isDataSource bool) (err error) {
	err = m.modifyOperator(ctx, tx, req, operator, isDataSource)
	if err != nil {
		return
	}
	// 更新算子元数据
	switch interfaces.MetadataType(operator.MetadataType) {
	case interfaces.MetadataTypeAPI:
		err = m.modifyAPIMetadata(ctx, tx, editMetdataParam, currentAPIMetadata, req.UserID)
	default:
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorUnSupportUpgrade, "operator metadata type not support upgrade")
	}
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("modify api metadata failed, OperatorID: %s, Version: %s, err: %v", operator.OperatorID, operator.MetadataVersion, err)
	}
	return
}

// modifyOperator 编辑算子
func (m *operatorManager) modifyOperator(ctx context.Context, tx *sql.Tx, req *interfaces.OperatorEditReq,
	operator *model.OperatorRegisterDB, isDataSource bool) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 更新参数
	operator.UpdateUser = req.UserID
	if req.OperatorInfoEdit != nil {
		operator.OperatorType = string(req.OperatorInfoEdit.Type)
		operator.ExecutionMode = string(req.OperatorInfoEdit.ExecutionMode)
		operator.Category = string(req.OperatorInfoEdit.Category)
		operator.Source = req.OperatorInfoEdit.Source
		operator.IsDataSource = isDataSource
	}
	if req.OperatorExecuteControl != nil {
		operator.ExecuteControl = utils.ObjectToJSON(req.OperatorExecuteControl)
	}
	if req.ExtendInfo != nil {
		operator.ExtendInfo = utils.ObjectToJSON(req.ExtendInfo)
	}
	// 如果name发生变化，则根据operatorID更新name
	if req.Name != "" && req.Name != operator.Name { // 检查是否重名
		err = m.checkDuplicateName(ctx, req.Name, operator.OperatorID)
		if err != nil {
			// 交互设计要求返回指定错误信息：https://confluence.aishu.cn/pages/viewpage.action?pageId=280780968
			httErr := &infraerrors.HTTPError{}
			if errors.As(err, &httErr) && httErr.HTTPCode == http.StatusConflict {
				err = httErr.WithDescription(infraerrors.ErrExtCommonNameExists)
			}
			return
		}
		operator.Name = req.Name
	}
	// 更新算子信息
	err = m.DBOperatorManager.UpdateByOperatorID(ctx, tx, operator)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("update operator failed, OperatorID: %s, Version: %s, err: %v", operator.OperatorID, operator.MetadataVersion, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "update operator failed, err")
	}
	return
}

// modifyMetadata 编辑元数据
func (m *operatorManager) modifyAPIMetadata(ctx context.Context, tx *sql.Tx, editParam *interfaces.APIMetadataEdit, metdata *model.APIMetadataDB, userID string) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	if editParam == nil {
		// 不需要编辑元数据
		return
	}
	// 判断是否需要更新元数据
	var needUpdate bool
	// 允许编辑的字段
	if editParam.ServerURL != "" && editParam.ServerURL != metdata.ServerURL {
		metdata.ServerURL = editParam.ServerURL
		needUpdate = true
	}
	if editParam.Description != "" && editParam.Description != metdata.Description {
		metdata.Description = editParam.Description
		needUpdate = true
	}
	if editParam.Summary != "" && editParam.Summary != metdata.Summary {
		metdata.Summary = editParam.Summary
		needUpdate = true
	}
	if editParam.APISpec != nil {
		metdata.APISpec = utils.ObjectToJSON(editParam.APISpec)
		needUpdate = true
	}
	if !needUpdate {
		// 不需要更新元数据
		return
	}
	metdata.UpdateUser = userID
	err = m.DBAPIMetadataManager.UpdateByVersion(ctx, tx, metdata.Version, metdata)
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("update api metadata failed, Version: %s, err: %v", metdata.Version, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "update api metadata failed")
	}
	return
}

// 升级元数据
func (m *operatorManager) upgradeAPIMetadata(ctx context.Context, tx *sql.Tx, editParam *interfaces.APIMetadataEdit, metdata *model.APIMetadataDB, userID string) (version string, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	if editParam == nil {
		// 不需要编辑元数据
		version = metdata.Version
		return
	}
	var needUpdate bool
	// 允许编辑的字段
	if editParam.ServerURL != "" && editParam.ServerURL != metdata.ServerURL {
		metdata.ServerURL = editParam.ServerURL
		needUpdate = true
	}
	if editParam.Description != "" && editParam.Description != metdata.Description {
		metdata.Description = editParam.Description
		needUpdate = true
	}
	if editParam.Summary != "" && editParam.Summary != metdata.Summary {
		metdata.Summary = editParam.Summary
		needUpdate = true
	}
	if editParam.Path != "" && editParam.Path != metdata.Path {
		metdata.Path = editParam.Path
		needUpdate = true
	}
	if editParam.Method != "" && editParam.Method != metdata.Method {
		metdata.Method = editParam.Method
		needUpdate = true
	}
	if editParam.APISpec != nil {
		metdata.APISpec = utils.ObjectToJSON(editParam.APISpec)
		needUpdate = true
	}
	if !needUpdate {
		// 不需要更新元数据
		version = metdata.Version
		return
	}
	metdata.Version = ""
	version, err = m.DBAPIMetadataManager.InsertAPIMetadata(ctx, tx, metdata)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("insert api metadata failed, Version: %s, err: %v", metdata.Version, err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, "insert api metadata failed")
	}
	return
}

// upgradeOperatorInfo 升级算子信息
/*
	已发布版本元数据出现变更，因此需要生成一条新的元数据记录
	1. 元数据表中生成一条新的记录
	2. 更改注册表配置： 包含version，以及本次变更的信息
	3. 如果 direct_publish 为 true， 则直接发布, 需要向release/release_history中添加一条记录
*/

func (m *operatorManager) upgradeOperatorInfo(ctx context.Context, tx *sql.Tx, req *interfaces.OperatorEditReq, operator *model.OperatorRegisterDB,
	currentAPIMetadata *model.APIMetadataDB, editMetdataParam *interfaces.APIMetadataEdit, isDataSource bool) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 升级元数据
	var version string
	switch interfaces.MetadataType(operator.MetadataType) {
	case interfaces.MetadataTypeAPI:
		version, err = m.upgradeAPIMetadata(ctx, tx, editMetdataParam, currentAPIMetadata, req.UserID)
	default:
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtOperatorUnSupportUpgrade, "operator metadata type not support upgrade")
	}
	if err != nil {
		return
	}
	// 3. 组装算子注册信息， 新增到算子注册表
	operator.MetadataVersion = version
	err = m.modifyOperator(ctx, tx, req, operator, isDataSource)
	return
}
