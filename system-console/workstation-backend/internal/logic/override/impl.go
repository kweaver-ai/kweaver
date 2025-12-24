package override

import (
	"errors"

	"workstation-backend/internal/cerror"
	"workstation-backend/internal/model"
)

func (o *OverrideLogic) GetConfig(uid, name string) (Config, error) {
	cfgs, err := o.operator.GetConfig(uid, name)
	if err != nil {
		if errors.Is(err, cerror.ErrRecordNotFound) {
			return nil, cerror.NewError(
				cerror.CodeNotFoundError,
				"webapp config not found",
				err.Error(),
			)
		}
		return nil, err
	}
	return cfgs.Settings, err
}

func (o *OverrideLogic) BatchGetConfig(uid string, names []string) (map[string]Config, error) {
	cfgs, err := o.operator.BatchGetConfig(uid, names)
	if err != nil {
		if errors.Is(err, cerror.ErrRecordNotFound) {
			return nil, cerror.NewError(
				cerror.CodeNotFoundError,
				"webapp config not found",
				err.Error(),
			)
		}
		return nil, err
	}
	return extractMap(cfgs, func(_ string, v *model.WebAppSettings) Config {
		return v.Settings
	}), err
}

func (o *OverrideLogic) DeleteConfig(uid, name string) error {
	if name == "*" {
		return o.operator.DeleteAllConfig(uid)
	}
	return o.operator.DeleteConfig(uid, name)
}

func (o *OverrideLogic) BatchDeleteConfig(uid string, names []string) error {
	return o.operator.BatchDeleteConfig(uid, names)
}

func (o *OverrideLogic) SetConfig(uid, name string, cfg Config) error {
	obj := &model.WebAppSettings{Name: name, Settings: cfg}
	obj = obj.CompleteParent()
	isInline, err := o.operator.IsInlineWebApp(name)
	if err != nil {
		if errors.Is(err, cerror.ErrRecordNotFound) {
			return cerror.NewError(cerror.CodeNotFoundError, "webapp not found", err.Error())
		}
		return err
	}
	if obj.Parent != "" && isInline {
		// inLineApp不能更改Parent
		return cerror.NewError(cerror.CodeParamsInvalidError, "inLineApp can not change parent", "")
	}
	if obj.Parent == obj.Name {
		// 不能更改parent为自己
		return cerror.NewError(cerror.CodeParamsInvalidError, "can not change parent to self", "")
	}
	return o.operator.SetConfig(uid, obj)
}

func (o *OverrideLogic) BatchSetConfig(uid string, cfgs map[string]Config) error {
	objs := mapToList(cfgs, func(name string, cfg Config) *model.WebAppSettings {
		obj := &model.WebAppSettings{Name: name, Settings: cfg}
		obj.CompleteParent()
		return obj
	})

	for _, obj := range objs {
		isInline, err := o.operator.IsInlineWebApp(obj.Name)
		if err != nil {
			if errors.Is(err, cerror.ErrRecordNotFound) {
				return cerror.NewError(cerror.CodeNotFoundError, "webapp not found", err.Error())
			}
			return err
		}
		if obj.Parent != "" && isInline {
			// inLineApp不能更改Parent
			return cerror.NewError(
				cerror.CodeParamsInvalidError,
				"inLineApp can not change parent",
				obj.Name,
			)
		}
		if obj.Parent == obj.Name {
			// 不能更改parent为自己
			return cerror.NewError(
				cerror.CodeParamsInvalidError,
				"can not change parent to self",
				obj.Name,
			)
		}
	}

	return o.operator.BatchSetConfig(uid, objs)
}
