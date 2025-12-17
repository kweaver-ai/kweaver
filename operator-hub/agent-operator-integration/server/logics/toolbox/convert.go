// Package toolbox 工具箱、工具管理
// @file convert.go
// @description: 转换算子为工具
package toolbox

import (
	"context"
	"fmt"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// ConvertOperatorToTool 算子转换成工具
func (s *ToolServiceImpl) ConvertOperatorToTool(ctx context.Context, req *interfaces.ConvertOperatorToToolReq) (resp *interfaces.ConvertOperatorToToolResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 校验是否拥有所属工具箱的编辑权限
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	err = s.AuthService.CheckModifyPermission(ctx, accessor, req.BoxID, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}
	// 校验是否拥有算子的公开访问和使用权限
	var authorized bool
	authorized, err = s.AuthService.OperationCheckAll(ctx, accessor, req.OperatorID, interfaces.AuthResourceTypeOperator,
		interfaces.AuthOperationTypePublicAccess, interfaces.AuthOperationTypeExecute)
	if err != nil {
		return
	}
	if !authorized {
		err = errors.NewHTTPError(ctx, http.StatusForbidden, errors.ErrExtCommonUseForbidden, nil)
		return
	}
	// 获取算子信息
	operator, err := s.OperatorMgnt.GetOperatorReleaseByIDPrivate(ctx, req.OperatorID)
	if err != nil {
		return
	}
	// 检查算子是否可用
	if operator.Status != interfaces.BizStatusPublished {
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOperatorNotAvailable,
			fmt.Sprintf("operator %s is not available", operator.OperatorID), operator.Name)
		return
	}
	// 检查是否是同步执行
	if operator.OperatorInfo != nil && operator.OperatorInfo.ExecutionMode != interfaces.ExecutionModeSync {
		// 仅支持同步算子转换为工具
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolConvertOnlySupportSync,
			"only sync operators can be published as tools ")
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
	// TODO : 内置工具不允许添加工具
	if toolBox.IsInternal {
		err = errors.DefaultHTTPError(ctx, http.StatusForbidden, "internal toolbox cannot add tools")
		return
	}
	resp = &interfaces.ConvertOperatorToToolResp{
		BoxID: req.BoxID,
	}
	switch operator.MetadataType {
	case interfaces.MetadataTypeAPI:
		metadata := &interfaces.APIMetadata{}
		err = utils.StringToObject(utils.ObjectToJSON(operator.Metadata), metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		err = s.checkBoxToolSame(ctx, req.BoxID, operator.Name, metadata.Method, metadata.Path)
		if err != nil {
			return
		}
		// 转换算子为工具
		tool := &model.ToolDB{
			BoxID:       req.BoxID,
			Name:        operator.Name,
			Description: metadata.Description,
			SourceID:    operator.OperatorID,
			SourceType:  model.SourceTypeOperator,
			Status:      string(interfaces.ToolStatusTypeDisabled),
			UseRule:     req.UseRule,
			ExtendInfo:  utils.ObjectToJSON(req.ExtendInfo),
			Parameters:  utils.ObjectToJSON(req.GlobalParameters),
			CreateUser:  req.UserID,
			UpdateUser:  req.UserID,
		}
		// 插入工具
		resp.ToolID, err = s.ToolDB.InsertTool(ctx, nil, tool)
		if err != nil {
			s.Logger.WithContext(ctx).Warnf("insert tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	default:
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolConvertOnlySupportAPI,
			"only api operators can be published as tools")
		return
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
			Detils: &metric.AuditLogToolDetils{
				Infos: []metric.AuditLogToolDetil{
					{
						ToolID:   resp.ToolID,
						ToolName: operator.Name,
					},
				},
				OperationCode: metric.ImportToolFromOperator,
			},
		})
	}()
	return
}

// checkBoxToolSame 检查工具箱内是否存在同名工具
func (s *ToolServiceImpl) checkBoxToolSame(ctx context.Context, boxID, name, method, path string) (err error) {
	// 检查工具是否存在
	toolList, err := s.ToolDB.SelectToolByBoxID(ctx, boxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	for _, tool := range toolList {
		if tool.Name == name {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool name %s exist", tool.Name), tool.Name)
			return
		}
		var toolInfo *interfaces.ToolInfo
		toolInfo, err = s.getToolInfo(ctx, tool, "")
		if err != nil {
			return
		}
		metadata := &interfaces.APIMetadata{}
		err = utils.StringToObject(utils.ObjectToJSON(toolInfo.Metadata), metadata)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		val := validatorMethodPath(metadata.Method, metadata.Path)
		if val == validatorMethodPath(method, path) {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolExists,
				fmt.Sprintf("tool %s exist", val), val)
			return
		}
	}
	return
}
