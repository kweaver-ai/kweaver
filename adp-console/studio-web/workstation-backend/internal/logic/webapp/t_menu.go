package webapp

import (
	"errors"
	"sort"
	"strings"
)

type (
	MenuItem struct {
		ID         string  `json:"id"`
		Name       string  `json:"name"`
		Type       string  `json:"type"`
		orderIndex float64 `json:"-"`
	}
	MenuResult struct {
		Entries    []MenuItem `json:"entries"`
		TotalCount int        `json:"total_count"`
	}
)

const menuItemType = "menu"

func ManifestMenuItems(m Manifest, lan string) (MenuResult, error) {
	type mm = map[string]any
	type ll = []any //nolint:unused
	var result MenuResult

	menus := make([]MenuItem, 0)
	subappAny, ok := m["subapp"]
	if !ok {
		// 没有 subapp
		return result, nil
	}
	subApp, ok := subappAny.(mm)
	if !ok {
		return result, errors.New("manifest subapp is not map")
	}
	childrenAny, ok := subApp["children"]
	if !ok {
		// 没有 children
		return result, nil
	}
	children, ok := childrenAny.(mm)
	if !ok {
		return result, errors.New("manifest children is not map")
	}

	lanKey := ""
	switch strings.ToLower(lan) {
	case "zh-cn":
		lanKey = "textZHCN"
	case "en-us":
		lanKey = "textENUS"
	case "zh-tw":
		lanKey = "textZHTW"
	default:
		lanKey = "textENUS"
	}

	for id, childAny := range children {
		child, ok := childAny.(mm)
		if !ok {
			return result, errors.New("manifest child is not map")
		}
		childName := child["app"].(mm)[lanKey].(string)
		childIndex := child["orderIndex"].(float64)
		menus = append(menus, MenuItem{
			ID:         id,
			Name:       childName,
			Type:       menuItemType,
			orderIndex: childIndex,
		})

	}
	sort.Slice(menus, func(i, j int) bool { return menus[i].orderIndex < menus[j].orderIndex })
	result.Entries = menus
	result.TotalCount = len(menus)
	return result, nil
}
