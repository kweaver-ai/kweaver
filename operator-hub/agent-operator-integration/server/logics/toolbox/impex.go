package toolbox

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
	"github.com/google/uuid"
)

// Import 导入
func (s *ToolServiceImpl) Import(ctx context.Context, tx *sql.Tx, mode interfaces.ImportType, data *interfaces.ComponentImpexConfigModel, userID string) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	if data == nil || data.Toolbox == nil || len(data.Toolbox.Configs) == 0 {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtCommonImportDataEmpty, "toolbox configs is empty")
		return
	}
	// 导入预检查
	waitUpdataBoxList, err := s.importPreCheck(ctx, mode, data.Toolbox.Configs)
	if err != nil {
		return
	}
	accessor, err := s.AuthService.GetAccessor(ctx, userID)
	if err != nil {
		return
	}
	// 导入工具箱、工具信息
	createMap, updateMap, err := s.batchImportToolBoxMetadata(ctx, tx, data.Toolbox.Configs, waitUpdataBoxList, accessor)
	if err != nil {
		return
	}
	// 导入依赖
	if data.Operator != nil && len(data.Operator.Configs) > 0 {
		err = s.OperatorMgnt.Import(ctx, tx, mode, data.Operator, userID)
		if err != nil {
			return
		}
	}
	// 导入后置处理
	err = s.importPostProcess(ctx, createMap, updateMap, accessor)
	return
}

// 后置操作：添加权限配置，及审计日志记录
func (s *ToolServiceImpl) importPostProcess(ctx context.Context, createBoxMap, updateBoxMap map[string]*model.ToolboxDB, accessor *interfaces.AuthAccessor) (err error) {
	businessDomainID, _ := icommon.GetBusinessDomainFromCtx(ctx)
	for _, boxDB := range createBoxMap {
		// 关联业务域
		err = s.BusinessDomainService.AssociateResource(ctx, businessDomainID, boxDB.BoxID, interfaces.AuthResourceTypeToolBox)
		if err != nil {
			return
		}

		// 触发新建策略，创建人默认拥有对当前资源的所有操作权限
		err := s.AuthService.CreateOwnerPolicy(ctx, accessor, &interfaces.AuthResource{
			ID:   boxDB.BoxID,
			Type: string(interfaces.AuthResourceTypeToolBox),
			Name: boxDB.Name,
		})
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("[importPostProcess] CreateOwnerPolicy err:%v", err)
		}
		// 记录设计日志及后续通知
		go func() {
			tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
			s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
				TokenInfo: tokenInfo,
				Accessor:  accessor,
				Operation: metric.AuditLogOperationCreate,
				Object: &metric.AuditLogObject{
					Type: metric.AuditLogObjectTool,
					ID:   boxDB.BoxID,
					Name: boxDB.Name,
				},
			})
		}()
	}
	// 更新工具箱
	for _, boxDB := range updateBoxMap {
		// 通知资源变更
		authResource := &interfaces.AuthResource{
			ID:   boxDB.BoxID,
			Name: boxDB.Name,
			Type: string(interfaces.AuthResourceTypeToolBox),
		}
		err := s.AuthService.NotifyResourceChange(ctx, authResource)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("[importPostProcess] NotifyResourceChange err:%v", err)
		}
		// 记录设计日志及后续通知
		go func() {
			tokenInfo, _ := icommon.GetTokenInfoFromCtx(ctx)
			s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
				TokenInfo: tokenInfo,
				Accessor:  accessor,
				Operation: metric.AuditLogOperationEdit,
				Object: &metric.AuditLogObject{
					Type: metric.AuditLogObjectTool,
					ID:   boxDB.BoxID,
					Name: boxDB.Name,
				},
			})
		}()
	}
	return nil
}

// 导入预备检查
func (s *ToolServiceImpl) importPreCheck(ctx context.Context, mode interfaces.ImportType, items []*interfaces.ToolBoxImpexItem) (boxList []*model.ToolboxDB, err error) {
	// 收集工具箱ID，及名字
	boxIDs := []string{}
	for _, item := range items {
		boxIDs = append(boxIDs, item.BoxID)
		if item.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("internal toolbox %v not allowed to import", item.BoxID), item.BoxName)
			return
		}
		// 工具箱重名校验
		err = s.checkBoxDuplicateName(ctx, item.BoxName, item.BoxID)
		if err != nil {
			return
		}
	}
	// 检查ID资源是否冲突
	boxIDs = utils.UniqueStrings(boxIDs)
	boxList, err = s.ToolBoxDB.SelectListByBoxIDs(ctx, boxIDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox by ids failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 创建模式：如果工具箱已存在，则返回冲突错误
	if mode == interfaces.ImportTypeCreate && len(boxList) > 0 {
		err = errors.NewHTTPError(ctx, http.StatusConflict, errors.ErrExtCommonResourceIDConflict, "toolbox id already exists")
	}
	return
}

// 批量导入工具箱及工具元数据
func (s *ToolServiceImpl) batchImportToolBoxMetadata(ctx context.Context, tx *sql.Tx, items []*interfaces.ToolBoxImpexItem, waitUpdataBoxList []*model.ToolboxDB,
	accessor *interfaces.AuthAccessor) (createBoxMap, updateBoxMap map[string]*model.ToolboxDB, err error) {
	// 收集需要新增的ToolBox
	createBoxMap = map[string]*model.ToolboxDB{}
	// 收集需要更新的工具ToolBox
	updateBoxMap = map[string]*model.ToolboxDB{}
	for _, boxDB := range waitUpdataBoxList {
		// 检查工具箱编辑权限
		err = s.AuthService.CheckModifyPermission(ctx, accessor, boxDB.BoxID, interfaces.AuthResourceTypeToolBox)
		if err != nil {
			return
		}
		// 内置工具箱不能编辑
		if boxDB.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("internal toolbox %v not allowed to update", boxDB.BoxID), boxDB.Name)
			return
		}
		updateBoxMap[boxDB.BoxID] = boxDB
	}
	for _, item := range items {
		if boxDB, ok := updateBoxMap[item.BoxID]; ok { // 更新
			err = s.importByUpsert(ctx, tx, boxDB, item, accessor.ID)
			if err != nil {
				return
			}
		} else {
			boxDB, err = s.importByCreate(ctx, tx, item, accessor.ID)
			if err != nil {
				return
			}
			createBoxMap[boxDB.BoxID] = boxDB
		}
	}
	return
}

// importByCreate 导入工具箱
func (s *ToolServiceImpl) importByCreate(ctx context.Context, tx *sql.Tx, item *interfaces.ToolBoxImpexItem, userID string) (boxDB *model.ToolboxDB, err error) {
	// 校验导入的工具箱信息
	toolDBs, metadataDBs, err := s.importCheck(ctx, item, userID)
	if err != nil {
		return
	}
	// 添加工具箱
	boxDB = &model.ToolboxDB{
		BoxID:       item.BoxID,
		Name:        item.BoxName,
		Description: item.BoxDesc,
		Source:      item.Source,
		ServerURL:   item.BoxSvcURL,
		Category:    item.CategoryType,
		Status:      item.Status.String(),
		IsInternal:  false,
		CreateTime:  time.Now().UnixNano(),
		CreateUser:  userID,
		UpdateUser:  userID,
		UpdateTime:  time.Now().UnixNano(),
	}
	if item.Status == interfaces.BizStatusPublished {
		boxDB.ReleaseUser = userID
		boxDB.ReleaseTime = time.Now().UnixNano()
	}
	_, err = s.ToolBoxDB.InsertToolBox(ctx, tx, boxDB)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("insert toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 处理元数据
	metadataMap := map[string]*model.APIMetadataDB{}
	for _, metadataDB := range metadataDBs {
		version := metadataDB.Version
		metadataDB.Version = uuid.New().String()
		metadataMap[version] = metadataDB
	}
	newMetadataDBs := []*model.APIMetadataDB{}
	toolIDs := []string{}
	for _, toolDB := range toolDBs {
		if metadataDB, ok := metadataMap[toolDB.SourceID]; ok {
			toolDB.SourceID = metadataDB.Version
			newMetadataDBs = append(newMetadataDBs, metadataDB)
			toolIDs = append(toolIDs, toolDB.ToolID)
		}
	}
	// 检查工具是否重复
	duplicateTools, err := s.ToolDB.SelectToolBoxByToolIDs(ctx, toolIDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool by source ids failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if len(duplicateTools) > 0 {
		err = errors.NewHTTPError(ctx, http.StatusConflict, errors.ErrExtCommonResourceIDConflict, "tool resource conflict")
		return
	}
	// 添加元数据
	if len(newMetadataDBs) > 0 {
		_, err = s.MetadataDB.InsertAPIMetadatas(ctx, tx, newMetadataDBs)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	// 添加工具
	if len(toolDBs) > 0 {
		_, err = s.ToolDB.InsertTools(ctx, tx, toolDBs)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	return
}

// importByUpsert 更新或创建
func (s *ToolServiceImpl) importByUpsert(ctx context.Context, tx *sql.Tx, toolBoxDB *model.ToolboxDB, item *interfaces.ToolBoxImpexItem, userID string) (err error) {
	// 校验导入的工具箱信息
	toolDBs, metadataDBs, err := s.importCheck(ctx, item, userID)
	if err != nil {
		return
	}
	toolBoxDB.Name = item.BoxName
	toolBoxDB.Description = item.BoxDesc
	toolBoxDB.ServerURL = item.BoxSvcURL
	toolBoxDB.Category = item.CategoryType
	toolBoxDB.UpdateTime = time.Now().UnixNano()
	toolBoxDB.UpdateUser = userID
	toolBoxDB.Status = item.Status.String()
	if item.Status == interfaces.BizStatusPublished {
		toolBoxDB.ReleaseUser = userID
		toolBoxDB.ReleaseTime = time.Now().UnixNano()
	}
	err = s.ToolBoxDB.UpdateToolBox(ctx, tx, toolBoxDB)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("update toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 获取工具箱内的工具
	tools, err := s.ToolDB.SelectToolByBoxID(ctx, toolBoxDB.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tools failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 删除工具箱中的工具
	err = s.deleteTools(ctx, tx, toolBoxDB.BoxID, tools)
	if err != nil {
		return
	}
	// 添加元数据
	if len(metadataDBs) > 0 {
		_, err = s.MetadataDB.InsertAPIMetadatas(ctx, tx, metadataDBs)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	// 添加工具
	if len(toolDBs) > 0 {
		_, err = s.ToolDB.InsertTools(ctx, tx, toolDBs)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	return
}

// importCheck 校验导入的工具箱信息
func (s *ToolServiceImpl) importCheck(ctx context.Context, item *interfaces.ToolBoxImpexItem, userID string) (toolDBs []*model.ToolDB, metadataDBs []*model.APIMetadataDB, err error) {
	// 校验工具箱信息
	err = s.Validator.ValidatorToolBoxName(ctx, item.BoxName)
	if err != nil {
		return
	}
	// 检查desc
	err = s.Validator.ValidatorToolBoxDesc(ctx, item.BoxDesc)
	if err != nil {
		return
	}
	// 检查分类是否存在
	if !s.CategoryManager.CheckCategory(interfaces.BizCategory(item.CategoryType)) {
		// 设置为默认分类
		item.CategoryType = interfaces.CategoryTypeOther.String()
	}
	// 检查是否为内置
	item.IsInternal = false
	toolDBs = []*model.ToolDB{}
	metadataDBs = []*model.APIMetadataDB{}
	toolNames := make(map[string]bool)
	for _, toolReq := range item.Tools {
		if _, ok := toolNames[toolReq.Name]; ok {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNameDuplicate,
				fmt.Sprintf("tool name %v duplicate", toolReq.Name), toolReq.Name)
			return
		}
		// 校验工具信息
		err = s.Validator.ValidatorToolName(ctx, toolReq.Name)
		if err != nil {
			return
		}
		if toolReq.Description == "" {
			toolReq.Description = toolReq.Name
		}
		err = s.Validator.ValidatorToolDesc(ctx, toolReq.Description)
		if err != nil {
			return
		}
		toolNames[toolReq.Name] = true
		toolDBs = append(toolDBs, &model.ToolDB{
			ToolID:      toolReq.ToolID,
			BoxID:       item.BoxID,
			Name:        toolReq.Name,
			Description: toolReq.Description,
			SourceID:    toolReq.SourceID,
			SourceType:  toolReq.SourceType,
			Status:      toolReq.Status.String(),
			UseRule:     toolReq.UseRule,
			Parameters:  utils.ObjectToJSON(toolReq.GlobalParameters),
			CreateUser:  userID,
			CreateTime:  time.Now().UnixNano(),
			UpdateUser:  userID,
			UpdateTime:  time.Now().UnixNano(),
			ExtendInfo:  utils.ObjectToJSON(toolReq.ExtendInfo),
		})
		switch toolReq.SourceType {
		case model.SourceTypeOpenAPI:
			// 检查工具元数据类型，仅支持API
			if toolReq.Metadata == nil {
				err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "tool metadata is nil")
				return
			}
			metadata := &interfaces.APIMetadata{}
			err = utils.AnyToObject(toolReq.Metadata, metadata)
			if err != nil {
				err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
				return
			}
			err = s.Validator.ValidatorStruct(ctx, metadata)
			if err != nil {
				return
			}
			metadataDBs = append(metadataDBs, &model.APIMetadataDB{
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
			})
		case model.SourceTypeOperator:
		}
	}
	return
}

// 导出预检查
func (s *ToolServiceImpl) exportPreCheck(ctx context.Context, req *interfaces.ExportReq) (boxDBs []*model.ToolboxDB, err error) {
	// 批量鉴权
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	// 检查查看权限权限
	checkBoxIDs, err := s.AuthService.ResourceFilterIDs(ctx, accessor, req.IDs,
		interfaces.AuthResourceTypeToolBox, interfaces.AuthOperationTypeView)
	if err != nil {
		return
	}
	if len(checkBoxIDs) != len(req.IDs) {
		clist := utils.FindMissingElements(req.IDs, checkBoxIDs)
		err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden,
			fmt.Sprintf("toolbox %v not access", clist))
		return
	}
	// 检查数据是否存在
	boxDBs, err = s.ToolBoxDB.SelectListByBoxIDs(ctx, req.IDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox list err: %s", err.Error())
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if len(boxDBs) != len(req.IDs) {
		checkBoxes := []string{}
		for _, v := range boxDBs {
			checkBoxes = append(checkBoxes, v.BoxID)
		}
		clist := utils.FindMissingElements(req.IDs, checkBoxes)
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtToolNotFound,
			fmt.Sprintf("toolbox %v not found", clist))
		return
	}
	return
}

// Export 导出
func (s *ToolServiceImpl) Export(ctx context.Context, req *interfaces.ExportReq) (data *interfaces.ComponentImpexConfigModel, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)

	boxDBs, err := s.exportPreCheck(ctx, req)
	if err != nil {
		return
	}
	// 批量获取工具箱内工具信息
	toolBoxConfig, depOperatorIDs, err := s.batchGetToolBoxInfo(ctx, boxDBs)
	if err != nil {
		return
	}
	data = &interfaces.ComponentImpexConfigModel{
		Toolbox: toolBoxConfig,
	}
	// 批量获取算子依赖信息
	depOperatorIDs = utils.UniqueStrings(depOperatorIDs)
	if len(depOperatorIDs) == 0 {
		return
	}
	operatorImpexConfig, err := s.OperatorMgnt.Export(ctx, &interfaces.ExportReq{
		UserID: req.UserID,
		IDs:    depOperatorIDs,
	})
	if err != nil {
		return
	}
	data.Operator = operatorImpexConfig.Operator
	return
}

// 批量获取工具箱内工具信息
func (s *ToolServiceImpl) batchGetToolBoxInfo(ctx context.Context, boxDBs []*model.ToolboxDB) (toolBoxInfo *interfaces.ToolBoxImpexConfig,
	depOperatorIDs []string, err error) {
	// 收集所有的工具
	toolsMap := map[string]map[string]*interfaces.ToolImpexItem{} // 工具箱ID
	toolBoxInfo = &interfaces.ToolBoxImpexConfig{
		Configs: []*interfaces.ToolBoxImpexItem{},
	}
	// 组装工具箱信息
	boxIDs := []string{}
	for _, boxDB := range boxDBs {
		if boxDB.IsInternal {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonInternalComponentNotAllowed,
				fmt.Sprintf("toolbox %v not found", boxDB.BoxID), boxDB.Name)
			return
		}
		boxIDs = append(boxIDs, boxDB.BoxID)
		toolsMap[boxDB.BoxID] = map[string]*interfaces.ToolImpexItem{}
		toolBox := &interfaces.ToolBoxImpexItem{
			BoxID:        boxDB.BoxID,
			BoxName:      boxDB.Name,
			BoxDesc:      boxDB.Description,
			BoxSvcURL:    boxDB.ServerURL,
			Status:       interfaces.BizStatus(boxDB.Status),
			CategoryType: boxDB.Category,
			CategoryName: s.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(boxDB.Category)),
			IsInternal:   boxDB.IsInternal,
			Source:       boxDB.Source,
			Tools:        []*interfaces.ToolImpexItem{},
			CreateTime:   boxDB.CreateTime,
			UpdateTime:   boxDB.UpdateTime,
			CreateUser:   boxDB.CreateUser,
			UpdateUser:   boxDB.UpdateUser,
		}
		toolBoxInfo.Configs = append(toolBoxInfo.Configs, toolBox)
	}
	// 获取工具箱内的全部工具
	tools, err := s.ToolDB.SelectToolBoxByIDs(ctx, boxIDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox by ids:%v, err:%v", boxIDs, err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	metadataIDs := []string{}                // 元数据ID列表
	sourceMetadataMap := map[string]string{} // 元数据ID映射
	for _, toolDB := range tools {
		globalParameters := &interfaces.ParametersStruct{}
		if toolDB.Parameters != "" {
			err = utils.StringToObject(toolDB.Parameters, globalParameters)
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("parse global parameters failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
				return
			}
		}
		extendInfo := map[string]interface{}{}
		_ = utils.StringToObject(toolDB.ExtendInfo, &extendInfo)
		toolImpexItem := &interfaces.ToolImpexItem{
			ToolInfo: interfaces.ToolInfo{
				ToolID:           toolDB.ToolID,
				Name:             toolDB.Name,
				Description:      toolDB.Description,
				MetadataType:     interfaces.MetadataType(toolDB.SourceType),
				Status:           interfaces.ToolStatusType(toolDB.Status),
				UseRule:          toolDB.UseRule,
				GlobalParameters: globalParameters,
				ExtendInfo:       extendInfo,
				UpdateTime:       toolDB.UpdateTime,
				CreateTime:       toolDB.CreateTime,
				UpdateUser:       toolDB.UpdateUser,
				CreateUser:       toolDB.CreateUser,
			},
			SourceID:   toolDB.SourceID,
			SourceType: toolDB.SourceType,
		}
		switch toolDB.SourceType {
		case model.SourceTypeOpenAPI:
			metadataIDs = append(metadataIDs, toolDB.SourceID)
			sourceMetadataMap[toolDB.SourceID] = toolDB.SourceID
		case model.SourceTypeOperator:
			depOperatorIDs = append(depOperatorIDs, toolDB.SourceID)
		}
		toolsMap[toolDB.BoxID][toolDB.ToolID] = toolImpexItem
	}

	// 批量获取元数据
	metadataDBs, err := func() ([]*model.APIMetadataDB, error) {
		// 分批查询元数据
		metadataDBs := []*model.APIMetadataDB{}
		var metadataList []*model.APIMetadataDB
		metadataIDs = utils.UniqueStrings(metadataIDs)
		if len(metadataIDs) == 0 {
			return []*model.APIMetadataDB{}, nil
		}
		for i := 0; i < len(metadataIDs); i += interfaces.DefaultBatchSize {
			end := i + interfaces.DefaultBatchSize
			if end > len(metadataIDs) {
				end = len(metadataIDs)
			}
			metadataList, err = s.MetadataDB.SelectListByVersion(ctx, metadataIDs[i:end])
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("select metadata failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select metadata failed")
				return nil, err
			}
			metadataDBs = append(metadataDBs, metadataList...)
		}
		return metadataDBs, nil
	}()
	if err != nil {
		return
	}
	// 解析元数据
	metadataMap := map[string]*interfaces.APIMetadata{}
	for _, metadataDB := range metadataDBs {
		apiSpec := &interfaces.APISpec{}
		err = utils.StringToObject(metadataDB.APISpec, apiSpec)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse api spec failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			continue
		}
		metadataMap[metadataDB.Version] = &interfaces.APIMetadata{
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
		}
	}
	// 组装数据
	for _, toolDB := range tools {
		if toolDB.SourceType != model.SourceTypeOpenAPI {
			continue
		}
		if toolsMap[toolDB.BoxID][toolDB.ToolID] == nil {
			continue
		}
		metadata := metadataMap[sourceMetadataMap[toolDB.SourceID]]
		if metadata == nil {
			continue
		}
		toolsMap[toolDB.BoxID][toolDB.ToolID].Metadata = metadata
	}

	for _, toolBox := range toolBoxInfo.Configs {
		for _, tool := range toolsMap[toolBox.BoxID] {
			toolBox.Tools = append(toolBox.Tools, tool)
		}
	}
	return
}
