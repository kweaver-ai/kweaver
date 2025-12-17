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
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// DebugTool 工具调试
func (s *ToolServiceImpl) DebugTool(ctx context.Context, req *interfaces.ExecuteToolReq) (resp *interfaces.HTTPResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"tool_id": req.ToolID,
		"user_id": req.UserID,
	})

	// 权限校验
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckExecutePermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 检查工具箱是否存在
	exist, toolBox, err := s.ToolBoxDB.SelectToolBox(ctx, req.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select toolbox failed	, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusNotFound, errors.ErrExtToolBoxNotFound, "toolbox not found")
		return
	}
	// 检查工具是否存在
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
	resp, err = s.executeTool(ctx, req, tool, toolBox.ServerURL)
	if err != nil {
		return
	}
	// 记录审计日志
	go func() {
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationExecute,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos: []metric.AuditLogToolDetil{
					{
						ToolID:   tool.ToolID,
						ToolName: tool.Name,
					},
				},
				OperationCode: metric.DebugTool,
			},
		})
	}()
	return
}

// ExecuteTool 工具执行
func (s *ToolServiceImpl) ExecuteTool(ctx context.Context, req *interfaces.ExecuteToolReq) (resp *interfaces.HTTPResponse, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	telemetry.SetSpanAttributes(ctx, map[string]interface{}{
		"box_id":  req.BoxID,
		"tool_id": req.ToolID,
		"user_id": req.UserID,
	})
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckExecutePermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
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
	// 检查工具是否可用
	if tool.Status != string(interfaces.ToolStatusTypeEnabled) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNotAvailable,
			"tool not available", tool.Name)
		return
	}
	resp, err = s.executeTool(ctx, req, tool, toolBox.ServerURL)
	if err != nil {
		return
	}
	// 记录审计日志
	go func() {
		tokenInfo, _ := infracommon.GetTokenInfoFromCtx(ctx)
		s.AuditLog.Logger(ctx, &metric.AuditLogBuilderParams{
			TokenInfo: tokenInfo,
			Accessor:  accessor,
			Operation: metric.AuditLogOperationExecute,
			Object: &metric.AuditLogObject{
				Type: metric.AuditLogObjectTool,
				Name: toolBox.Name,
				ID:   toolBox.BoxID,
			},
			Detils: &metric.AuditLogToolDetils{
				Infos: []metric.AuditLogToolDetil{
					{
						ToolID:   tool.ToolID,
						ToolName: tool.Name,
					},
				},
				OperationCode: metric.ExecuteTool,
			},
		})
	}()
	return resp, nil
}

// ExecuteToolCore 执行工具核心逻辑（不包含权限校验和审计日志）
func (s *ToolServiceImpl) ExecuteToolCore(ctx context.Context, req *interfaces.ExecuteToolReq) (resp *interfaces.HTTPResponse, err error) {
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
	// 检查工具是否可用
	if tool.Status != string(interfaces.ToolStatusTypeEnabled) {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolNotAvailable,
			"tool not available", tool.Name)
		return
	}
	resp, err = s.executeTool(ctx, req, tool, toolBox.ServerURL)
	return
}

func (s *ToolServiceImpl) executeTool(ctx context.Context, req *interfaces.ExecuteToolReq, tool *model.ToolDB, toolBoxURL string) (resp *interfaces.HTTPResponse, err error) {
	var metadataVersion string
	var serverURL string
	switch tool.SourceType {
	case model.SourceTypeOpenAPI:
		metadataVersion = tool.SourceID
		serverURL = toolBoxURL
	case model.SourceTypeOperator:
		var operator *interfaces.OperatorDataInfo
		operator, err = s.OperatorMgnt.GetOperatorReleaseByIDPrivate(ctx, tool.SourceID)
		if err != nil {
			return
		}
		metadataVersion = operator.Version
	default:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, fmt.Sprintf("source type %s not support", tool.SourceType))
		return
	}
	// 获取工具元数据
	exist, metadata, err := s.MetadataDB.SelectByVersion(ctx, metadataVersion)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool metadata failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if !exist {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtMetadataNotFound,
			fmt.Sprintf("metadata type: %s id: %s not found", tool.SourceType, tool.SourceID))
		return
	}
	if serverURL == "" {
		serverURL = metadata.ServerURL
	}
	url := fmt.Sprintf("%s%s", serverURL, metadata.Path)
	proxyReq := &interfaces.HTTPRequest{
		ClientID:    req.ToolID,
		URL:         url,
		Method:      metadata.Method,
		Headers:     req.Headers,
		Body:        req.Body,
		QueryParams: req.QueryParams,
		PathParams:  req.PathParams,
		Timeout:     time.Duration(req.Timeout) * time.Second,
	}
	resp, err = s.Proxy.HandlerRequest(ctx, proxyReq)
	return
}
