package database

import (
	"errors"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"
	"workstation-backend/internal/persist"

	"gorm.io/gorm"
)

// loadChildrens 查询子应用
// 1. 会移除已经被修改Parent的子应用
// 2. 会添加修改Parent为该应用的子应用
// 这是一个比较重的查询方法
func (g *GormImpl) loadChildrens(
	parent string,
	withMoved bool,
	sid string,
	onlyInline bool,
) ([]MicroWebappRecord, error) {
	var (
		rel, selectRel []MicroWebappRecord
		err            error
	)
	if onlyInline {
		err = g.db.Where(MicroWebappRecord{Parent: parent, Type: MicroWebappRecordTypeInline}).
			Find(&selectRel).
			Error
	} else {
		err = g.db.Where(MicroWebappRecord{Parent: parent}).Find(&selectRel).Error
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "load web app failed"))
	}
	selectRelMap := listToMap(selectRel, func(item MicroWebappRecord) string { return item.Name })

	// 合并全局用户和个人配置
	if withMoved {
		// 1. 移除parent被改变的子应用
		selectRelNames := extractList(selectRel, func(item MicroWebappRecord) string { return item.Name })
		allSettings, err := g.loadUserConfigsCache(sid) // 获取所有设置
		if err != nil {
			return nil, err
		}
		/// 过滤查询的 webapp
		querySettings := filter(allSettings, func(mwo MicroWebappOverride) bool { return sliceIn(mwo.Name, selectRelNames) })
		for _, overrideApp := range querySettings {
			if overrideApp.Parent != "" && overrideApp.Parent != parent {
				// Parent 被修改了
				delete(selectRelMap, overrideApp.Name)
			} // 移除 parent 被被变更的 webapp 项目
		}

		// 2. 查询parent被变更到当前的设置
		chageParentedRel := filter(allSettings, func(s MicroWebappOverride) bool { return s.Parent == parent })
		if len(chageParentedRel) > 0 {
			// 查询变更到当前Parent的Apps（map）
			// 提取名字，然后查询完整的 webapp，并修改 parent
			names := extractList(chageParentedRel, func(item MicroWebappOverride) string { return item.Name })
			maps := listToMap(chageParentedRel, func(item MicroWebappOverride) string { return item.Name })
			var changeParentApps []MicroWebappRecord
			err := g.db.Where("name in ?", names).Find(&changeParentApps).Error
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.Join(
					cerror.ErrOperationFailed,
					cerror.Warp(err, "load override web app failed on step2"),
				)
			}
			changeParentAppsMap := listToMap(changeParentApps, func(item MicroWebappRecord) string { return item.Name })
			for _, name := range names {
				if app, ok := selectRelMap[name]; ok {
					// 这是修改Parent到当前的App，原则上不会被第一次查到，应该不可达
					app.Parent = parent
					selectRelMap[name] = app
				} else {
					// 将结果追加到结果中
					if _app, ok := changeParentAppsMap[name]; ok {
						_app.Parent = parent
						selectRelMap[name] = _app
					} else {
						// 可能是个全新的菜单【不支持】
						_ = maps
						// om := mustToMap(maps[name].Manifest)
						// g.log.WithField("m", maps[name].Manifest).WithField("name", name).Infoln("")
						// if _t, ok := om["type"]; ok && _t.(string) == MicroWebappRecordTypeCustom {
						// 	selectRelMap[name] = MicroWebappRecord{
						// 		Name:     name,
						// 		Parent:   parent,
						// 		Type:     MicroWebappRecordTypeCustom,
						// 		Manifest: maps[name].Manifest,
						// 	}
						// }
					}
				}
			}
		}
	}

	// 继续查询children, 并将结追加
	for _, relApp := range selectRelMap {
		children, err := g.loadChildrens(relApp.Name, withMoved, sid, onlyInline)
		if err != nil {
			return nil, err
		}
		rel = append(rel, children...)
		rel = append(rel, relApp) // 追加已经查询的children
	}
	return rel, nil
}

func (g *GormImpl) Load(param persist.LoadParams) (map[string]model.WebApp, error) {
	var app MicroWebappRecord
	err := g.db.Where(MicroWebappRecord{Name: param.Name}).First(&app).Error
	if err != nil {
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "load web app failed"),
		)
	}

	result := map[string]model.WebApp{
		param.Name: {
			Name:     param.Name,
			Parent:   app.Parent,
			Manifest: mustToMap(app.Manifest),
			Inline:   app.Type == MicroWebappRecordTypeInline,
			Type:     app.Type,
		},
	}
	childrends, err := g.loadChildrens(param.Name, param.WithMoved, param.Sid, false)
	if err != nil {
		return nil, err
	}

	for _, childrend := range childrends {
		result[childrend.Name] = model.WebApp{
			Name:     childrend.Name,
			Parent:   childrend.Parent,
			Manifest: mustToMap(childrend.Manifest),
			Inline:   childrend.Type == MicroWebappRecordTypeInline,
			Type:     childrend.Type,
		}
	}

	if param.WithSetted {
		result = g.mergeConfig(param.Sid, result)
	}
	return result, nil
}
