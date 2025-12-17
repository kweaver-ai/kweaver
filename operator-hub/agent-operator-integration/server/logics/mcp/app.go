package mcp

import (
	"context"
	"fmt"
	"net/http"

	infraerrors "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
)

func (s *mcpServiceImpl) GetAppConfig(ctx context.Context, mcpID string, mode interfaces.MCPMode) (*interfaces.MCPAppConfigInfo, error) {
	// 获取MCP Server发布信息
	release, err := s.DBMCPServerRelease.SelectByMCPID(ctx, nil, mcpID)
	if err != nil {
		return nil, fmt.Errorf("select mcp server release failed: %w", err)
	}

	if release == nil {
		return nil, infraerrors.NewHTTPError(ctx, http.StatusNotFound, infraerrors.ErrExtMCPNotFound, "mcp server not exist")
	}

	// 校验MCP Server是否允许该模式访问
	if release.CreationType == interfaces.MCPCreationTypeCustom.String() {
		if release.Mode != mode.String() {
			// 报错，不支持该连接模式
			return nil, infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtMCPNotFound, "mcp server not support this mode")
		}
	}

	// 校验执行权限
	accessor, err := s.AuthService.GetAccessor(ctx, "")
	if err != nil {
		return nil, err
	}
	err = s.AuthService.CheckExecutePermission(ctx, accessor, release.MCPID, interfaces.AuthResourceTypeMCP)
	if err != nil {
		return nil, err
	}

	// 组装配置信息
	var config *interfaces.MCPAppConfigInfo
	switch release.CreationType {
	case interfaces.MCPCreationTypeCustom.String():
		config = s.getCustomAppConfig(release, mode)
	case interfaces.MCPCreationTypeToolImported.String():
		config = s.getToolImportedAppConfig(release, mode)
	default:
		return nil, infraerrors.NewHTTPError(ctx, http.StatusBadRequest, infraerrors.ErrExtMCPNotFound, "mcp server not support this mode")
	}
	// 返回配置信息
	return config, nil
}

func (s *mcpServiceImpl) getCustomAppConfig(release *model.MCPServerReleaseDB, mode interfaces.MCPMode) *interfaces.MCPAppConfigInfo {
	config := &interfaces.MCPAppConfigInfo{
		MCPID:   release.MCPID,
		Mode:    mode,
		URL:     release.URL,
		Headers: utils.JSONToObject[map[string]string](release.Headers),
	}

	return config
}

func (s *mcpServiceImpl) getToolImportedAppConfig(release *model.MCPServerReleaseDB, mode interfaces.MCPMode) *interfaces.MCPAppConfigInfo {
	config := &interfaces.MCPAppConfigInfo{
		MCPID:   release.MCPID,
		Mode:    mode,
		URL:     s.generateInternalMCPURL(release.MCPID, release.Version, mode),
		Headers: utils.JSONToObject[map[string]string](release.Headers),
	}

	return config
}
