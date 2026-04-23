package impex

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/errors"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces"
)

var (
	semverSuffixPattern   = regexp.MustCompile(`^(?P<name>.+)_(?P<version>\d+\.\d+\.\d+)$`)
	compactVerSuffixRegex = regexp.MustCompile(`^(?P<name>.+)_(?P<version>\d{3})$`)
)

// ImportConfigInternal 内部导入配置
func (m *componentImpexManager) ImportConfigInternal(ctx context.Context, importReq *interfaces.InternalImportConfigReq) (resp *interfaces.InternalImportConfigResp, err error) {
	data, err := m.parseImportData(ctx, importReq.Data)
	if err != nil {
		return nil, err
	}
	if err = m.validateImportData(ctx, data); err != nil {
		return nil, err
	}
	if importReq.Type != interfaces.ComponentTypeToolBox {
		return nil, errors.DefaultHTTPError(ctx, http.StatusBadRequest, "component type not support")
	}
	if importReq.UserID == "" {
		importReq.UserID = interfaces.SystemUser
	}
	filteredData, resourceIDs, hasExisting, err := m.filterInternalToolboxConfigs(ctx, data, importReq.PackageVersion)
	if err != nil {
		return nil, err
	}

	if filteredData == nil || filteredData.Toolbox == nil || len(filteredData.Toolbox.Configs) == 0 {
		return &interfaces.InternalImportConfigResp{
			Status:      interfaces.InternalImportStatusSkipped,
			Type:        importReq.Type,
			ResourceIDs: resourceIDs,
			Message:     "current version is greater than or equal to package version",
		}, nil
	}

	if err = m.executeImport(ctx, importReq.Type, filteredData, importReq.Mode, importReq.UserID); err != nil {
		return nil, err
	}

	status := interfaces.InternalImportStatusImported
	if hasExisting {
		status = interfaces.InternalImportStatusUpdated
	}
	return &interfaces.InternalImportConfigResp{
		Status:      status,
		Type:        importReq.Type,
		ResourceIDs: resourceIDs,
		Message:     "tool dependency package synchronized",
	}, nil
}

func (m *componentImpexManager) filterInternalToolboxConfigs(ctx context.Context,
	data *interfaces.ComponentImpexConfigModel, packageVersion string) (filteredData *interfaces.ComponentImpexConfigModel,
	resourceIDs []string, hasExisting bool, err error) {
	if err = validateInternalToolboxData(ctx, data); err != nil {
		return nil, nil, false, err
	}

	filtered := make([]*interfaces.ToolBoxImpexItem, 0, len(data.Toolbox.Configs))
	resourceIDs = make([]string, 0, len(data.Toolbox.Configs))
	for _, cfg := range data.Toolbox.Configs {
		resourceIDs = append(resourceIDs, cfg.BoxID)
		cfg.BoxName = ensureToolboxNameVersion(cfg.BoxName, packageVersion)

		currentVersion, exists, lookupErr := m.getCurrentToolboxVersion(ctx, cfg.BoxID)
		if lookupErr != nil {
			return nil, nil, false, lookupErr
		}
		if !exists {
			filtered = append(filtered, cfg)
			continue
		}
		hasExisting = true
		if currentVersion == "" {
			filtered = append(filtered, cfg)
			continue
		}
		cmp, cmpErr := compareSemanticVersions(currentVersion, packageVersion)
		if cmpErr != nil {
			return nil, nil, false, errors.DefaultHTTPError(ctx, http.StatusBadRequest, cmpErr.Error())
		}
		if cmp < 0 {
			filtered = append(filtered, cfg)
		}
	}

	return &interfaces.ComponentImpexConfigModel{
		Toolbox: &interfaces.ToolBoxImpexConfig{
			Configs: filtered,
		},
		Operator: &interfaces.OperatorImpexConfig{},
		MCP:      &interfaces.MCPImpexConfig{},
	}, resourceIDs, hasExisting, nil
}

func validateInternalToolboxData(ctx context.Context, data *interfaces.ComponentImpexConfigModel) error {
	if data.MCP != nil && len(data.MCP.Configs) > 0 {
		return errors.DefaultHTTPError(ctx, http.StatusBadRequest, "internal toolbox import does not support mcp configs")
	}
	if data.Operator != nil && len(data.Operator.Configs) > 0 {
		return errors.DefaultHTTPError(ctx, http.StatusBadRequest, "internal toolbox import does not support operator configs")
	}
	if data.Toolbox == nil || len(data.Toolbox.Configs) == 0 {
		return errors.DefaultHTTPError(ctx, http.StatusBadRequest, "toolbox configs is empty")
	}
	return nil
}

func (m *componentImpexManager) getCurrentToolboxVersion(ctx context.Context, boxID string) (version string, exists bool, err error) {
	resp, err := m.ToolboxMgr.GetToolBox(ctx, &interfaces.GetToolBoxReq{
		UserID: importReqUser(ctx),
		BoxID:  boxID,
	}, false)
	if err != nil {
		if httpErr, ok := err.(*errors.HTTPError); ok && httpErr.HTTPCode == http.StatusNotFound {
			return "", false, nil
		}
		return "", false, err
	}
	version, _ = parseVersionFromToolboxName(resp.BoxName)
	return version, true, nil
}

func importReqUser(ctx context.Context) string {
	return interfaces.SystemUser
}

func ensureToolboxNameVersion(boxName, packageVersion string) string {
	if _, ok := parseVersionFromToolboxName(boxName); ok {
		return boxName
	}
	return fmt.Sprintf("%s_%s", boxName, packageVersion)
}

func parseVersionFromToolboxName(boxName string) (string, bool) {
	if matches := semverSuffixPattern.FindStringSubmatch(boxName); len(matches) == 3 {
		return matches[2], true
	}
	if matches := compactVerSuffixRegex.FindStringSubmatch(boxName); len(matches) == 3 {
		raw := matches[2]
		return fmt.Sprintf("%c.%c.%c", raw[0], raw[1], raw[2]), true
	}
	return "", false
}

func compareSemanticVersions(currentVersion, targetVersion string) (int, error) {
	currentParts, err := splitSemanticVersion(currentVersion)
	if err != nil {
		return 0, err
	}
	targetParts, err := splitSemanticVersion(targetVersion)
	if err != nil {
		return 0, err
	}
	maxLen := len(currentParts)
	if len(targetParts) > maxLen {
		maxLen = len(targetParts)
	}
	for i := 0; i < maxLen; i++ {
		currentVal := semanticPart(currentParts, i)
		targetVal := semanticPart(targetParts, i)
		switch {
		case currentVal < targetVal:
			return -1, nil
		case currentVal > targetVal:
			return 1, nil
		}
	}
	return 0, nil
}

func splitSemanticVersion(version string) ([]int, error) {
	parts := strings.Split(version, ".")
	if len(parts) < 3 {
		return nil, fmt.Errorf("invalid version format: %s", version)
	}
	result := make([]int, 0, len(parts))
	for _, part := range parts {
		value, err := strconv.Atoi(part)
		if err != nil {
			return nil, fmt.Errorf("invalid version format: %s", version)
		}
		result = append(result, value)
	}
	return result, nil
}

func semanticPart(parts []int, idx int) int {
	if idx >= 0 && idx < len(parts) {
		return parts[idx]
	}
	return 0
}
