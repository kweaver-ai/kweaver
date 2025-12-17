package operator

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	icommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/creasty/defaults"
)

// Export 导出算子
func (m *operatorManager) Export(ctx context.Context, req *interfaces.ExportReq) (data *interfaces.ComponentImpexConfigModel, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 导出预检查
	operatorList, err := m.exportPreCheck(ctx, req)
	if err != nil {
		return
	}
	data = &interfaces.ComponentImpexConfigModel{
		Operator: &interfaces.OperatorImpexConfig{},
	}
	// 导出依赖及追加依赖算子
	allOperatorDBs, compositeConfigs, err := m.getCompositeOperatorDependencies(ctx, operatorList, req.UserID)
	if err != nil {
		return
	}
	data.Operator.CompositeConfigs = compositeConfigs

	// 批量获取算子元数据
	items, err := m.batchGetOperatorInfo(ctx, allOperatorDBs)
	if err != nil {
		return
	}
	data.Operator.Configs = items
	return
}

// Import 导入算子
func (m *operatorManager) Import(ctx context.Context, tx *sql.Tx, mode interfaces.ImportType, data *interfaces.OperatorImpexConfig, userID string) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	if data == nil || len(data.Configs) == 0 {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtCommonImportDataEmpty, "operator configs is empty")
		return
	}
	// 导入预备检查
	operatorList, err := m.importPreCheck(ctx, mode, data.Configs)
	if err != nil {
		return
	}
	accessor, err := m.AuthService.GetAccessor(ctx, userID)
	if err != nil {
		return
	}
	// 导入算子元数据
	createMap, updateMap, err := m.batchImportOperatorMetadata(ctx, tx, data.Configs, operatorList, accessor)
	if err != nil {
		return
	}

	err = m.importPostProcess(ctx, createMap, updateMap, accessor)
	return
}

// 后置操作：添加权限配置，及审计日志记录
func (m *operatorManager) importPostProcess(ctx context.Context, createMap, updateMap map[string]*model.OperatorRegisterDB, accessor *interfaces.AuthAccessor) (err error) {

	businessDomainId, _ := icommon.GetBusinessDomainFromCtx(ctx)
	for _, operatorDB := range createMap {
		// 关联业务域
		err = m.BusinessDomainService.AssociateResource(ctx, businessDomainId, operatorDB.OperatorID, interfaces.AuthResourceTypeOperator)
		if err != nil {
			return
		}

		// 触发新建策略，创建人默认拥有对当前资源的所有操作权限
		err := m.AuthService.CreateOwnerPolicy(ctx, accessor, &interfaces.AuthResource{
			ID:   operatorDB.OperatorID,
			Type: string(interfaces.AuthResourceTypeOperator),
			Name: operatorDB.Name,
		})
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("[importPostProcess] CreateOwnerPolicy err :%v", err)
		}
		// 记录设计日志及后续通知
		go func() {
			tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
			m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
				TokenInfo: tokenInfo,
				Accessor:  accessor,
				Operation: metric.AuditLogOperationCreate,
				Object: &metric.AuditLogObject{
					Type: metric.AuditLogObjectOperator,
					ID:   operatorDB.OperatorID,
					Name: operatorDB.Name,
				},
			})
		}()
	}
	// 更新算子
	for _, operatorDB := range updateMap {
		// 通知资源变更
		authResource := &interfaces.AuthResource{
			ID:   operatorDB.OperatorID,
			Name: operatorDB.Name,
			Type: string(interfaces.AuthResourceTypeOperator),
		}
		err := m.AuthService.NotifyResourceChange(ctx, authResource)
		if err != nil {
			m.Logger.WithContext(ctx).Warnf("[importPostProcess] NotifyResourceChange err :%v", err)
		}
		// 记录设计日志及后续通知
		go func() {
			tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
			m.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
				TokenInfo: tokenInfo,
				Accessor:  accessor,
				Operation: metric.AuditLogOperationEdit,
				Object: &metric.AuditLogObject{
					Type: metric.AuditLogObjectOperator,
					ID:   operatorDB.OperatorID,
					Name: operatorDB.Name,
				},
			})
		}()
	}
	return nil
}

// 导入预备检查
func (m *operatorManager) importPreCheck(ctx context.Context, mode interfaces.ImportType, items []*interfaces.OperatorImpexItem) (operatorList []*model.OperatorRegisterDB, err error) {
	// 获取待导入算子ID列表、name列表
	operatorIDs := make([]string, 0)

	for _, operatorItem := range items {
		operatorIDs = append(operatorIDs, operatorItem.OperatorID)
		// 内置算子不允许导入
		if operatorItem.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("internal operator %v not allowed to import", operatorItem.OperatorID), operatorItem.OperatorName)
			return
		}
		// 算子重名校验
		err = m.checkDuplicateName(ctx, operatorItem.OperatorName, operatorItem.OperatorID)
		if err != nil {
			return
		}
	}
	operatorIDs = utils.UniqueStrings(operatorIDs)
	// 检查ID资源是否冲突
	operatorList, err = m.DBOperatorManager.SelectByOperatorIDs(ctx, operatorIDs)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator list err: %v", err.Error())
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 创建模式：如果算子已存在，则返回冲突错误
	if mode == interfaces.ImportTypeCreate && len(operatorList) > 0 {
		err = errors.NewHTTPError(ctx, http.StatusConflict, errors.ErrExtCommonResourceIDConflict, "operator id already exists")
	}
	return
}

// 批量导入算子元数据
func (m *operatorManager) batchImportOperatorMetadata(ctx context.Context, tx *sql.Tx, items []*interfaces.OperatorImpexItem, operatorList []*model.OperatorRegisterDB,
	accessor *interfaces.AuthAccessor) (createMap, updateMap map[string]*model.OperatorRegisterDB, err error) {
	// 需要新增的算子列表
	createMap = map[string]*model.OperatorRegisterDB{}
	// 需要更新的算子列表
	updateMap = map[string]*model.OperatorRegisterDB{}
	for _, operatorDB := range operatorList {
		// 检查算子编辑权限
		err = m.AuthService.CheckModifyPermission(ctx, accessor, operatorDB.OperatorID, interfaces.AuthResourceTypeOperator)
		if err != nil {
			return
		}
		// 内置算子不允许更新
		if operatorDB.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("internal operator %v not allowed to update", operatorDB.OperatorID), operatorDB.Name)
			return
		}
		updateMap[operatorDB.OperatorID] = operatorDB
	}
	for _, operatorItem := range items {
		// 参数预备检查
		var newOperatorDB *model.OperatorRegisterDB
		var newMetadataDB *model.APIMetadataDB
		newOperatorDB, newMetadataDB, err = m.importCheck(ctx, operatorItem, accessor.ID)
		if err != nil {
			return
		}
		operatorDB, ok := updateMap[newOperatorDB.OperatorID]
		if ok { // 更新算子
			err = m.updateOperatorConfig(ctx, tx, operatorDB, newOperatorDB, newMetadataDB)
			if err != nil {
				return
			}
			updateMap[operatorDB.OperatorID] = operatorDB
			if operatorDB.Status == interfaces.BizStatusPublished.String() {
				err = m.publishRelease(ctx, tx, operatorDB, operatorDB.UpdateUser)
			}
		} else { // 新增算子
			err = m.addOperatorConfig(ctx, tx, newOperatorDB, newMetadataDB) // 新增算子
			if err != nil {
				return
			}
			createMap[newOperatorDB.OperatorID] = newOperatorDB
			// 发布算子
			if newOperatorDB.Status == interfaces.BizStatusPublished.String() {
				err = m.publishRelease(ctx, tx, newOperatorDB, newOperatorDB.CreateUser)
			}
		}
		if err != nil {
			return
		}
	}
	return
}

// 添加算子配置
func (m *operatorManager) addOperatorConfig(ctx context.Context, tx *sql.Tx, operatorDB *model.OperatorRegisterDB, metadataDB *model.APIMetadataDB) (err error) {
	metadataDB.Version = ""
	version, err := m.DBAPIMetadataManager.InsertAPIMetadata(ctx, tx, metadataDB)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("insert api metadata failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	operatorDB.MetadataVersion = version
	_, err = m.DBOperatorManager.InsertOperator(ctx, tx, operatorDB)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("insert operator failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	return
}

// 更新（升级）算子配置
func (m *operatorManager) updateOperatorConfig(ctx context.Context, tx *sql.Tx, operatorDB,
	newOperatorDB *model.OperatorRegisterDB, newMetadataDB *model.APIMetadataDB) (err error) {
	operatorDB.Category = newOperatorDB.Category
	operatorDB.Name = newOperatorDB.Name
	operatorDB.OperatorType = newOperatorDB.OperatorType
	operatorDB.ExecutionMode = newOperatorDB.ExecutionMode
	operatorDB.Category = newOperatorDB.Category
	operatorDB.Source = newOperatorDB.Source
	operatorDB.ExecuteControl = newOperatorDB.ExecuteControl
	operatorDB.ExtendInfo = newOperatorDB.ExtendInfo
	operatorDB.UpdateUser = newOperatorDB.CreateUser
	operatorDB.UpdateTime = time.Now().UnixNano()
	operatorDB.MetadataType = newOperatorDB.MetadataType
	switch interfaces.BizStatus(operatorDB.Status) {
	case interfaces.BizStatusPublished, interfaces.BizStatusOffline:
		newMetadataDB.Version = ""
		operatorDB.MetadataVersion, err = m.DBAPIMetadataManager.InsertAPIMetadata(ctx, tx, newMetadataDB)
	case interfaces.BizStatusUnpublish, interfaces.BizStatusEditing:
		// 检查元数据是否存在
		var metadataDB *model.APIMetadataDB
		var has bool
		has, metadataDB, err = m.DBAPIMetadataManager.SelectByVersion(ctx, operatorDB.MetadataVersion)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("select api metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		if has {
			metadataDB.Summary = newMetadataDB.Summary
			metadataDB.Description = newMetadataDB.Description
			metadataDB.Path = newMetadataDB.Path
			metadataDB.ServerURL = newMetadataDB.ServerURL
			metadataDB.Method = newMetadataDB.Method
			metadataDB.APISpec = newMetadataDB.APISpec
			metadataDB.UpdateUser = newOperatorDB.CreateUser
			metadataDB.UpdateTime = time.Now().UnixNano()
			err = m.DBAPIMetadataManager.UpdateByVersion(ctx, tx, operatorDB.MetadataVersion, metadataDB)
		} else {
			operatorDB.MetadataVersion, err = m.DBAPIMetadataManager.InsertAPIMetadata(ctx, tx, newMetadataDB)
		}
	}
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("upsert api metadata failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	operatorDB.Status = newOperatorDB.Status
	err = m.DBOperatorManager.UpdateByOperatorID(ctx, tx, operatorDB)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("update operator failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	return
}

func (m *operatorManager) importCheck(ctx context.Context, item *interfaces.OperatorImpexItem, userID string) (operatorDB *model.OperatorRegisterDB, metadataDB *model.APIMetadataDB, err error) {
	// 校验算子信息
	err = m.Validator.ValidateOperatorName(ctx, item.OperatorName)
	if err != nil {
		return
	}
	item.IsInternal = false

	if item.OperatorInfo == nil {
		item.OperatorInfo = &interfaces.OperatorInfo{}
		err = defaults.Set(item.OperatorInfo)
		if err != nil {
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
			return
		}
	}
	if item.OperatorExecuteControl == nil {
		item.OperatorExecuteControl = &interfaces.OperatorExecuteControl{}
		err = defaults.Set(item.OperatorExecuteControl)
		if err != nil {
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
			return
		}
	}
	// 如果是数据源算子，只能够是同步算子
	isDataSource, err := checkIsDataSource(ctx, item.OperatorInfo.ExecutionMode, item.OperatorInfo.IsDataSource)
	if err != nil {
		return
	}
	// 检查分类是否存在,不存在设置为默认分类
	if !m.CategoryManager.CheckCategory(item.OperatorInfo.Category) {
		item.OperatorInfo.Category = interfaces.CategoryTypeOther
	}
	if item.MetadataType != interfaces.MetadataTypeAPI {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("operator %v metadata type %v not support", item.OperatorName, item.MetadataType))
		return
	}
	// 检查元数据
	if item.Metadata == nil {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("operator %v metadata is nil", item.OperatorName))
		return
	}
	metadata := &interfaces.APIMetadata{}
	err = utils.AnyToObject(item.Metadata, metadata)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
		return
	}

	err = m.Validator.ValidatorStruct(ctx, metadata)
	if err != nil {
		return
	}
	// 如果算子描述为空，默认使用算子名称
	if metadata.Description == "" {
		metadata.Description = metadata.Summary
	}
	err = m.Validator.ValidateOperatorDesc(ctx, metadata.Description)
	if err != nil {
		return
	}
	operatorDB = &model.OperatorRegisterDB{
		OperatorID:      item.OperatorID,
		Name:            item.OperatorName,
		MetadataType:    string(interfaces.MetadataTypeAPI),
		MetadataVersion: metadata.Version,
		Status:          item.Status.String(),
		OperatorType:    string(item.OperatorInfo.Type),
		ExecutionMode:   string(item.OperatorInfo.ExecutionMode),
		Category:        string(item.OperatorInfo.Category),
		Source:          item.OperatorInfo.Source,
		ExecuteControl:  utils.ObjectToJSON(item.OperatorExecuteControl),
		ExtendInfo:      utils.ObjectToJSON(item.ExtendInfo),
		CreateUser:      userID,
		CreateTime:      time.Now().UnixNano(),
		UpdateUser:      userID,
		UpdateTime:      time.Now().UnixNano(),
		IsDataSource:    isDataSource,
		IsInternal:      false,
	}
	metadataDB = &model.APIMetadataDB{
		Summary:     metadata.Summary,
		Version:     metadata.Version,
		Description: metadata.Description,
		Path:        metadata.Path,
		ServerURL:   metadata.ServerURL,
		Method:      metadata.Method,
		APISpec:     utils.ObjectToJSON(metadata.APISpec),
		CreateUser:  userID,
		CreateTime:  time.Now().UnixNano(),
		UpdateUser:  userID,
		UpdateTime:  time.Now().UnixNano(),
	}
	return
}

// 导出预检查
func (m *operatorManager) exportPreCheck(ctx context.Context, req *interfaces.ExportReq) (operatorList []*model.OperatorRegisterDB, err error) {
	// 批量鉴权
	var accessor *interfaces.AuthAccessor
	accessor, err = m.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	// 检查查看权限
	checkOperatorIDs, err := m.AuthService.ResourceFilterIDs(ctx, accessor, req.IDs,
		interfaces.AuthResourceTypeOperator, interfaces.AuthOperationTypeView)
	if err != nil {
		return
	}
	if len(checkOperatorIDs) != len(req.IDs) {
		clist := utils.FindMissingElements(req.IDs, checkOperatorIDs)
		err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden,
			fmt.Sprintf("operator %v not access", clist))
		return
	}
	// 检查算子是否存在
	operatorList, err = m.DBOperatorManager.SelectByOperatorIDs(ctx, req.IDs)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select operator list err: %s", err.Error())
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if len(operatorList) != len(req.IDs) {
		checkOperatorIDs := []string{}
		for _, v := range operatorList {
			checkOperatorIDs = append(checkOperatorIDs, v.OperatorID)
		}
		clist := utils.FindMissingElements(req.IDs, checkOperatorIDs)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtOperatorNotFound,
			fmt.Sprintf("operator %v not found", clist))
		return
	}
	return
}

// 拉取组合算子依赖并进行去重
func (m *operatorManager) getCompositeOperatorDependencies(ctx context.Context, operatorDBs []*model.OperatorRegisterDB, userID string) (allOperatorDBs []*model.OperatorRegisterDB,
	compositeConfigs []any, err error) {
	dagIDs := []string{}
	// 收集算子ID
	allOperatorDBs = append(allOperatorDBs, operatorDBs...)
	operatorMap := map[string]bool{}
	for _, operatorDB := range operatorDBs {
		operatorMap[operatorDB.OperatorID] = true
		if operatorDB.OperatorType == string(interfaces.OperatorTypeComposite) && operatorDB.ExtendInfo != "" {
			extendInfo := map[string]interface{}{}
			err = utils.StringToObject(operatorDB.ExtendInfo, &extendInfo)
			if err != nil {
				m.Logger.WithContext(ctx).Errorf("string to object err: %s", err.Error())
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
				return
			}
			if extendInfo["dag_id"].(string) != "" {
				dagIDs = append(dagIDs, extendInfo["dag_id"].(string))
			}
		}
	}
	if len(dagIDs) == 0 {
		return
	}
	// 依赖算子ID
	dependencyOperatorIDs := []string{}
	// 请求组合算子依赖
	var resp *interfaces.FlowAutomationExportResp
	resp, err = m.FlowAutomation.Export(ctx, dagIDs)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("export dag err: %s", err.Error())
		return
	}
	compositeConfigs = append(compositeConfigs, resp.Configs...)
	dependencyOperatorIDs = append(dependencyOperatorIDs, resp.OperatorIDs...)
	// 去重
	dependencyOperatorIDs = utils.UniqueStrings(dependencyOperatorIDs)
	for _, operatorID := range dependencyOperatorIDs {
		if operatorMap[operatorID] {
			dependencyOperatorIDs = utils.RemoveStringFromSlice(dependencyOperatorIDs, operatorID)
			continue
		}
	}
	if len(dependencyOperatorIDs) == 0 {
		return
	}
	operatorList, err := m.exportPreCheck(ctx, &interfaces.ExportReq{
		UserID: userID,
		IDs:    dependencyOperatorIDs,
	})
	if err != nil {
		return
	}
	// 去重
	for _, operatorDB := range operatorList {
		if !operatorMap[operatorDB.OperatorID] {
			allOperatorDBs = append(allOperatorDBs, operatorDB)
			continue
		}
	}
	return
}

// batchGetOperatorInfo 批量获取算子信息
func (m *operatorManager) batchGetOperatorInfo(ctx context.Context, operatorDBs []*model.OperatorRegisterDB) (items []*interfaces.OperatorImpexItem, err error) {
	metadataIDs := []string{}
	items = []*interfaces.OperatorImpexItem{}
	// 收集组合算子流程ID

	for _, v := range operatorDBs {
		if v.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("operator %v not allowed to export", v.OperatorID), v.Name)
			return
		}
		extendInfo := map[string]interface{}{}
		err = utils.StringToObject(v.ExtendInfo, &extendInfo)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("string to object err: %s", err.Error())
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		executeControl := &interfaces.OperatorExecuteControl{}
		err = utils.StringToObject(v.ExecuteControl, &executeControl)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("string to object err: %s", err.Error())
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		items = append(items, &interfaces.OperatorImpexItem{
			OperatorID:   v.OperatorID,
			OperatorName: v.Name,
			Version:      v.MetadataVersion,
			Status:       interfaces.BizStatus(v.Status),
			MetadataType: interfaces.MetadataType(v.MetadataType),
			ExtendInfo:   extendInfo,
			OperatorInfo: &interfaces.OperatorInfo{
				Type:          interfaces.OperatorType(v.OperatorType),
				ExecutionMode: interfaces.ExecutionMode(v.ExecutionMode),
				Category:      interfaces.BizCategory(v.Category),
				Source:        v.Source,
				IsDataSource:  &v.IsDataSource,
			},
			OperatorExecuteControl: executeControl,
			CreateUser:             v.CreateUser,
			CreateTime:             v.CreateTime,
			UpdateUser:             v.UpdateUser,
			UpdateTime:             v.UpdateTime,
			IsInternal:             v.IsInternal,
		})
		metadataIDs = append(metadataIDs, v.MetadataVersion)
	}
	// 收集metadata信息
	metadataMap := map[string]*interfaces.APIMetadata{}
	metadataList, err := m.DBAPIMetadataManager.SelectListByVersion(ctx, metadataIDs)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("select metadata list err: %s", err.Error())
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	for _, metadata := range metadataList {
		apiSpec := &interfaces.APISpec{}
		err = utils.StringToObject(metadata.APISpec, apiSpec)
		if err != nil {
			m.Logger.WithContext(ctx).Errorf("string to object err: %s", err.Error())
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		metadataMap[metadata.Version] = &interfaces.APIMetadata{
			Summary:     metadata.Summary,
			Version:     metadata.Version,
			Description: metadata.Description,
			Path:        metadata.Path,
			ServerURL:   metadata.ServerURL,
			Method:      metadata.Method,
			CreateTime:  metadata.CreateTime,
			UpdateTime:  metadata.UpdateTime,
			UpdateUser:  metadata.UpdateUser,
			CreateUser:  metadata.CreateUser,
			APISpec:     apiSpec,
		}
	}
	// 填充metadata信息
	for _, item := range items {
		item.Metadata = metadataMap[item.Version]
	}
	return
}
