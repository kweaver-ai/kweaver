package database

import (
	"errors"
	"fmt"

	"workstation-backend/internal/cache"
	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"

	"gorm.io/gorm"
)

func (g *GormImpl) GetConfig(uid string, name string) (*model.WebAppSettings, error) {
	var settings MicroWebappOverride
	err := g.db.Where("uid = ?", uid).Where(MicroWebappOverride{Name: name}).First(&settings).Error
	if err != nil {
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "load web app settings failed"),
		)
	}
	return &model.WebAppSettings{
		Name:     settings.Name,
		Settings: mustToMap(settings.Manifest),
	}, nil
}

func (g *GormImpl) BatchGetConfig(
	uid string,
	names []string,
) (map[string]*model.WebAppSettings, error) {
	var settings []MicroWebappOverride
	err := g.db.Where("uid = ?", uid).Where("name IN ?", names).Find(&settings).Error
	if err != nil {
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "load web app settings failed"),
		)
	}
	resultModles := extractList(settings, func(s MicroWebappOverride) *model.WebAppSettings {
		return &model.WebAppSettings{
			Name:     s.Name,
			Parent:   s.Parent,
			Settings: mustToMap(s.Manifest),
		}
	})
	result := listToMap(resultModles, func(was *model.WebAppSettings) string { return was.Name })
	return result, nil
}

func (g *GormImpl) SetConfig(uid string, app *model.WebAppSettings) error {
	if !g.slock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.slock.Unlock()

	var existOverride MicroWebappOverride
	err := g.db.Where("uid = ?", uid).
		Where(MicroWebappOverride{Name: app.Name}).
		First(&existOverride).
		Error
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		// 创建
		err := g.db.Where("uid = ?", uid).Create(&MicroWebappOverride{
			Name:     app.Name,
			UID:      uid,
			Parent:   app.Parent,
			Manifest: mustToJson(app.Settings),
		}).Error
		if err != nil {
			return errors.Join(
				cerror.ErrOperationFailed,
				cerror.Warp(err, "init web app settings failed"),
			)
		}
		return nil
	} else if err == nil {
		// 更新
		existOverride.Manifest = mustToJson(deepMerge(mustToMap(existOverride.Manifest), app.Settings))
		existOverride.Parent = app.Parent
		err := g.db.Save(&existOverride).Error
		if err != nil {
			return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "update web app settings failed"))
		}
		return nil
	} else {
		return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "load web app settings failed"))
	}
}

func (g *GormImpl) BatchSetConfig(uid string, apps []*model.WebAppSettings) error {
	if !g.slock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.slock.Unlock()

	appsMap := listToMap(apps, func(app *model.WebAppSettings) string { return app.Name })

	// 1. 查询已存在的
	names := extractList(apps, func(app *model.WebAppSettings) string { return app.Name })
	var existOverrides []MicroWebappOverride
	err := g.db.Where("uid = ?", uid).Where("name IN ?", names).Find(&existOverrides).Error
	if err != nil {
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "load web app settings failed"),
		)
	}
	existOverrideMap := listToMap(
		existOverrides,
		func(override MicroWebappOverride) string { return override.Name },
	)
	existNames := extractList(
		existOverrides,
		func(override MicroWebappOverride) string { return override.Name },
	)

	// 2. 计算需要更新的和需要创建的
	var needChange []MicroWebappOverride
	for _, name := range names {
		if !sliceIn(name, existNames) {
			needChange = append(needChange, MicroWebappOverride{
				Name:     name,
				UID:      uid,
				Parent:   appsMap[name].Parent,
				Manifest: mustToJson(appsMap[name].Settings),
			})
		} else {
			rawApp := existOverrideMap[name]
			rawApp.Manifest = mustToJson(deepMerge(mustToMap(rawApp.Manifest), appsMap[name].Settings))
			rawApp.Parent = appsMap[name].Parent
			// 更新
			needChange = append(needChange, rawApp)
		}
	}

	fmt.Printf("%#v\n", needChange)

	// 3 开始创建和更新
	err = g.db.Transaction(func(tx *gorm.DB) error {
		for _, app := range needChange {
			if err := tx.Save(&app).Error; err != nil {
				return cerror.Warp(err, fmt.Sprintf("save web app settings failed : %s", app.Name))
			}
		}
		return nil
	})
	if err != nil {
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "batch update web app settings failed"),
		)
	}
	return nil
}

func (g *GormImpl) DeleteConfig(uid string, name string) error {
	if !g.slock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.slock.Unlock()
	err := g.db.Where("uid = ?", uid).
		Where("name = ?", name).
		Unscoped().
		Delete(&MicroWebappOverride{}).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 忽略不存在的问题
			return nil
		}
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "delete web app settings failed"),
		)
	}
	return nil
}

func (g *GormImpl) BatchDeleteConfig(uid string, names []string) error {
	if !g.slock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.slock.Unlock()
	err := g.db.Where("uid = ?", uid).
		Where("name IN ?", names).
		Unscoped().
		Delete(&MicroWebappOverride{}).
		Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 忽略不存在的问题
			return nil
		}
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "delete web app settings failed"),
		)
	}
	return nil
}

func (g *GormImpl) DeleteAllConfig(uid string) error {
	if !g.slock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.slock.Unlock()
	err := g.db.Where("uid = ?", uid).Unscoped().Delete(&MicroWebappOverride{}).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "delete web app settings failed"),
		)
	}
	return nil
}

func (g *GormImpl) LoadUserConfigs(uid string) ([]MicroWebappOverride, error) {
	var usettings []MicroWebappOverride
	err := g.db.Where("uid = ?", uid).Find(&usettings).Error
	if err != nil {
		return nil, errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(err, "load web app settings by user_id failed"),
		)
	}

	usettingMap := listToMap(usettings, func(m MicroWebappOverride) string { return m.Name })
	return mapToList(usettingMap), nil
}

// 添加 cache
func (g *GormImpl) loadUserConfigsCache(sid string) ([]MicroWebappOverride, error) {
	cacheKey := fmt.Sprintf("userConfigsCache.%s", sid)
	cacheTime := g.app.CommonConfig.PersistCacheTimeDuration()
	if data, ok := cache.Get(cacheKey); ok {
		return data.([]MicroWebappOverride), nil
	}

	nowData, err := g.LoadUserConfigs(sid)
	if err != nil {
		return nil, err
	}
	cache.Set(cacheKey, nowData, cacheTime)
	return nowData, nil
}

// mergeConfig 不处理Parent(Parent需要额外处理)
func (g *GormImpl) mergeConfig(uid string, apps map[string]model.WebApp) map[string]model.WebApp {
	keys := make([]string, 0, len(apps))
	for k := range apps {
		keys = append(keys, k)
	}

	var overrides []MicroWebappOverride
	err := g.db.Where("uid = ?", uid).Where("name IN ?", keys).Find(&overrides).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apps
		}
		return nil
	}

	for _, override := range overrides {
		app := apps[override.Name]
		app = mergeAppSettings(app, &override)
		apps[override.Name] = app
	}
	return apps
}
