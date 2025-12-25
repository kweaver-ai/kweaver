package persist

import (
	"workstation-backend/internal/model"
)

type WebAppPersist interface {
	// 注册与注销
	BatchRegister(apps map[string]model.WebApp) error
	BatchUnregister(names []string, allowTypes []string) error
	List() ([]model.WebApp, error)
}

type WebAppOverridePersist interface {
	// 查询
	GetConfig(uid, name string) (*model.WebAppSettings, error)
	BatchGetConfig(uid string, names []string) (map[string]*model.WebAppSettings, error)
	// 设置
	SetConfig(uid string, app *model.WebAppSettings) error
	BatchSetConfig(uid string, apps []*model.WebAppSettings) error
	// 删除
	DeleteConfig(uid, name string) error
	DeleteAllConfig(uid string) error
	BatchDeleteConfig(uid string, names []string) error
}

type WebAppToolsPersist interface {
	IsInlineWebApp(name string) (bool, error)
	LoadParentNames(name string) ([]string, error)
	LoadChildrenNames(name string) ([]string, error)
	Check() error
}

type WebAppComplexPersist interface {
	Load(param LoadParams) (map[string]model.WebApp, error)
	RootPath(name string) (string, error)
}

type Persist interface {
	WebAppPersist
	WebAppComplexPersist
	WebAppOverridePersist
	WebAppToolsPersist
}

type LoadParams struct {
	Name       string
	Sid        string // 设置ID
	WithMoved  bool   // 是否附加移动的WebApp
	WithSetted bool   // 是否附加设置的WebApp
}
