// Package toolbox 工具箱、工具管理
// @file internal_tool.go
// @description: 管理实现
package toolbox

import (
	"context"
	"fmt"
	"net/http"
	"time"

	infracommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
)

// CreateToolBox 工具箱管理
func (s *ToolServiceImpl) CreateToolBox(ctx context.Context, req *interfaces.CreateToolBoxReq) (resp *interfaces.CreateToolBoxResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 1. 校验参数
	content, err := s.checkAndParserToolBox(ctx, req)
	if err != nil {
		return
	}

	// 检查新建权限
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckCreatePermission(ctx, accessor, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 2. 校验工具箱名称是否存在
	err = s.checkBoxDuplicateName(ctx, req.BoxName, "")
	if err != nil {
		return
	}

	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()

	// 添加工具箱
	toolBox := &model.ToolboxDB{
		Name:        req.BoxName,
		Description: req.BoxDesc,
		Status:      interfaces.BizStatusUnpublish.String(),
		Source:      req.Source,
		Category:    string(req.Category),
		ServerURL:   req.BoxSvcURL,
		CreateUser:  req.UserID,
		CreateTime:  time.Now().UnixNano(),
		UpdateUser:  req.UserID,
		UpdateTime:  time.Now().UnixNano(),
	}
	var boxID string
	boxID, err = s.ToolBoxDB.InsertToolBox(ctx, tx, toolBox)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("insert toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 3. 检查工具是否存在
	metadataMap, toolMap, _, _, err := s.parseOpenAPIToMetadata(ctx, boxID, req.UserID, content)
	if err != nil {
		return
	}
	var detils []metric.AuditLogToolDetil
	for key, tool := range toolMap {
		var sourceID string
		switch tool.SourceType {
		case model.SourceTypeOpenAPI:
			sourceID, err = s.MetadataDB.InsertAPIMetadata(ctx, tx, metadataMap[key])
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("insert metadata failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			}
		case model.SourceTypeOperator:
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("invalid operator source type: %s", tool.SourceType))
		default:
			err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("unsupported source type: %s", tool.SourceType))
		}
		if err != nil {
			return
		}
		// 添加工具
		tool.SourceID = sourceID
		_, err = s.ToolDB.InsertTool(ctx, tx, tool)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		detils = append(detils, metric.AuditLogToolDetil{
			ToolID:   tool.ToolID,
			ToolName: tool.Name,
		})
	}

	// 关联业务域
	err = s.BusinessDomainService.AssociateResource(ctx, req.BusinessDomainID, boxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}

	// 触发新建策略，创建人默认拥有对当前资源的所有操作权限
	err = s.AuthService.CreateOwnerPolicy(ctx, accessor, &interfaces.AuthResource{
		ID:   boxID,
		Type: string(interfaces.AuthResourceTypeToolBox),
		Name: req.BoxName,
	})
	if err != nil {
		return
	}

	// 记录审计日志
	go func() {
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationCreate,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos:         detils,
				OperationCode: metric.AddTool,
			},
		})
	}()
	resp = &interfaces.CreateToolBoxResp{
		BoxID: boxID,
	}
	return
}

// GetToolBox 获取工具箱信息
func (s *ToolServiceImpl) GetToolBox(ctx context.Context, req *interfaces.GetToolBoxReq, isMarket bool) (resp *interfaces.ToolBoxToolInfo, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 如果是公开接口，检查查看权限
	if infracommon.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		if isMarket {
			err = s.AuthService.CheckPublicAccessPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
		} else {
			err = s.AuthService.CheckViewPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
		}
		if err != nil {
			return
		}
	}

	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound,
			fmt.Sprintf("toolbox %s not found", req.BoxID))
		return
	}
	// 如果时市场接口，只能获取已发布工具详情
	if isMarket && toolBox.Status != interfaces.BizStatusPublished.String() {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound,
			fmt.Sprintf("toolbox %s is not published", req.BoxID))
		return
	}
	userIDs := []string{toolBox.CreateUser, toolBox.UpdateUser}
	resp = &interfaces.ToolBoxToolInfo{
		BoxID:        toolBox.BoxID,
		BoxName:      toolBox.Name,
		BoxDesc:      toolBox.Description,
		Status:       interfaces.BizStatus(toolBox.Status),
		BoxSvcURL:    toolBox.ServerURL,
		CategoryType: toolBox.Category,
		CategoryName: s.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(toolBox.Category)),
		IsInternal:   toolBox.IsInternal,
		Source:       toolBox.Source,
		Tools:        []*interfaces.ToolInfo{},
		CreateTime:   toolBox.CreateTime,
		UpdateTime:   toolBox.UpdateTime,
		CreateUser:   toolBox.CreateUser,
		UpdateUser:   toolBox.UpdateUser,
		ReleaseTime:  toolBox.ReleaseTime,
		ReleaseUser:  toolBox.ReleaseUser,
	}
	// 获取工具箱下的工具
	tools, err := s.ToolDB.SelectToolByBoxID(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	toolInfos, toolUserID, toolIDSourceMap, mids, err := s.batchGetToolInfo(ctx, tools)
	if err != nil {
		return
	}
	metadataMap, err := s.batchGetMetadata(ctx, mids)
	if err != nil {
		return
	}
	userIDs = append(userIDs, toolUserID...)
	// 获取用户名称
	userMap, err := s.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		return
	}
	// 填充元数据信息
	for _, tool := range toolInfos {
		metadataDB, ok := metadataMap[toolIDSourceMap[tool.ToolID]]
		if !ok {
			s.Logger.WithContext(ctx).Errorf("metadata not found, toolID: %s", tool.ToolID)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "metadata not found")
			return
		}
		metadataDB.ServerURL = toolBox.ServerURL
		tool.Metadata = metadataDB
		tool.CreateUser = userMap[tool.CreateUser]
		tool.UpdateUser = userMap[tool.UpdateUser]
	}
	resp.Tools = append(resp.Tools, toolInfos...)
	resp.CreateUser = userMap[toolBox.CreateUser]
	resp.UpdateUser = userMap[toolBox.UpdateUser]
	return
}

// DeleteBoxByID 删除工具箱
func (s *ToolServiceImpl) DeleteBoxByID(ctx context.Context, req *interfaces.DeleteBoxReq) (resp *interfaces.DeleteBoxResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
	})
	// 校验删除权限
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckDeletePermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 删除工具箱
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	err = s.deleteToolBox(ctx, tx, req.BoxID)
	if err != nil {
		return
	}

	// 取消关联业务域
	err = s.BusinessDomainService.DisassociateResource(ctx, req.BusinessDomainID, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 删除资源权限策略
	err = s.AuthService.DeletePolicy(ctx, []string{req.BoxID}, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}

	// 记录审计日志
	go func() {
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationDelete,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
		})
	}()
	return
}

// QueryToolBoxList 工具箱管理
func (s *ToolServiceImpl) QueryToolBoxList(ctx context.Context, req *interfaces.QueryToolBoxListReq) (resp *interfaces.QueryToolBoxListResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 构造查询条件
	filter := make(map[string]interface{})
	filter["all"] = req.All
	if req.BoxName != "" {
		filter["name"] = req.BoxName
	}
	if req.BoxCategory != "" {
		// 检查分类是否合法
		if !s.CategoryManager.CheckCategory(req.BoxCategory) {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxCategoryTypeInvalid,
				fmt.Sprintf(" %s category not found", req.BoxCategory))
			return
		}
		filter["category"] = req.BoxCategory
	}
	if req.CreateUser != "" {
		filter["create_user"] = req.CreateUser
	}
	if req.ReleaseUser != "" {
		filter["release_user"] = req.ReleaseUser
	}
	if req.Status != "" {
		filter["status"] = req.Status
	}
	operations := interfaces.AuthOperationTypeView
	resp = &interfaces.QueryToolBoxListResp{
		Data: []*interfaces.ToolBoxInfo{},
	}
	authResp, resourceToBdMap, err := s.getToolBoxListPage(ctx, filter, req.CommonPageParams, req.UserID, operations)
	if err != nil {
		return
	}
	resp.CommonPageResult = authResp.CommonPageResult
	toolBoxList := authResp.Data
	if len(toolBoxList) == 0 {
		return
	}
	// 组装工具箱信息结果
	toolBoxInfoList, err := s.getToolBoxList(ctx, toolBoxList, resourceToBdMap)
	if err != nil {
		return
	}
	resp.Data = toolBoxInfoList
	return
}

// UpdateToolBoxStatus 修改工具箱状态
func (s *ToolServiceImpl) UpdateToolBoxStatus(ctx context.Context, req *interfaces.UpdateToolBoxStatusReq) (resp *interfaces.UpdateToolBoxStatusResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
	})
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound,
			fmt.Sprintf("toolbox %s not found", req.BoxID))
		return
	}
	// 检查请求转换参数是否合法
	if !common.CheckStatusTransition(interfaces.BizStatus(toolBox.Status), req.Status) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxStatusInvalid,
			fmt.Sprintf("toolbox %s status can not be transition to %s", req.BoxID, req.Status))
		return
	}
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	var operation metric.AuditLogOperationType
	switch req.Status {
	case interfaces.BizStatusPublished:
		operation = metric.AuditLogOperationPublish
		// 校验发布权限
		err = s.AuthService.CheckPublishPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
		if err != nil {
			return
		}
		// 检查是否重名
		err = s.checkBoxDuplicateName(ctx, toolBox.Name, toolBox.BoxID)
	case interfaces.BizStatusUnpublish, interfaces.BizStatusEditing:
	case interfaces.BizStatusOffline:
		operation = metric.AuditLogOperationUnpublish
		// 校验下架权限、校验编辑权限
		err = s.AuthService.CheckUnpublishPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	default:
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxStatusInvalid,
			fmt.Sprintf("invalid toolbox status: %s", req.Status))
	}
	if err != nil {
		return
	}
	err = s.ToolBoxDB.UpdateToolBoxStatus(ctx, nil, req.BoxID, string(req.Status), req.UserID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("update toolbox status failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "update toolbox status failed")
		return
	}
	// 记录审计日志
	if operation != "" {
		go func() {
			tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
			s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
				TokenInfo: tokenInfo,
				Accessor:  accessor,
				Operation: operation,
				Object: &metric.AuditLogObject{
					Type: metric.AuditLogObjectTool,
					Name: toolBox.Name,
					ID:   toolBox.BoxID,
				},
			})
		}()
	}
	resp = &interfaces.UpdateToolBoxStatusResp{
		BoxID:  req.BoxID,
		Status: req.Status,
	}
	return
}

// CreateTool 工具管理
func (s *ToolServiceImpl) CreateTool(ctx context.Context, req *interfaces.CreateToolReq) (resp *interfaces.CreateToolResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
	})
	// 权限校验
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckModifyPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound,
			fmt.Sprintf("toolbox %s not found", req.BoxID))
		return
	}
	// 内置工具箱不允许添加工具
	if toolBox.IsInternal {
		err = errors.DefaultHTTPError(ctx, http.StatusForbidden, "internal toolbox cannot add tools")
		return
	}
	// 解析导入数据
	content, err := s.OpenAPIParser.GetAllContent(ctx, req.Data)
	if err != nil {
		s.Logger.WithContext(ctx).Infof("parse openapi failed, err: %v", err)
		return
	}
	// 检查导入工具是否存在重复,保证传入的数据没有重复的工具名称等
	metadataList, tools, validatorMethodPathMap, validatorNameMap, err := s.parseOpenAPIToMetadata(ctx, req.BoxID, req.UserID, content)
	if err != nil {
		return
	}
	// 检查工具是否存在
	toolList, err := s.ToolDB.SelectToolByBoxID(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	failuresVailMap := map[string]error{}
	for _, tool := range toolList {
		if validatorNameMap[tool.Name] {
			failuresVailMap[tool.Name] = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool name %s exist", tool.Name), tool.Name)
			continue
		}
		var toolInfo *interfaces.ToolInfo
		toolInfo, err = s.getToolInfo(ctx, tool, "")
		if err != nil {
			failuresVailMap[tool.Name] = err
			continue
		}
		metadata := &interfaces.APIMetadata{}
		err = utils.StringToObject(utils.ObjectToJSON(toolInfo.Metadata), metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse metadata failed, err: %v", err)
			failuresVailMap[tool.Name] = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			continue
		}
		val := validatorMethodPath(metadata.Method, metadata.Path)
		if validatorMethodPathMap[val] {
			failuresVailMap[tool.Name] = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool %s exist", val), val)
			continue
		}
	}
	resp = &interfaces.CreateToolResp{
		BoxID:      req.BoxID,
		SuccessIDs: []string{},
		Failures:   []interfaces.CreateToolFailureResult{},
	}
	var detils []metric.AuditLogToolDetil
	for i, tool := range tools {
		if failuresVailMap[tool.Name] != nil {
			resp.FailureCount++
			resp.Failures = append(resp.Failures, interfaces.CreateToolFailureResult{
				Error:    failuresVailMap[tool.Name],
				ToolName: tool.Name,
			})
			continue
		}
		toolID, err := s.saveToolToBox(ctx, tool, metadataList[i])
		if err != nil {
			resp.FailureCount++
			resp.Failures = append(resp.Failures, interfaces.CreateToolFailureResult{
				Error:    err,
				ToolName: tool.Name,
			})
			continue
		}
		resp.SuccessCount++
		resp.SuccessIDs = append(resp.SuccessIDs, toolID)
		detils = append(detils, metric.AuditLogToolDetil{
			ToolID:   toolID,
			ToolName: tool.Name,
		})
	}
	// 记录审计日志
	go func() {
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos:         detils,
				OperationCode: metric.AddTool,
			},
		})
	}()
	return resp, nil
}

// 向工具箱内添加工具
func (s *ToolServiceImpl) saveToolToBox(ctx context.Context, tool *model.ToolDB, metadata *model.APIMetadataDB) (toolID string, err error) {
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	var sourceID string
	switch tool.SourceType {
	case model.SourceTypeOpenAPI:
		sourceID, err = s.MetadataDB.InsertAPIMetadata(ctx, tx, metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
	case model.SourceTypeOperator:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("unsupported source type: %s", model.SourceTypeOperator))
	default:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("unsupported source type: %s", tool.SourceType))
	}
	if err != nil {
		return
	}
	tool.SourceID = sourceID
	toolID, err = s.ToolDB.InsertTool(ctx, tx, tool)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("insert tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return
}

// GetBoxTool 获取工具信息
func (s *ToolServiceImpl) GetBoxTool(ctx context.Context, req *interfaces.GetToolReq) (resp *interfaces.ToolInfo, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 如果是外部接口，校验是否拥有所属工具的查看、公开访问权限
	if infracommon.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		var authorized bool
		authorized, err = s.AuthService.OperationCheckAny(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox, interfaces.AuthOperationTypeView, interfaces.AuthOperationTypePublicAccess)
		if err != nil {
			return
		}
		if !authorized {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden, nil)
			return
		}
	}
	// 检查工具箱是否存在
	exist, boxDB, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	exist, tool, err := s.ToolDB.SelectTool(ctx, req.ToolID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNotFound,
			fmt.Sprintf("tool %s not found", req.ToolID))
		return
	}
	resp, err = s.getToolInfo(ctx, tool, boxDB.ServerURL)
	return
}

// DeleteBoxTool 批量删除工具箱内工具
func (s *ToolServiceImpl) DeleteBoxTool(ctx context.Context, req *interfaces.BatchDeleteToolReq) (resp *interfaces.BatchDeleteToolResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 权限校验
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckModifyPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 内置工具不允许删除工具
	if toolBox.IsInternal {
		err = errors.DefaultHTTPError(ctx, http.StatusForbidden, "internal toolbox cannot delete tools")
		return
	}
	// 检查工具是否存在
	tools, err := s.ToolDB.SelectToolBoxByID(ctx, req.BoxID, req.ToolIDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if len(tools) != len(req.ToolIDs) {
		checkTools := []string{}
		for _, v := range tools {
			checkTools = append(checkTools, v.ToolID)
		}
		clist := utils.FindMissingElements(req.ToolIDs, checkTools)
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNotFound,
			fmt.Sprintf("tools %v not found", clist))
		return
	}
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("get tx failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	err = s.deleteTools(ctx, tx, req.BoxID, tools)
	if err != nil {
		return
	}
	// 记录审计日志
	go func() {
		var detils []metric.AuditLogToolDetil
		for _, tool := range tools {
			detils = append(detils, metric.AuditLogToolDetil{
				ToolID:   tool.ToolID,
				ToolName: tool.Name,
			})
		}
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos:         detils,
				OperationCode: metric.DeleteTool,
			},
		})
	}()
	return
}

// QueryToolList 查询工具列表
func (s *ToolServiceImpl) QueryToolList(ctx context.Context, req *interfaces.QueryToolListReq) (resp *interfaces.QueryToolListResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 如果外部接口，校验是否拥有所属工具箱的查看、公开访问权限
	if infracommon.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
		if err != nil {
			return
		}
		var authorized bool
		authorized, err = s.AuthService.OperationCheckAny(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox, interfaces.AuthOperationTypeView, interfaces.AuthOperationTypePublicAccess)
		if err != nil {
			return
		}
		if !authorized {
			err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonOperationForbidden, nil)
			return
		}
	}
	// 检查工具箱是否存在
	exist, boxDB, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 构造查询条件
	filter := make(map[string]interface{})
	filter["all"] = req.All
	if req.ToolName != "" {
		filter["name"] = req.ToolName
	}
	if req.Status != "" {
		filter["status"] = req.Status
	}
	if req.QueryUserID != "" {
		filter["user_id"] = req.QueryUserID
	}
	// 查询工具箱总数
	total, err := s.ToolDB.CountToolByBoxID(ctx, req.BoxID, filter)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("count tool failed by id: %s, err: %v", req.BoxID, err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	resp = &interfaces.QueryToolListResp{
		BoxID: req.BoxID,
		CommonPageResult: interfaces.CommonPageResult{
			Page:       req.Page,
			PageSize:   req.PageSize,
			TotalCount: int(total),
		},
		Tools: []*interfaces.ToolInfo{},
	}
	if total == 0 {
		return
	}
	// 计算偏移量
	var offset int
	if req.PageSize > 0 {
		offset = (req.Page - 1) * req.PageSize
		resp.TotalPage = int(total) / req.PageSize
		if int(total)%req.PageSize > 0 {
			resp.TotalPage++
		}
		resp.HasNext = req.Page < resp.TotalPage
		resp.HasPrev = req.Page > 1
	} else {
		resp.TotalPage = 1
		resp.PageSize = int(total)
	}
	// 构造排序条件
	filter["sort_by"] = req.SortBy
	filter["sort_order"] = req.SortOrder
	filter["limit"] = req.PageSize
	filter["offset"] = offset
	// 查询工具箱列表
	tools, err := s.ToolDB.SelectToolLisByBoxID(ctx, req.BoxID, filter)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool list failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 组装响应数据
	toolInfos, userIDs, toolIDSourceMap, mids, err := s.batchGetToolInfo(ctx, tools)
	if err != nil {
		return
	}
	// 收集元数据信息
	metadataMap, err := s.batchGetMetadata(ctx, mids)
	if err != nil {
		return
	}
	// 获取用户名称
	userMap, err := s.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		return
	}
	for _, tool := range toolInfos {
		metadataDB, ok := metadataMap[toolIDSourceMap[tool.ToolID]]
		if !ok {
			s.Logger.WithContext(ctx).Errorf("metadata not found, toolID: %s", tool.ToolID)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "metadata not found")
			return
		}
		metadataDB.ServerURL = boxDB.ServerURL
		tool.Metadata = metadataDB
		tool.CreateUser = userMap[tool.CreateUser]
		tool.UpdateUser = userMap[tool.UpdateUser]
	}
	resp.Tools = append(resp.Tools, toolInfos...)
	return
}

// UpdateToolStatus 更新工具状态
func (s *ToolServiceImpl) UpdateToolStatus(ctx context.Context, req *interfaces.UpdateToolStatusReq) (resp []*interfaces.ToolStatus, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
	})
	// 权限校验
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckModifyPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 检查工具是否存在
	var toolIDs []string
	for _, v := range req.ToolStatusList {
		toolIDs = append(toolIDs, v.ToolID)
	}
	tools, err := s.ToolDB.SelectToolBoxByID(ctx, req.BoxID, toolIDs)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	checkTools := []string{}
	for _, v := range tools {
		checkTools = append(checkTools, v.ToolID)
	}
	//  比较工具ID是否存在
	clist := utils.FindMissingElements(toolIDs, checkTools)
	if len(clist) > 0 {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNotFound,
			fmt.Sprintf("tools %v not found", clist))
		return
	}
	// 更新工具状态
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	resp = []*interfaces.ToolStatus{}
	for _, tool := range req.ToolStatusList {
		err = s.ToolDB.UpdateToolStatus(ctx, tx, tool.ToolID, string(tool.Status), req.UserID)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update tool status failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		resp = append(resp, &interfaces.ToolStatus{
			ToolID: tool.ToolID,
			Status: tool.Status,
		})
	}
	// 记录审计日志
	go func() {
		var detils []metric.AuditLogToolDetil
		for _, tool := range tools {
			detils = append(detils, metric.AuditLogToolDetil{
				ToolID:   tool.ToolID,
				ToolName: tool.Name,
			})
		}
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos:         detils,
				OperationCode: metric.UpdateToolStatus,
			},
		})
	}()
	return resp, nil
}

// getToolInfo 获取工具信息
func (s *ToolServiceImpl) getToolInfo(ctx context.Context, tool *model.ToolDB, boxSvcURL string) (toolInfo *interfaces.ToolInfo, err error) {
	globalParameters := &interfaces.ParametersStruct{}
	if tool.Parameters != "" {
		err = utils.StringToObject(tool.Parameters, globalParameters)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse global parameters failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	extendInfo := map[string]interface{}{}
	_ = utils.StringToObject(tool.ExtendInfo, &extendInfo)
	toolInfo = &interfaces.ToolInfo{
		ToolID:           tool.ToolID,
		Name:             tool.Name,
		Description:      tool.Description,
		Status:           interfaces.ToolStatusType(tool.Status),
		UseRule:          tool.UseRule,
		GlobalParameters: globalParameters,
		ExtendInfo:       extendInfo,
		UpdateTime:       tool.UpdateTime,
		CreateTime:       tool.CreateTime,
		UpdateUser:       tool.UpdateUser,
		CreateUser:       tool.CreateUser,
	}
	switch tool.SourceType {
	case model.SourceTypeOperator:
		var operatorInfo *interfaces.OperatorDataInfo
		operatorInfo, err = s.OperatorMgnt.GetOperatorInfoByOperatorIDPrivate(ctx, tool.SourceID)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("get operator info failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		if operatorInfo.MetadataType == interfaces.MetadataTypeAPI {
			toolInfo.MetadataType = operatorInfo.MetadataType
			apiMetadata := &interfaces.APIMetadata{}
			err = utils.AnyToObject(operatorInfo.Metadata, apiMetadata)
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("parse api metadata failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
				return
			}
			apiMetadata.ServerURL = boxSvcURL
			toolInfo.Metadata = apiMetadata
		} else {
			toolInfo.MetadataType = operatorInfo.MetadataType
			toolInfo.Metadata = operatorInfo.Metadata
		}

	case model.SourceTypeOpenAPI:
		var metadataDB *model.APIMetadataDB
		var has bool
		has, metadataDB, err = s.MetadataDB.SelectByVersion(ctx, tool.SourceID)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("select metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		if !has {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtMetadataNotFound,
				fmt.Sprintf("metadata type: %s id: %s not found", tool.SourceType, tool.SourceID))
			return
		}
		apiSpec := &interfaces.APISpec{}
		err = utils.StringToObject(metadataDB.APISpec, apiSpec)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse api spec failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		toolInfo.MetadataType = interfaces.MetadataTypeAPI
		toolInfo.Metadata = &interfaces.APIMetadata{
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
	default:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("unsupported source type: %s", tool.SourceType))
	}
	return
}

func (s *ToolServiceImpl) checkAndParserToolBox(ctx context.Context, req *interfaces.CreateToolBoxReq) (content *interfaces.OpenAPIContent, err error) {
	// 检查分类是否存在
	if !s.CategoryManager.CheckCategory(req.Category) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxCategoryTypeInvalid,
			fmt.Sprintf(" %s category not found", req.Category))
		return
	}
	// 解析API数据
	content, err = s.OpenAPIParser.GetAllContent(ctx, req.Data)
	if err != nil {
		s.Logger.WithContext(ctx).Infof("parse openapi failed, err: %v", err)
		return
	}
	if req.BoxName == "" {
		req.BoxName = content.Info.Title
	}
	err = s.Validator.ValidatorToolBoxName(ctx, req.BoxName)
	if err != nil {
		return
	}
	if req.BoxDesc == "" {
		req.BoxDesc = content.Info.Description
	}
	if req.BoxDesc == "" {
		req.BoxDesc = content.Info.TermsOfService
	}
	err = s.Validator.ValidatorToolBoxDesc(ctx, req.BoxDesc)
	if err != nil {
		return
	}
	if req.BoxSvcURL == "" {
		req.BoxSvcURL = content.SererURL
	}
	return
}

// 解析OpenAPI数据为工具元数据
func (s *ToolServiceImpl) parseOpenAPIToMetadata(ctx context.Context, boxID, userID string, content *interfaces.OpenAPIContent) (metadataMap map[string]*model.APIMetadataDB,
	toolMap map[string]*model.ToolDB, validatorMethodPathMap, validatorNameMap map[string]bool, err error) {
	validatorMethodPathMap = make(map[string]bool)
	validatorNameMap = make(map[string]bool)
	metadataMap = map[string]*model.APIMetadataDB{}
	toolMap = map[string]*model.ToolDB{}

	for _, item := range content.PathItems {
		// 检查工具名称
		err = s.Validator.ValidatorToolName(ctx, item.Summary)
		if err != nil {
			return
		}
		// 如果工具描述为空，默认使用工具名称
		if item.Description == "" {
			item.Description = item.Summary
		}
		// 检查工具描述
		err = s.Validator.ValidatorToolDesc(ctx, item.Description)
		if err != nil {
			return
		}
		// 工具名称是否重复
		if validatorNameMap[item.Summary] {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool name %s duplicate", item.Summary), item.Summary)
			return
		}
		validatorNameMap[item.Summary] = true
		// 检查工具是否存在
		val := validatorMethodPath(item.Method, item.Path)
		if validatorMethodPathMap[val] { // 重复
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool info %s duplicate", val), val)
			return
		}
		validatorMethodPathMap[val] = true
		metadataMap[item.Summary] = &model.APIMetadataDB{
			Summary:     item.Summary,
			Path:        item.Path,
			Method:      item.Method,
			Description: item.Description,
			APISpec:     utils.ObjectToJSON(item.APISpec),
			ServerURL:   item.ServerURL,
			CreateUser:  userID,
			UpdateUser:  userID,
		}
		toolMap[item.Summary] = &model.ToolDB{
			Name:        item.Summary,
			BoxID:       boxID,
			Description: item.Description,
			SourceType:  model.SourceTypeOpenAPI,
			Status:      string(interfaces.ToolStatusTypeDisabled),
			CreateUser:  userID,
			UpdateUser:  userID,
		}
	}
	return
}

// checkBoxDuplicateName 检查工具箱名称是否重复
func (s *ToolServiceImpl) checkBoxDuplicateName(ctx context.Context, name, boxID string) (err error) {
	has, boxDB, err := s.ToolBoxDB.SelectToolBoxByName(ctx, name, []string{string(interfaces.BizStatusPublished)})
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox by name failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select toolbox by name failed")
		return
	}
	if !has || (boxID != "" && boxDB.BoxID == boxID) {
		return
	}
	err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxNameExists,
		fmt.Sprintf("toolbox name %s already exists", name), name)
	return
}
