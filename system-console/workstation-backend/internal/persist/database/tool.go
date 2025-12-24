package database

import (
	"encoding/json"

	"workstation-backend/internal/model"
)

func mustToJson(data map[string]any) string {
	if data == nil {
		return "{}"
	}
	b, err := json.Marshal(data)
	if err != nil {
		panic(err)
	}
	return string(b)
}

func mustToMap(data string) map[string]any {
	var m map[string]any
	err := json.Unmarshal([]byte(data), &m)
	if err != nil {
		panic(err)
	}
	return m
}

func mergeAppSettings(app model.WebApp, overide *MicroWebappOverride) model.WebApp {
	if overide.Parent != "" {
		app.Parent = overide.Parent
	}
	app.Manifest = deepMerge(app.Manifest, mustToMap(overide.Manifest))
	return app
}

func deepMerge(dst, src map[string]any) map[string]any {
	for key, srcVal := range src {
		if dstVal, ok := dst[key]; ok {
			// 如果两个值都是map，递归合并
			if srcMap, srcOk := srcVal.(map[string]any); srcOk {
				if dstMap, dstOk := dstVal.(map[string]any); dstOk {
					deepMerge(dstMap, srcMap)
					continue
				}
			}
		}
		// 否则直接覆盖
		dst[key] = srcVal
	}
	return dst
}

func listToMap[T any](list []T, key func(T) string) map[string]T {
	result := make(map[string]T)
	for _, item := range list {
		result[key(item)] = item
	}
	return result
}

//nolint:unused
func mapToList[T any](m map[string]T) []T {
	result := make([]T, 0, len(m))
	for _, item := range m {
		result = append(result, item)
	}
	return result
}

func extractList[T any, R any](list []T, extract func(T) R) []R {
	result := make([]R, 0, len(list))
	for _, item := range list {
		result = append(result, extract(item))
	}
	return result
}

func sliceIn[T comparable](item T, slice []T) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func defaultTo(val, els string) string {
	if val != "" {
		return val
	}
	return els
}

func filter[T any](list []T, predicate func(T) bool) []T {
	result := make([]T, 0, len(list))
	for _, item := range list {
		if predicate(item) {
			result = append(result, item)
		}
	}
	return result
}

func uniqueString(list []string) []string {
	result := make([]string, 0, len(list))
	resultMap := make(map[string]struct{}, 0)
	for _, l := range list {
		resultMap[l] = struct{}{}
	}
	for key := range resultMap {
		result = append(result, key)
	}
	return result
}
