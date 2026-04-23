// Package impex 导入导出管理模块
package impex

import (
	"context"
	"encoding/json"
	"net/http"
	"sync"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/dbaccess"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/drivenadapters"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/config"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/errors"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/validator"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces/model"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/logics/auth"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/logics/mcp"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/logics/operator"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/logics/toolbox"
	o11y "github.com/kweaver-ai/kweaver-go-lib/observability"
)

var (
	mOnce        sync.Once
	impexManager *componentImpexManager
)

// 组件导入导出管理
type componentImpexManager struct {
	Logger         interfaces.Logger
	AuthService    interfaces.IAuthorizationService
	OperatorMgr    interfaces.OperatorManager // 新增算子管理
	ToolboxMgr     interfaces.IToolService    // 新增工具箱管理
	MCPMgr         interfaces.IMCPService     // 新增MCP管理
	DBTx           model.DBTx                 // 新增事务支持
	FlowAutomation interfaces.FlowAutomation
	Validator      interfaces.Validator
}

// NewComponentImpexManager 新建组件导入导出管理器
func NewComponentImpexManager() interfaces.IComponentImpexConfig {
	mOnce.Do(func() {
		conf := config.NewConfigLoader()
		impexManager = &componentImpexManager{
			Logger:         conf.GetLogger(),
			AuthService:    auth.NewAuthServiceImpl(),
			OperatorMgr:    operator.NewOperatorManager(),
			ToolboxMgr:     toolbox.NewToolServiceImpl(),
			MCPMgr:         mcp.NewMCPServiceImpl(),
			DBTx:           dbaccess.NewBaseTx(),
			Validator:      validator.NewValidator(),
			FlowAutomation: drivenadapters.NewFlowAutomationClient(),
		}
	})
	return impexManager
}

// ExportConfig 导出组件配置
func (m *componentImpexManager) ExportConfig(ctx context.Context, req *interfaces.ExportConfigReq) (data *interfaces.ComponentImpexConfigModel, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	exportReq := &interfaces.ExportReq{
		UserID: req.UserID,
		IDs:    []string{req.ID},
	}
	switch req.Type {
	case interfaces.ComponentTypeOperator:
		data, err = m.OperatorMgr.Export(ctx, exportReq)
	case interfaces.ComponentTypeToolBox:
		data, err = m.ToolboxMgr.Export(ctx, exportReq)
	case interfaces.ComponentTypeMCP:
		data, err = m.MCPMgr.Export(ctx, exportReq)
	default:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "component type not support")
	}
	if err != nil {
		m.Logger.WithContext(ctx).Warnf("export config failed, err: %v", err)
		return
	}
	return data, nil
}

// ImportConfig 导入组件配置
func (m *componentImpexManager) ImportConfig(ctx context.Context, importReq *interfaces.ImportConfigReq) (err error) {
	data, err := m.parseImportData(ctx, importReq.Data)
	if err != nil {
		return
	}
	if err = m.validateImportData(ctx, data); err != nil {
		return
	}
	resourceType := convertResourceType(importReq.Type)
	if resourceType == "" {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "component type not support")
		return
	}
	if err = m.checkImportPermissions(ctx, importReq.UserID, resourceType, data); err != nil {
		return
	}
	if err = m.executeImport(ctx, importReq.Type, data, importReq.Mode, importReq.UserID); err != nil {
		return
	}
	return
}

func (m *componentImpexManager) parseImportData(ctx context.Context, raw json.RawMessage) (data *interfaces.ComponentImpexConfigModel, err error) {
	data = &interfaces.ComponentImpexConfigModel{
		Operator: &interfaces.OperatorImpexConfig{},
		Toolbox:  &interfaces.ToolBoxImpexConfig{},
		MCP:      &interfaces.MCPImpexConfig{},
	}
	if err = jsoniter.Unmarshal(raw, data); err != nil {
		m.Logger.WithContext(ctx).Errorf("import config failed, err: %v", err)
		return nil, errors.DefaultHTTPError(ctx, http.StatusBadRequest, "import config failed")
	}
	return data, nil
}

func (m *componentImpexManager) validateImportData(ctx context.Context, data *interfaces.ComponentImpexConfigModel) (err error) {
	if err = m.Validator.ValidatorStruct(ctx, data); err != nil {
		m.Logger.WithContext(ctx).Errorf("validate config failed, err: %v", err)
		return errors.DefaultHTTPError(ctx, http.StatusBadRequest, "validate config failed")
	}
	return nil
}

func (m *componentImpexManager) checkImportPermissions(ctx context.Context, userID string,
	resourceType interfaces.AuthResourceType, data *interfaces.ComponentImpexConfigModel) (err error) {
	accessor, err := m.AuthService.GetAccessor(ctx, userID)
	if err != nil {
		return err
	}
	if err = m.AuthService.CheckCreatePermission(ctx, accessor, resourceType); err != nil {
		return err
	}
	switch resourceType {
	case interfaces.AuthResourceTypeOperator:
		return nil
	case interfaces.AuthResourceTypeToolBox:
		if data.Operator != nil && len(data.Operator.Configs) > 0 {
			return m.AuthService.CheckCreatePermission(ctx, accessor, interfaces.AuthResourceTypeOperator)
		}
		return nil
	case interfaces.AuthResourceTypeMCP:
		if data.Operator != nil && len(data.Operator.Configs) > 0 {
			if err = m.AuthService.CheckCreatePermission(ctx, accessor, interfaces.AuthResourceTypeOperator); err != nil {
				return err
			}
		}
		if data.Toolbox != nil && len(data.Toolbox.Configs) > 0 {
			if err = m.AuthService.CheckCreatePermission(ctx, accessor, interfaces.AuthResourceTypeToolBox); err != nil {
				return err
			}
		}
		return nil
	default:
		return errors.DefaultHTTPError(ctx, http.StatusBadRequest, "component type not support")
	}
}

func (m *componentImpexManager) executeImport(ctx context.Context, compType interfaces.ComponentType,
	data *interfaces.ComponentImpexConfigModel, mode interfaces.ImportType, userID string) (err error) {
	if err = m.importConfigWithTx(ctx, compType, data, mode, userID); err != nil {
		return err
	}
	return m.runImportHooks(ctx, data, mode, userID)
}

func (m *componentImpexManager) runImportHooks(ctx context.Context, data *interfaces.ComponentImpexConfigModel,
	mode interfaces.ImportType, userID string) (err error) {
	if data.Operator != nil && len(data.Operator.CompositeConfigs) > 0 {
		req := &interfaces.FlowAutomationImportReq{
			Mode:    string(mode),
			Configs: data.Operator.CompositeConfigs,
		}
		if err = m.FlowAutomation.Import(ctx, req, userID); err != nil {
			return err
		}
	}
	if data.MCP != nil && len(data.MCP.Configs) > 0 {
		for _, mcpConfig := range data.MCP.Configs {
			e := m.MCPMgr.UpgradeMCPInstance(ctx, mcpConfig.MCPID)
			if e != nil {
				m.Logger.WithContext(ctx).Errorf("upgrade mcp instance failed, err: %v", e)
			}
		}
	}
	return nil
}

// 事务导入
func (m *componentImpexManager) importConfigWithTx(ctx context.Context, compType interfaces.ComponentType,
	data *interfaces.ComponentImpexConfigModel, mode interfaces.ImportType, userID string) (err error) {
	tx, err := m.DBTx.GetTx(ctx)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("get tx failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "get tx failed")
		return
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()
	switch compType {
	case interfaces.ComponentTypeOperator:
		err = m.OperatorMgr.Import(ctx, tx, mode, data.Operator, userID)
	case interfaces.ComponentTypeToolBox:
		err = m.ToolboxMgr.Import(ctx, tx, mode, data, userID)
	case interfaces.ComponentTypeMCP:
		err = m.MCPMgr.Import(ctx, tx, mode, data, userID)
	}
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("import config failed, err: %v", err)
	}
	return
}

// 组件和资源类型转换
func convertResourceType(componentType interfaces.ComponentType) interfaces.AuthResourceType {
	switch componentType {
	case interfaces.ComponentTypeOperator:
		return interfaces.AuthResourceTypeOperator
	case interfaces.ComponentTypeToolBox:
		return interfaces.AuthResourceTypeToolBox
	case interfaces.ComponentTypeMCP:
		return interfaces.AuthResourceTypeMCP
	default:
		return ""
	}
}
