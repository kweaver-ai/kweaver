package database

import (
	"database/sql"
	"errors"
	"os"
	"sync"
	"time"

	"workstation-backend/internal/config"
	"workstation-backend/internal/persist"

	_ "github.com/AISHU-Technology/proton-rds-sdk-go/driver"
	dmdriver "workstation-backend/pkg/dialect/dm"
	kdbdriver "workstation-backend/pkg/dialect/kdb"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type GormImpl struct {
	db          *gorm.DB
	lock, slock sync.Mutex
	log         logrus.FieldLogger
	app         *config.AppConfig
}

var _ persist.Persist = (*GormImpl)(nil)

func NewGorm(app *config.AppConfig, log logrus.FieldLogger) *GormImpl {
	operation, err := sql.Open("proton-rds", app.DatabaseConfig.DSN())
	if err != nil {
		log.WithError(err).Fatal("init gorm failed: open dns failed")
	}
	var dial gorm.Dialector
	switch app.DatabaseConfig.TYPE {
	case "DM8":
		dial = dmdriver.New(dmdriver.Config{Conn: operation})
	case "KDB9":
		dial = kdbdriver.New(kdbdriver.Config{Conn: operation})
	default:
		dial = mysql.New(mysql.Config{Conn: operation})
	}

	db, err := gorm.Open(dial, &gorm.Config{})
	if err != nil {
		log.WithError(err).Fatal("init gorm failed")
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.WithError(err).Fatal("failed to  get sql.DB")
	}

	sqlDB.SetMaxIdleConns(app.DatabaseConfig.MaxIdleConns)
	sqlDB.SetMaxOpenConns(app.DatabaseConfig.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(app.DatabaseConfig.ConnMaxLifetime) * time.Minute)
	sqlDB.SetConnMaxIdleTime(time.Duration(app.DatabaseConfig.ConnMaxIdleTime) * time.Minute)

	// 日志打印连接池状态

	if app.LogConfig.EnableSQL {
		log.Info("enable sql log")
		db = db.Debug()
	}
	return NewGormWithDB(app, db, log)
}

func NewGormWithDB(app *config.AppConfig, db *gorm.DB, log logrus.FieldLogger) *GormImpl {
	return &GormImpl{db: db, log: log, app: app}
}

func (g *GormImpl) InitDatabase() error {
	// init 初始化表
	err := createTable(g.db, &MicroWebappRecord{}, &MicroWebappOverride{})
	if err != nil {
		g.log.WithError(err).Error("craete table failed")
		return err
	}
	// init 初始化内建WebApp菜单
	err = g.initWebApps(generateBuiltinApps())
	if err != nil {
		g.log.WithError(err).Error("init webapp failed")
		return err
	}
	// init 按需初始化内建WebApp菜单配置
	if product := os.Getenv("INIT_PRODUCT_CONFIG"); product != "" {
		errs := make([]error, 0)
		for _, acfg := range generateBuiltinConfigs(g.app.CommonConfig.GlobalSID, product) {
			errs = append(errs, g.initWebAppConfig(acfg))
		}
		err = errors.Join(errs...)
		if err != nil {
			g.log.WithError(err).Fatal("init webapp override failed")
			return err
		}
	}
	// init end
	return nil
}

// 人大金仓数据库无法重复创建表
func createTable(db *gorm.DB, models ...any) error {
	var errs []error
	for _, model := range models {
		if !db.Migrator().HasTable(model) {
			errs = append(errs, db.Migrator().CreateTable(model))
		}
	}
	return errors.Join(errs...)
}
