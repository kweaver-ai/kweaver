package database

import (
	"errors"
	"fmt"
	"path"

	"workstation-backend/internal/cerror"

	"gorm.io/gorm"
)

func (g *GormImpl) replaceKnownError(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return cerror.ErrRecordNotFound
	}
	return err
}

func (g *GormImpl) Check() error {
	var result int
	err := g.db.Raw("SELECT 1").Scan(&result).Error
	if err != nil {
		return err
	}
	if result != 1 {
		return fmt.Errorf("unexpected query result")
	}
	return nil
}

func (g *GormImpl) IsInlineWebApp(name string) (bool, error) {
	var rel MicroWebappRecord
	err := g.db.Where(&MicroWebappRecord{Name: name}).Select("type").First(&rel).Error
	if err != nil {
		// return false, err
		return false, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "query web app type failed"),
		)
	}
	return rel.Type == MicroWebappRecordTypeInline, nil
}

func (g *GormImpl) LoadParentNames(name string) ([]string, error) {
	result := make([]string, 0)
	if name == "" {
		// 查询到顶级了
		return result, nil
	}
	var app MicroWebappRecord
	err := g.db.Where(MicroWebappRecord{Name: name}).Select("parent").First(&app).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return result, nil
		}
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "load parent web app failed"),
		)
	}

	overrides, err := g.loadUserConfigsCache(g.app.CommonConfig.GlobalSID)
	if err != nil {
		return nil, err
	}

	p := app.Parent
	// 被 override 变更
	for _, o := range overrides {
		if o.Name == name {
			if o.Parent != "" {
				p = o.Parent
			}
		}
	}

	result = append(result, p)
	// 继续查询父级
	ppName, err := g.LoadParentNames(p)
	if err != nil {
		return nil, err
	}
	result = append(result, ppName...)
	return result, nil
}

func (g *GormImpl) LoadChildrenNames(name string) ([]string, error) {
	result := make([]string, 0)
	var apps []MicroWebappRecord
	err := g.db.Where(MicroWebappRecord{Parent: name}).Select("name").Find(&apps).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return result, nil
		}
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "load child web app failed"),
		)
	}

	// 全局用户才能修改Parent
	overrides, err := g.loadUserConfigsCache(g.app.CommonConfig.GlobalSID)
	if err != nil {
		return nil, err
	}
	overridesMap := listToMap(overrides, func(o MicroWebappOverride) string { return o.Name })

	// 查询 parent 被改成它的 override
	needAdd := filter(overrides, func(o MicroWebappOverride) bool { return o.Parent == name })
	needAddNames := extractList(needAdd, func(o MicroWebappOverride) string { return o.Name })
	// 查询 parent 被 override 移除的 apps
	apps = filter(apps, func(mwr MicroWebappRecord) bool {
		// 过滤 parent 没变的
		if oo, ok := overridesMap[mwr.Name]; ok && oo.Parent != "" && oo.Parent != name {
			return false
		}
		return true
	})
	appsNames := extractList(apps, func(app MicroWebappRecord) string { return app.Name })
	// 加上加入的app
	appsNames = append(appsNames, needAddNames...)
	// 去重
	appsNames = uniqueString(appsNames)

	for _, appName := range appsNames {
		children, err := g.LoadChildrenNames(appName)
		if err != nil {
			return nil, err
		}
		result = append(result, children...)
		result = append(result, appName)
	}

	return result, nil
}

/*
genPath 返回直到 parent 为空的所有子级
- root
  - settings
  - security

- genPath("root", "") => ""
- genPath("settings", "") => g.genPath("root", "settings") => "settings"
- genPath("security", "") => g.genPath("settings", "security") => g.genPath("root", "settings/security")
*/
func (g *GormImpl) genPath(name string, nowPath string) (string, error) {
	var rec MicroWebappRecord
	err := g.db.Where(&MicroWebappRecord{Name: name}).First(&rec).Error
	if err != nil {
		return "", errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "get web app failed"))
	}

	if rec.Parent == "" {
		return nowPath, nil
	}

	nextPath := path.Join(name, nowPath)
	parentPath, err := g.genPath(rec.Parent, nextPath)
	if err != nil {
		return "", err
	}
	return parentPath, nil
}

// RootPath 获取WebApp的根路径
// 此路径可能为空，如果不为空则包含前缀 /
func (g *GormImpl) RootPath(name string) (string, error) {
	path, err := g.genPath(name, "") // 以 "" 为准，返回 parent 为空时的当前webapp
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil
	}
	return fmt.Sprintf("/%s", path), nil
}
