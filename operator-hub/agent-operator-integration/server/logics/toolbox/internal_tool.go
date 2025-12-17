// Package toolbox 工具箱、工具管理
// @file internal_tool.go
// @description: 内置工具箱
package toolbox

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	infracommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/google/uuid"
)

// 内置工具管理原则：工具箱只能属于一个服务，而一个服务可以有多个工具箱

// CreateInternalToolBox 创建内置工具箱
func (s *ToolServiceImpl) CreateInternalToolBox(ctx context.Context, req *interfaces.CreateInternalToolBoxReq) (resp *interfaces.CreateInternalToolBoxResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
	})
	if !req.IsPublic && req.UserID == "" {
		req.UserID = interfaces.SystemUser
	}

	// 检查传入数据是否合法
	content, err := s.OpenAPIParser.GetAllContent(ctx, req.Data)
	if err != nil {
		s.Logger.WithContext(ctx).Infof("get all content failed, err: %v", err)
		return
	}
	// 检查导入工具是否存在重复,保证传入的数据没有重复的工具名称等
	metadataList, tools, _, _, err := s.parseOpenAPIToMetadata(ctx, req.BoxID, req.UserID, content)
	if err != nil {
		return
	}
	checkConfig := &interfaces.IntCompConfig{
		ComponentType: interfaces.ComponentTypeToolBox,
		ComponentID:   req.BoxID,
		ConfigVersion: req.ConfigVersion,
		ConfigSource:  req.ConfigSource,
		ProtectedFlag: req.ProtectedFlag,
	}
	// 检查工具箱是否存在
	exist, toolbox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			return
		}
		resp = &interfaces.CreateInternalToolBoxResp{
			BoxID:   req.BoxID,
			BoxName: req.BoxName,
			Tools:   []*interfaces.ToolInfo{},
		}
		// 获取当前工具箱内的工具
		var tools []*interfaces.ToolInfo
		tools, err = s.getToolBoxAllToolInfo(ctx, toolbox)
		if err != nil {
			return
		}
		resp.Tools = tools
	}()
	if !exist {
		// 创建内置工具箱
		toolbox = &model.ToolboxDB{
			BoxID:       req.BoxID,
			Name:        req.BoxName,
			Description: req.BoxDesc,
			Category:    interfaces.CategoryTypeSystem.String(),
			ServerURL:   content.SererURL,
			Status:      interfaces.BizStatusPublished.String(),
			IsInternal:  true,
			Source:      req.Source,
			CreateUser:  req.UserID,
			CreateTime:  time.Now().UnixNano(),
			UpdateUser:  req.UserID,
			UpdateTime:  time.Now().UnixNano(),
			ReleaseUser: req.UserID,
			ReleaseTime: time.Now().UnixNano(),
		}
		err = s.createInternalToolBox(ctx, toolbox, metadataList, tools, checkConfig, req.UserID)
		return
	}
	// 判断是否是内置工具箱，并且来源一致
	if !toolbox.IsInternal || toolbox.Source != req.Source {
		// 非内置工具，没有权限操作，可能ID冲突，建议换个ID
		err = fmt.Errorf("toolbox not internal, please change box_id or delete old one")
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, err.Error())
		return
	}
	toolbox.Description = req.BoxDesc
	toolbox.ServerURL = content.SererURL
	toolbox.UpdateUser = req.UserID
	toolbox.UpdateTime = time.Now().UnixNano()
	err = s.updateInternalToolBox(ctx, toolbox, metadataList, tools, checkConfig, req.UserID, req.BoxName)
	return
}

// createInternalToolBox 添加内置工具箱
func (s *ToolServiceImpl) createInternalToolBox(ctx context.Context, toolbox *model.ToolboxDB,
	metadataMap map[string]*model.APIMetadataDB, toolMap map[string]*model.ToolDB, config *interfaces.IntCompConfig, userID string) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 添加内置工具
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("get tx failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "get tx failed")
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	// 如果是外部接口，校验新建权限
	if infracommon.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, userID)
		if err != nil {
			return
		}
		err = s.AuthService.CheckCreatePermission(ctx, accessor, interfaces.AuthResourceTypeToolBox)
		if err != nil {
			return
		}
		defer func() {
			if err == nil {
				// 默认添加所有者权限
				err = s.AuthService.CreateOwnerPolicy(ctx, accessor, &interfaces.AuthResource{
					ID:   toolbox.BoxID,
					Type: interfaces.AuthResourceTypeToolBox.String(),
					Name: toolbox.Name,
				})
				// 记录审计日志
				go func() {
					tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
					s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
						TokenInfo: tokenInfo,
						Accessor:  accessor,
						Operation: metric.AuditLogOperationCreate,
						Object: &metric.AuditLogObject{
							Type: metric.AuditLogObjectTool,
							Name: toolbox.Name,
							ID:   toolbox.BoxID,
						},
					})
				}()
			}
		}()
	}
	err = s.checkBoxDuplicateName(ctx, toolbox.Name, "")
	if err != nil {
		return
	}
	// 添加工具箱
	_, err = s.ToolBoxDB.InsertToolBox(ctx, tx, toolbox)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("insert toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "insert toolbox failed")
		return
	}
	var metadataList []*model.APIMetadataDB
	var toolList []*model.ToolDB
	for name, tool := range toolMap {
		metadata, ok := metadataMap[name]
		if !ok {
			continue
		}
		metadata.Version = uuid.NewString()
		metadataList = append(metadataList, metadata)
		tool.SourceType = model.SourceTypeOpenAPI
		tool.SourceID = metadata.Version
		tool.BoxID = toolbox.BoxID
		tool.ToolID = uuid.NewString()
		tool.Status = interfaces.ToolStatusTypeEnabled.String()
		toolList = append(toolList, tool)
	}
	// 添加工具
	err = s.addInternalToolBox(ctx, tx, metadataList, toolList)
	if err != nil {
		return
	}
	// 添加配置
	err = s.IntCompConfigSvc.UpdateConfig(ctx, tx, config)
	if err != nil {
		return
	}

	// 关联业务域
	businessDomainId, _ := common.GetBusinessDomainFromCtx(ctx)
	err = s.BusinessDomainService.AssociateResource(ctx, businessDomainId, toolbox.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}

	// 创建内置组件权限策略
	err = s.AuthService.CreateIntCompPolicyForAllUsers(ctx, &interfaces.AuthResource{
		ID:   toolbox.BoxID,
		Type: interfaces.AuthResourceTypeToolBox.String(),
		Name: toolbox.Name,
	})
	return
}

func (s *ToolServiceImpl) updateInternalToolBox(ctx context.Context, toolbox *model.ToolboxDB,
	metadataMap map[string]*model.APIMetadataDB, toolMap map[string]*model.ToolDB, config *interfaces.IntCompConfig,
	userID, name string) (err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	var action interfaces.IntCompConfigAction
	// 如果是外部接口，校验编辑权限
	if infracommon.IsPublicAPIFromCtx(ctx) {
		var accessor *interfaces.AuthAccessor
		accessor, err = s.AuthService.GetAccessor(ctx, userID)
		if err != nil {
			return
		}
		err = s.AuthService.CheckModifyPermission(ctx, accessor, toolbox.BoxID, interfaces.AuthResourceTypeToolBox)
		if err != nil {
			return
		}
		defer func() {
			if action == interfaces.IntCompConfigActionTypeSkip { // 无变化，无需更新
				return
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
						Name: toolbox.Name,
						ID:   toolbox.BoxID,
					},
				})
			}()
		}()
	}
	var isNameChange bool
	if toolbox.Name != name {
		err = s.checkBoxDuplicateName(ctx, name, toolbox.BoxID)
		if err != nil {
			return
		}
		isNameChange = true
		toolbox.Name = name
	}
	action, err = s.IntCompConfigSvc.CompareConfig(ctx, config)
	if err != nil {
		return
	}
	if action == interfaces.IntCompConfigActionTypeSkip { // 无变化，无需更新
		return
	}
	// 获取当前工具箱内的工具
	tools, err := s.ToolDB.SelectToolByBoxID(ctx, toolbox.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool by box_id failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select tool by box_id failed")
		return
	}
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("get tx failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "get tx failed")
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	// 删除工具箱内的工具
	err = s.deleteTools(ctx, tx, toolbox.BoxID, tools)
	if err != nil {
		return
	}
	var metadataList []*model.APIMetadataDB
	var toolList []*model.ToolDB
	for name, tool := range toolMap {
		metadata, ok := metadataMap[name]
		if !ok {
			continue
		}
		metadata.Version = uuid.NewString()
		metadataList = append(metadataList, metadata)
		tool.SourceType = model.SourceTypeOpenAPI
		tool.SourceID = metadata.Version
		tool.BoxID = toolbox.BoxID
		tool.ToolID = uuid.NewString()
		tool.Status = interfaces.ToolStatusTypeEnabled.String()
		toolList = append(toolList, tool)
	}
	// 添加工具
	err = s.addInternalToolBox(ctx, tx, metadataList, toolList)
	if err != nil {
		return
	}
	// 更新工具箱
	err = s.ToolBoxDB.UpdateToolBox(ctx, tx, toolbox)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("update toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "update toolbox failed")
		return
	}
	// 更新配置
	err = s.IntCompConfigSvc.UpdateConfig(ctx, tx, config)
	if err != nil {
		return
	}
	if !isNameChange { // 如果名字没有变化，无需触发资源变更通知
		return
	}
	// 触发资源变更通知
	authResource := &interfaces.AuthResource{
		ID:   toolbox.BoxID,
		Name: toolbox.Name,
		Type: string(interfaces.AuthResourceTypeToolBox),
	}
	err = s.AuthService.NotifyResourceChange(ctx, authResource)
	return
}

func (s *ToolServiceImpl) addInternalToolBox(ctx context.Context, tx *sql.Tx,
	addMetadataList []*model.APIMetadataDB, addToolList []*model.ToolDB) (err error) {
	// 添加元数据，添加工具
	if len(addMetadataList) > 0 {
		_, err = s.MetadataDB.InsertAPIMetadatas(ctx, tx, addMetadataList)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "insert metadata failed")
			return
		}
	}
	// 添加工具
	if len(addToolList) > 0 {
		_, err = s.ToolDB.InsertTools(ctx, tx, addToolList)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("insert tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "insert tool failed")
			return
		}
	}
	return
}
