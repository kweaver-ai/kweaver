package webapp

import (
	"errors"
	"fmt"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"
	"workstation-backend/internal/persist"
)

func (l *WebappLogic) RegisterApp(
	name string,
	manifest Manifest,
	deleteBefore bool,
) (Manifest, error) {
	return l.registerAppByType(name, manifest, deleteBefore, model.WebAppTypeNormal)
}

func (l *WebappLogic) CreateCustomApp(
	name string,
	manifest Manifest,
	deleteBefore bool,
) (Manifest, error) {
	return l.registerAppByType(name, manifest, deleteBefore, model.WebAppTypeCustom)
}

func (l *WebappLogic) registerAppByType(
	name string,
	manifest Manifest,
	deleteBefore bool,
	_type string,
) (Manifest, error) {
	err := ValidManifest(manifest)
	if err != nil {
		return nil, cerror.NewError(
			cerror.CodeParamsInvalidError,
			"manifest check falied",
			err.Error(),
		)
	}

	apps, err := GenerateWebapps([]Manifest{manifest}, _type)
	if err != nil {
		return nil, cerror.NewError(
			cerror.CodeParamsInvalidError,
			"body data parse failed",
			err.Error(),
		)
	}
	err = CheckManifest([]Manifest{manifest})
	if err != nil {
		return nil, cerror.NewError(
			cerror.CodeParamsInvalidError,
			"manifest check failed",
			err.Error(),
		)
	}
	if name != manifest["name"].(string) {
		return nil, cerror.NewError(
			cerror.CodeParamsInvalidError,
			"name not match",
			"name must is manifest name",
		)
	}
	if deleteBefore {
		err = l.operator.BatchUnregister([]string{name}, []string{_type})
		if err != nil {
			return nil, err
		}
	}
	return nil, l.operator.BatchRegister(apps)
}

func (l *WebappLogic) QueryApp(params QueryWebAppParams) (Manifest, error) {
	// 预处理参数
	if params.Name == "plugins" {
		params.WithAuthed = false // plugins 默认不处理授权
	}

	apps, err := l.operator.Load(persist.LoadParams{
		Name:       params.Name,
		Sid:        params.Sid,
		WithMoved:  params.WithMoved,
		WithSetted: params.WithSetted,
	})
	if err != nil {
		if errors.Is(err, cerror.ErrRecordNotFound) {
			return nil, cerror.NewError(cerror.CodeNotFoundError, "webapp not found", err.Error())
		}
		return nil, err
	}

	authorizedApps := apps
	// plugins 查询特化，不会处理授权
	if params.WithAuthed {
		// 使用 uid 查询授权
		authorizedIDs, err := l.authCli.ResourceList(params.Uid)
		if err != nil {
			return nil, err
		}
		// l.log.WithField("authBefore", apps).Debug("query app result before auth")
		authorizedApps, err = l.generateAuthorizedApps(apps, authorizedIDs)
		if err != nil {
			return nil, err
		}
		// l.log.WithField("authAfter", authorizedApps).Debug("query app result after auth")
	}

	pathname, err := l.operator.RootPath(params.Name)
	if err != nil {
		return nil, fmt.Errorf("get webapp root path failed: %w", err)
	}

	if len(authorizedApps) == 0 {
		return nil, cerror.NewError(
			cerror.CodeNotFoundError,
			"authorized webapp not found",
			"authorized webapp len is 0",
		)
	}
	return MakeManifest(params.Name, authorizedApps, pathname)
}

func (l *WebappLogic) BatchRegisterApps(manifests []Manifest, deleteBefore bool) error {
	err := ValidManifests(manifests)
	if err != nil {
		return cerror.NewError(cerror.CodeParamsInvalidError, "manifest check falied", err.Error())
	}

	apps, err := GenerateWebapps(manifests, model.WebAppTypeNormal)
	if err != nil {
		return cerror.NewError(cerror.CodeParamsInvalidError, "body data parse failed", err.Error())
	}
	err = CheckManifest(manifests)
	if err != nil {
		return cerror.NewError(cerror.CodeParamsInvalidError, "manifest check failed", err.Error())
	}

	if deleteBefore {
		mnames := make([]string, 0, len(manifests))
		for _, manifest := range manifests {
			mnames = append(mnames, manifest["name"].(string))
		}
		err = l.operator.BatchUnregister(mnames, []string{model.WebAppTypeNormal})
		if err != nil {
			return err
		}
	}

	return l.operator.BatchRegister(apps)
}

func (l *WebappLogic) BatchUnregisterApps(apps []string) error {
	return l.operator.BatchUnregister(apps, []string{model.WebAppTypeNormal})
}

func (l *WebappLogic) DeleteCustomApps(apps []string) error {
	return l.operator.BatchUnregister(apps, []string{model.WebAppTypeCustom})
}

// 排除未授权的应用
// 授权的应用：直接父级，和子集
func (l *WebappLogic) generateAuthorizedApps(
	apps map[string]model.WebApp,
	authorizedIDs []string,
) (map[string]model.WebApp, error) {
	for _, authorizedID := range authorizedIDs {
		if authorizedID == "*" {
			// 如果 * 拥有权限，则返回所有应用
			return apps, nil
		}
	}
	authorizedApps := make(map[string]struct{})
	for _, authorizedID := range authorizedIDs {
		ps, err := l.operator.LoadParentNames(authorizedID)
		if err != nil {
			return nil, err
		}
		for _, p := range ps {
			authorizedApps[p] = struct{}{}
		}
		// 授权包含子级
		cs, err := l.operator.LoadChildrenNames(authorizedID)
		if err != nil {
			return nil, err
		}
		for _, c := range cs {
			authorizedApps[c] = struct{}{}
		}
		authorizedApps[authorizedID] = struct{}{}
	}
	for name := range apps {
		if _, ok := authorizedApps[name]; !ok {
			delete(apps, name)
		}
	}
	return apps, nil
}

func (l *WebappLogic) ListRawApp() ([]model.WebApp, error) {
	return l.operator.List()
}
