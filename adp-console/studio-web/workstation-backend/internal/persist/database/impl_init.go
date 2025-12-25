package database

import (
	"errors"

	"workstation-backend/internal/cerror"

	"gorm.io/gorm"
)

// InitWebApps 初始化内建WebApps
func (g *GormImpl) initWebApps(apps []MicroWebappRecord) error {
	if !g.lock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.lock.Unlock()

	err := g.db.Unscoped().Where(MicroWebappRecord{Type: MicroWebappRecordTypeBuiltin}).Delete(&MicroWebappRecord{}).Error
	if err != nil {
		return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "delete before init web app failed"))
	}

	initApps := extractList(apps, func(i MicroWebappRecord) MicroWebappRecord {
		i.Type = MicroWebappRecordTypeBuiltin
		return i
	})

	err = g.db.CreateInBatches(&initApps, len(initApps)).Error
	if err != nil {
		return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "init web app failed"))
	}

	return nil
}

func (g *GormImpl) initWebAppConfig(acfg MicroWebappOverride) error {
	if !g.lock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.lock.Unlock()
	var existOverride MicroWebappOverride
	err := g.db.Where(MicroWebappOverride{Name: acfg.Name, UID: acfg.UID}).First(&existOverride).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 创建
			err := g.db.Create(&acfg).Error
			if err != nil {
				return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "init web app override failed"))
			}
			return nil
		}
		return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "init web app override failed"))
	} else {
		// 更新
		g.log.WithField("webapp", acfg.Name).WithField("uid", acfg.UID).Debug("web app already exist, will merge override")
		updateObj := MicroWebappOverride{
			Name:     acfg.Name,
			UID:      acfg.UID,
			Parent:   defaultTo(acfg.Parent, existOverride.Parent),
			Manifest: mustToJson(deepMerge(mustToMap(existOverride.Manifest), mustToMap(acfg.Manifest))),
		}
		err = g.db.Where("name = ?", acfg.Name).Where("uid = ?", acfg.UID).Updates(updateObj).Error
		if err != nil {
			return errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "init web app override failed"))
		}
		return nil
	}
}
