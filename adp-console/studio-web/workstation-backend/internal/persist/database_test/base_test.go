package database_test

import (
	"testing"

	"workstation-backend/internal/config"
	"workstation-backend/internal/persist/database"

	"github.com/glebarez/sqlite"
	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func sqliteDBImpl(t *testing.T) *database.GormImpl {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal("init gorm failed")
	}
	tl := logrus.New().WithField("test", "sqlite")
	impl := database.NewGormWithDB(&config.AppConfig{}, db, tl)
	err = impl.InitDatabase()
	if err != nil {
		t.Fatal("init database failed")
	}
	return impl
}

func TestCheck(t *testing.T) {
	// t.SkipNow()
	impl := sqliteDBImpl(t)
	err := impl.Check()
	assert.Equal(t, nil, err)
}
