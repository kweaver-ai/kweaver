package database

import (
	"errors"
	"fmt"
	"strings"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"

	"gorm.io/gorm"
)

func (g *GormImpl) BatchRegister(apps map[string]model.WebApp) error {
	if !g.lock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.lock.Unlock()

	var records []MicroWebappRecord
	for name, app := range apps {
		records = append(records, MicroWebappRecord{
			Name:     name,
			Parent:   app.Parent,
			Type:     app.Type,
			Manifest: mustToJson(app.Manifest),
		})
	}

	err := g.db.CreateInBatches(&records, 10).Error
	if err != nil {
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(g.replaceKnownError(err), "save web app failed"),
		)
	}

	return nil
}

func (g *GormImpl) BatchUnregister(names []string, allowTypes []string) error {
	if !g.lock.TryLock() {
		return cerror.ErrLockFailed
	}
	defer g.lock.Unlock()

	// inline 不能直接删除
	apps, err := g.onlyReadIgnore(names)
	if err != nil {
		return err
	}
	cannotDeleteApps := make(map[string]string, 0)
	for _, app := range apps {
		if !sliceIn(app.Type, allowTypes) {
			cannotDeleteApps[app.Name] = fmt.Sprintf("app %s type %s is not allowed to be unregistered, allowed: %v", app.Name, app.Type, allowTypes)
		}
	}
	if len(cannotDeleteApps) > 0 {
		infos := make([]string, 0, len(cannotDeleteApps))
		for _, info := range cannotDeleteApps {
			infos = append(infos, info)
		}
		return cerror.Warp(
			cerror.ErrOperationFailed,
			strings.Join(infos, "\n"),
		)
	}

	var allDelAppNames []string

	for _, app := range apps {
		name := app.Name
		childrends, err := g.loadChildrens(name, false, "", true)
		if err != nil {
			return err
		}
		toDelAppNames := make([]string, 0, len(childrends)+1)
		toDelAppNames = append(toDelAppNames, name)
		for _, children := range childrends {
			toDelAppNames = append(toDelAppNames, children.Name)
		}
		allDelAppNames = append(allDelAppNames, toDelAppNames...)
	}

	if len(allDelAppNames) == 0 {
		g.log.WithField("webapp", names).Debug("web app not exist")
		return nil
	}

	g.log.WithField("webapp", names).
		WithField("condition in", allDelAppNames).
		Debug("start delete web apps")
	rel := g.db.Unscoped().Where("name in ?", allDelAppNames).Delete(&MicroWebappRecord{})
	if rel.Error != nil && !errors.Is(rel.Error, gorm.ErrRecordNotFound) {
		return errors.Join(
			cerror.ErrOperationFailed,
			cerror.Warp(rel.Error, "delete web apps failed"),
		)
	}
	g.log.WithField("webapp", names).
		WithField("affected", rel.RowsAffected).
		Debug("delete web apps success")
	return nil
}

func (g *GormImpl) onlyReadIgnore(names []string) ([]MicroWebappRecord, error) {
	var rels []MicroWebappRecord
	err := g.db.Where("name in ?", names).Find(&rels).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return rels, nil
		}
		return nil, errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "load web apps failed"))
	}
	return rels, nil
}

func (g *GormImpl) List() ([]model.WebApp, error) {
	var rels []model.WebApp
	var data []MicroWebappRecord
	err := g.db.Find(&data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return rels, nil
		}
		return nil, errors.Join(cerror.ErrOperationFailed, cerror.Warp(err, "list raw web apps failed"))
	}
	return extractList(data, func(d MicroWebappRecord) model.WebApp {
		return model.WebApp{
			Name:     d.Name,
			Parent:   d.Parent,
			Inline:   d.Type == MicroWebappRecordTypeInline,
			Type:     d.Type,
			Manifest: mustToMap(d.Manifest),
		}
	}), nil
}
