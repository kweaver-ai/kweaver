package database_test

import (
	"testing"

	"workstation-backend/internal/model"
	"workstation-backend/internal/persist"

	"github.com/stretchr/testify/assert"
)

func TestLoadRootApp(t *testing.T) {
	impl := sqliteDBImpl(t)
	apps, err := impl.Load(persist.LoadParams{Name: "root"}) // 不附加配置
	{
		assert.Equal(t, nil, err)
		assert.Equal(t, 1, len(apps))
	}
	app := apps["root"]
	{
		type m = map[string]any
		root_app := model.WebApp{
			Name:   "root",
			Parent: "",
			Inline: false,
			Type:   model.WebAppTypeBuiltin,
			Manifest: m{
				"name":       "root",
				"app":        m{},
				"subapp":     m{},
				"orderIndex": float64(0),
				"parent":     "",
			},
		}
		assert.Equal(t, root_app, app)
	}
}

func TestSaveNormalApp(t *testing.T) {
	impl := sqliteDBImpl(t)
	type m = map[string]any
	raw_app1 := model.WebApp{
		Name:   "app1",
		Parent: "root",
		Inline: false,
		Type:   model.WebAppTypeNormal,
		Manifest: m{
			"name":   "app1",
			"app":    m{},
			"subapp": m{},
			"parent": "settings",
		},
	}
	err1 := impl.BatchRegister(map[string]model.WebApp{"app1": raw_app1})
	{
		assert.Equal(t, nil, err1)
	}

	apps, err2 := impl.Load(persist.LoadParams{Name: "root"})
	{
		assert.Equal(t, nil, err2)
		assert.Equal(t, 2, len(apps))
	}
	app1 := apps["app1"]
	{
		assert.Equal(t, raw_app1, app1)
	}
}

func TestDeleteApp(t *testing.T) {
	impl := sqliteDBImpl(t)
	err1 := impl.BatchUnregister([]string{"root"}, []string{model.WebAppTypeNormal})
	{
		assert.ErrorContains(t, err1, "app root type builtin is not allowed to be unregistered")
	}
	apps, err2 := impl.Load(persist.LoadParams{Name: "root"})
	{
		assert.Equal(t, 1, len(apps))
		assert.ErrorIs(t, nil, err2)
	}
}
