package toolbox

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// UpdateToolBox 更新工具箱
func (s *ToolServiceImpl) UpdateToolBox(ctx context.Context, req *interfaces.UpdateToolBoxReq) (resp *interfaces.UpdateToolBoxResp, err error) {
	// 记录可观测性
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"user_id":  req.UserID,
		"box_id":   req.BoxID,
		"box_name": req.BoxName,
	})

	// 校验编辑权限
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckModifyPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查分类是否存在
	if !s.CategoryManager.CheckCategory(req.Category) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxCategoryTypeInvalid,
			fmt.Sprintf(" %s category not found", req.Category))
		return
	}
	// 检查工具是否存在
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
	// 检查工具箱名称是否存在
	isNameChanged := toolBox.Name != req.BoxName
	if isNameChanged {
		err = s.checkBoxDuplicateName(ctx, req.BoxName, toolBox.BoxID)
		if err != nil {
			return
		}
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
	resp = &interfaces.UpdateToolBoxResp{}
	if req.MetadataType == interfaces.MetadataTypeAPI && req.Data != nil {
		// 更新工具箱内工具元数据
		resp.EditTools, err = s.updateToolBoxMetadata(ctx, tx, toolBox.BoxID, req.UserID, req.Data)
		if err != nil {
			return
		}
	}
	// 更新工具箱
	toolBox.Name = req.BoxName
	toolBox.Description = req.BoxDesc
	toolBox.UpdateUser = req.UserID
	toolBox.ServerURL = req.BoxSvcURL
	toolBox.Category = string(req.Category)
	err = s.ToolBoxDB.UpdateToolBox(ctx, tx, toolBox)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("update toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 如果名称有变化，触发权限资源变更通知
	if isNameChanged {
		authResource := &interfaces.AuthResource{
			ID:   toolBox.BoxID,
			Name: toolBox.Name,
			Type: string(interfaces.AuthResourceTypeToolBox),
		}
		err = s.AuthService.NotifyResourceChange(ctx, authResource)
	}
	// 记录审计日志
	go func() {
		tokenInfo, _ := common.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
		})
	}()
	resp.BoxID = req.BoxID
	return
}

// 批量更新工具箱内工具元数据
func (s *ToolServiceImpl) updateToolBoxMetadata(ctx context.Context, tx *sql.Tx, boxID, userID string, data []byte) (resp []*interfaces.EditToolInfo, err error) {
	resp = []*interfaces.EditToolInfo{}
	var items []*interfaces.PathItemContent
	items, err = s.OpenAPIParser.GetPathItems(ctx, data)
	if err != nil {
		return
	}
	itemMap := make(map[string]*interfaces.PathItemContent)
	for _, item := range items {
		key := fmt.Sprintf("%s:%s", item.Method, item.Path)
		itemMap[key] = item
	}
	if len(itemMap) == 0 {
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtCommonNoMatchedMethodPath,
			"no matched method path found").WithDescription(errors.ErrExtToolNotExistInFile)
		return
	}
	// 获取当前工具箱内全部工具
	var tools []*model.ToolDB
	tools, err = s.ToolDB.SelectToolByBoxID(ctx, boxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox tools failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 收集需要变更的元数据的工具
	metadataVersions := []string{}
	toolMap := make(map[string]*model.ToolDB)
	for _, tool := range tools {
		if tool.SourceType != model.SourceTypeOpenAPI {
			continue
		}
		metadataVersions = append(metadataVersions, tool.SourceID)
		toolMap[tool.SourceID] = tool
	}
	// 获取所有元数据
	var metadatas []*model.APIMetadataDB
	metadatas, err = s.MetadataDB.SelectListByVersion(ctx, metadataVersions)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select metadata failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 遍历所有元数据，检查是否有变更
	var changed bool
	for _, metadata := range metadatas {
		// 检查是否有变更
		_, changed = itemMap[fmt.Sprintf("%s:%s", metadata.Method, metadata.Path)]
		if changed {
			break
		}
	}
	if !changed {
		// 交互设计要求返回指定错误信息：https://confluence.aishu.cn/pages/viewpage.action?pageId=280780968
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtCommonNoMatchedMethodPath,
			"no matched method path found").WithDescription(errors.ErrExtToolNotExistInFile)
		return
	}
	// 检查元数据是否存在
	for _, metadata := range metadatas {
		item, ok := itemMap[fmt.Sprintf("%s:%s", metadata.Method, metadata.Path)]
		if !ok {
			continue
		}
		// 更新元数据
		metadata.Summary = item.Summary
		metadata.Description = item.Description
		metadata.APISpec = utils.ObjectToJSON(item.APISpec)
		metadata.ServerURL = item.ServerURL
		metadata.UpdateTime = time.Now().UnixNano()
		metadata.UpdateUser = userID
		// 更新元数据
		err = s.MetadataDB.UpdateByID(ctx, tx, metadata.ID, metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		toolDB, ok := toolMap[metadata.Version]
		if !ok {
			continue
		}
		// 更新工具
		toolDB.UpdateTime = metadata.UpdateTime
		toolDB.UpdateUser = userID
		err = s.ToolDB.UpdateTool(ctx, tx, toolDB)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		// 收集变更的工具
		resp = append(resp, &interfaces.EditToolInfo{
			ToolID: toolDB.ToolID,
			Status: interfaces.ToolStatusType(toolDB.Status),
			Name:   toolDB.Name,
			Desc:   toolDB.Description,
		})
	}
	return
}
