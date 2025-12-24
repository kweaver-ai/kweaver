package webapp

import (
	"errors"
	"fmt"

	"workstation-backend/internal/model"
)

type Manifest = map[string]any

func GenerateWebapps(ms []Manifest, _type string) (map[string]model.WebApp, error) {
	rel := make(map[string]model.WebApp)
	for _, m := range ms {
		name, ok := m["name"]
		if !ok {
			return nil, errors.New("manifest name is not exist")
		}
		nameStr, ok := name.(string)
		if !ok {
			return nil, errors.New("manifest name is not string")
		}
		if _, ok := rel[nameStr]; ok {
			return nil, errors.New("manifest name is duplicate")
		}
		parent, ok := m["parent"]
		if !ok {
			return nil, errors.New("manifest parent is not exist")
		}
		parentStr, ok := parent.(string)
		if !ok {
			return nil, errors.New("manifest parent is not string")
		}
		if parentStr == "" {
			return nil, errors.New("manifest parent must setup")
		}

		inlineChildrens, err := InlineChildrens(m)
		if err != nil {
			return nil, err
		}

		rel[nameStr] = model.WebApp{
			Name:     nameStr,
			Inline:   false,
			Type:     _type,
			Parent:   m["parent"].(string),
			Manifest: m,
		}

		for _, inlineChildren := range inlineChildrens {
			inlineChildrenName := inlineChildren["name"].(string)
			if _, ok := rel[inlineChildrenName]; ok {
				return nil, errors.New("manifest name is duplicate")
			}
			rel[inlineChildrenName] = model.WebApp{
				Name:     inlineChildrenName,
				Inline:   true,
				Type:     model.WebAppTypeInline,
				Parent:   inlineChildren["parent"].(string),
				Manifest: inlineChildren,
			}
		}

	}
	return rel, nil
}

func InlineChildrens(m Manifest) ([]Manifest, error) {
	var rel []Manifest
	// 必须有此字段
	subapp := m["subapp"].(map[string]any)
	children, ok := subapp["children"]
	if !ok {
		return rel, nil
	}

	childrenMap := children.(map[string]any)
	for name, child := range childrenMap {
		childManifest := child.(Manifest)
		childName := childManifest["name"].(string)
		if name != childName {
			return nil, errors.New("manifest name is not equal")
		}
		childrents, err := InlineChildrens(childManifest)
		if err != nil {
			return nil, err
		}
		rel = append(rel, childrents...)
		// 添加自己
		childManifest["parent"] = m["name"]
		rel = append(rel, childManifest)
	}
	delete(subapp, "children")
	return rel, nil
}

func getChildrens(
	root string,
	webapps map[string]model.WebApp,
) map[string]model.WebApp {
	result := make(map[string]model.WebApp)
	for _, webapp := range webapps {
		if webapp.Parent == root {
			result[webapp.Name] = webapp
		}
	}
	return result
}

func MakeManifest(
	root string,
	webapps map[string]model.WebApp,
	basepath string,
) (Manifest, error) {
	result := webapps[root].Manifest
	result["meta"] = map[string]any{"type": webapps[root].Type}
	childrens := getChildrens(root, webapps)
	if _, ok := result["subapp"].(map[string]any); !ok {
		return nil, fmt.Errorf("webapp [%s] manifest must have subapp field: %v", root, result)
	}
	result["subapp"].(map[string]any)["children"] = make(map[string]any, len(childrens))
	for name, childrend := range childrens {
		pathname := basepath + "/" + childrend.Name
		childrendManifest, err := MakeManifest(childrend.Name, webapps, pathname)
		if err != nil {
			return nil, err
		}
		result["subapp"].(map[string]any)["children"].(map[string]any)[name] = childrendManifest
	}
	if _, ok := result["app"].(map[string]any)["pathname"]; !ok {
		// 不存在时才计算
		result["app"].(map[string]any)["pathname"] = basepath
	}
	return result, nil
}

func MakeManifestList(
	root string,
	webapps map[string]model.WebApp,
	basepath string,
) (Manifest, error) {
	result := webapps[root].Manifest
	childrens := getChildrens(root, webapps)
	result["subapp"].(map[string]any)["children"] = make([]map[string]any, 0, len(childrens))
	for _, childrend := range childrens {
		pathname := basepath + "/" + childrend.Name
		childrendManifest, err := MakeManifestList(childrend.Name, webapps, pathname)
		if err != nil {
			return nil, err
		}
		result["subapp"].(map[string]any)["children"] = append(
			result["subapp"].(map[string]any)["children"].([]map[string]any), childrendManifest,
		)
	}
	result["app"].(map[string]any)["pathname"] = basepath
	return result, nil
}

func CheckManifest(ms []Manifest) error {
	for _, m := range ms {
		err := ValidManifest(m)
		if err != nil {
			// 如果 name 存在，错误信息中添加 name
			if name, ok := m["name"]; ok {
				if nameStr, ok := name.(string); ok {
					return fmt.Errorf("manifest(%s) valid error: %s", nameStr, err)
				}
			}
			return err
		}
		{ // 自定义验证
			if p, ok := m["parent"]; ok && p.(string) == m["name"].(string) {
				return fmt.Errorf(
					"custom valid: (%s) parent(%s) cannot be equals name",
					m["name"].(string),
					p.(string),
				)
			}
		}
		childrents, err := InlineChildrens(m)
		if err != nil {
			return err
		}
		err = CheckManifest(childrents)
		if err != nil {
			return err
		}
	}
	return nil
}
