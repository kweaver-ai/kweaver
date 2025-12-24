package database

import (
	"embed"
	"io/fs"
	"strings"
)

//go:embed builtin_apps
var builtinAppsFS embed.FS

//go:embed builtin_configs
var builtinConfigsFS embed.FS

const (
	BuiltinAppsDir    = "builtin_apps"
	BuiltinConfigsDir = "builtin_configs"
)

func toPanic(err error) {
	if err != nil {
		panic(err)
	}
}

func generateBuiltinApps() []MicroWebappRecord {
	var rel []MicroWebappRecord
	err := fs.WalkDir(builtinAppsFS, BuiltinAppsDir, func(path string, d fs.DirEntry, err error) error {
		if d.Type().IsRegular() {
			if strings.HasSuffix(strings.ToLower(path), "json") {
				ct, err := builtinAppsFS.ReadFile(path)
				if err != nil {
					return err
				}
				mm := mustToMap(string(ct))
				name := mm["name"].(string)
				parent := mm["parent"].(string)
				rel = append(rel, MicroWebappRecord{
					Name:     name,
					Parent:   parent,
					Type:     MicroWebappRecordTypeBuiltin,
					Manifest: mustToJson(mm),
				})
			}
		}
		return nil
	})
	toPanic(err)
	return rel
}

func generateBuiltinConfigs(uid string, product string) []MicroWebappOverride {
	var rel []MicroWebappOverride
	err := fs.WalkDir(builtinConfigsFS, BuiltinConfigsDir+"/"+product, func(path string, d fs.DirEntry, err error) error {
		if d != nil && d.Type().IsRegular() {
			if strings.HasSuffix(strings.ToLower(path), "json") {
				ct, err := builtinConfigsFS.ReadFile(path)
				if err != nil {
					return err
				}
				mm := mustToMap(string(ct))
				// 处理可选机制
				parent := ""
				if optionParent, ok := mm["parent"]; ok {
					parent = optionParent.(string)
				}
				rel = append(rel, MicroWebappOverride{
					Name:     mm["name"].(string),
					Parent:   parent,
					UID:      uid,
					Manifest: mustToJson(mm["manifest"].(map[string]any)),
				})
			}
		}
		return nil
	})
	toPanic(err)
	return rel
}
