package toolbox

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/telemetry"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// UpdateTool 更新工具
func (s *ToolServiceImpl) UpdateTool(ctx context.Context, req *interfaces.UpdateToolReq) (resp *interfaces.UpdateToolResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"user_id": req.UserID,
		"tool_id": req.ToolID,
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
	// 参数校验
	err = s.Validator.ValidatorToolName(ctx, req.ToolName)
	if err != nil {
		return
	}
	err = s.Validator.ValidatorToolDesc(ctx, req.ToolDesc)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed, err: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 检查工具是否存在
	exist, tool, err := s.ToolDB.SelectTool(ctx, req.ToolID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtToolNotFound,
			fmt.Sprintf("tool %s not found", req.ToolID))
		return
	}
	if tool.Name != req.ToolName {
		err = s.checkToolNameExist(ctx, req.BoxID, req.ToolName)
		if err != nil {
			// 交互设计要求返回指定错误信息：https://confluence.aishu.cn/pages/viewpage.action?pageId=280780968
			httErr := &infraerrors.HTTPError{}
			if errors.As(err, &httErr) && httErr.HTTPCode == http.StatusConflict {
				err = httErr.WithDescription(infraerrors.ErrExtCommonNameExists)
			}
			return
		}
		tool.Name = req.ToolName
	}
	tool.Description = req.ToolDesc
	tool.UpdateUser = req.UserID
	tool.UseRule = req.UseRule

	if req.ExtendInfo != nil {
		tool.ExtendInfo = utils.ObjectToJSON(req.ExtendInfo)
	}
	if req.GlobalParameters != nil {
		tool.Parameters = utils.ObjectToJSON(req.GlobalParameters)
	}
	err = s.updateToolMetadata(ctx, tool, req.MetadataType, req.Data)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("update tool metadata failed, err: %v", err)
		return
	}
	// 记录审计日志
	go func() {
		tokenInfo, _ := common.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationEdit,
			Object:    metric.NewAuditLogObject(metric.AuditLogObjectTool, toolBox.Name, toolBox.BoxID),
			Detils: metric.NewAuditLogToolDetils(metric.EditTool, []metric.AuditLogToolDetil{
				{ToolID: tool.ToolID, ToolName: tool.Name},
			}),
		})
	}()

	resp = &interfaces.UpdateToolResp{
		BoxID:  req.BoxID,
		ToolID: req.ToolID,
	}
	return
}

// 检查工具是否重名
func (s *ToolServiceImpl) checkToolNameExist(ctx context.Context, boxID, toolName string) (err error) {
	exist, _, err := s.ToolDB.SelectBoxToolByName(ctx, boxID, toolName)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool by name failed, err: %v", err)
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if exist {
		err = infraerrors.NewHTTPError(ctx, http.StatusConflict, infraerrors.ErrExtToolExists,
			"tool name already exists", toolName)
	}
	return
}

// 校验并更新工具元数据
func (s *ToolServiceImpl) updateToolMetadata(ctx context.Context, tool *model.ToolDB, metadataType interfaces.MetadataType, data []byte) (err error) {
	// 不需要更新元数据
	if metadataType != interfaces.MetadataTypeAPI || data == nil {
		err = s.ToolDB.UpdateTool(ctx, nil, tool)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update tool failed, err: %v", err)
			err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
		return
	}
	tx, err := s.DBTx.GetTx(ctx)
	if err != nil {
		err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			_ = tx.Commit()
		}
	}()
	// 解析并检查元数据
	switch tool.SourceType {
	case model.SourceTypeOpenAPI:
		// 获取当前工具元数据信息
		var has bool
		var metadata *model.APIMetadataDB
		has, metadata, err = s.MetadataDB.SelectByVersion(ctx, tool.SourceID)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("select metadata failed, err: %v", err)
			err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return err
		}
		if !has {
			err = infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtMetadataNotFound,
				fmt.Sprintf("metadata %s not found", tool.SourceID))
			return err
		}
		// 解析并检查OpenAPI元数据
		var item *interfaces.PathItemContent
		item, err = s.OpenAPIParser.GetPathItemContent(ctx, data, metadata.Path, metadata.Method)
		if err != nil {
			httErr := &infraerrors.HTTPError{}
			if errors.As(err, &httErr) && httErr.HTTPCode == http.StatusNotFound {
				err = httErr.WithDescription(infraerrors.ErrExtToolNotExistInFile)
			}
			s.Logger.WithContext(ctx).Infof("parse metadata failed, err: %v", err)
			return
		}
		// 组装元数据
		metadata.Summary = item.Summary
		metadata.Description = item.Description
		metadata.ServerURL = item.ServerURL
		metadata.APISpec = utils.ObjectToJSON(item.APISpec)
		metadata.UpdateTime = time.Now().UnixNano()
		metadata.UpdateUser = tool.UpdateUser
		// 更新元数据
		err = s.MetadataDB.UpdateByVersion(ctx, tx, metadata.Version, metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update metadata failed, err: %v", err)
			err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
		// 更新工具
		err = s.ToolDB.UpdateTool(ctx, tx, tool)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("update tool failed, err: %v", err)
			err = infraerrors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		}
	case model.SourceTypeOperator:
		// 算子转换成的工具不允许直接编辑元数据
		err = infraerrors.NewHTTPError(ctx, http.StatusMethodNotAllowed, infraerrors.ErrExtToolOperatorNotAllowEdit,
			"operator tool not allow edit metadata")
	}
	return
}
