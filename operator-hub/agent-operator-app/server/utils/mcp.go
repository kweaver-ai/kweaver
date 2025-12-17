package utils

import "fmt"

func GenerateMCPKey(mcpID string, mcpVersion int) string {
	return fmt.Sprintf("%s-%d", mcpID, mcpVersion)
}

func GenerateMCPServerVersion(mcpVersion int) string {
	return fmt.Sprintf("%d.0.0", mcpVersion)
}
