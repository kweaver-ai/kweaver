package rds

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/db"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

const CONF_TABLENAME = "t_automation_conf"

type ConfModel struct {
	Key   *string `gorm:"column:f_key;type:char(32);primary_key:not null" json:"key"`
	Value *string `gorm:"column:f_value;type:char(255)" json:"value"`
}

type ConfDao interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string) error
	ListConfigs(ctx context.Context, opt *Options) (configs []ConfModel, err error)
	BatchUpdateConfig(ctx context.Context, configs []*ConfModel) (err error)
}

type ConfDaoImpl struct {
	inner *gorm.DB
}

var (
	conf     ConfDao
	confOnce sync.Once
)

func NewConf() ConfDao {
	confOnce.Do(func() {
		conf = &ConfDaoImpl{
			inner: db.NewDB(),
		}
	})

	return conf
}

func (d *ConfDaoImpl) Get(ctx context.Context, key string) (value string, err error) {
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONF_TABLENAME))
	sql := "select f_value from t_automation_conf where f_key = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var m ConfModel
	err = d.inner.Raw(sql, key).Scan(&m).Error

	if err != nil {
		log.Warnf("[ConfDaoImpl.ConfDaoImpl] get failed: %s", err.Error())
		return
	}

	if m.Value != nil {
		value = *m.Value
	}

	return
}

func (d *ConfDaoImpl) Set(ctx context.Context, key string, value string) (err error) {
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONF_TABLENAME))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	d.inner.Transaction(func(tx *gorm.DB) error {

		var count int64
		sql := "select count(1) from t_automation_conf where f_key = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

		err = d.inner.Raw(sql, key).Scan(&count).Error

		if err != nil {
			log.Warnf("[ConfDaoImpl.Set] count err: %s", err.Error())
			return err
		}

		if count > 0 {
			sql = "update t_automation_conf set f_value = ? where f_key = ?"

			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
			result := tx.Exec(sql, value, key)
			if result.Error != nil {
				log.Warnf("[ConfDaoImpl.Set] set err: %s", err.Error())
				return result.Error
			}

			return nil
		}

		sql = "insert into t_automation_conf (f_key, f_value) values (?, ?)"

		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		result := tx.Exec(sql, key, value)

		if result.Error != nil {
			log.Warnf("[ConfDaoImpl.Set] insert err: %s", err.Error())
			return result.Error
		}

		return nil
	})

	return
}

// ListConfigs 获取所有配置
func (d *ConfDaoImpl) ListConfigs(ctx context.Context, opt *Options) (configs []ConfModel, err error) {
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONF_TABLENAME))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	sqlStr, searchSqlVal := opt.BuildQuery("SELECT f_key, f_value FROM t_automation_conf WHERE 1=1")
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sqlStr), attribute.String(trace.DB_QUERY, fmt.Sprintf("%v", searchSqlVal)))

	err = d.inner.Raw(sqlStr, searchSqlVal...).Scan(&configs).Error
	if err != nil {
		log.Warnf("[ConfDaoImpl.ListConfigs] list failed, detail: %s", err.Error())
	}
	return
}

// BatchUpdateConfig 批量更新配置
func (d *ConfDaoImpl) BatchUpdateConfig(ctx context.Context, configs []*ConfModel) (err error) {
	if len(configs) == 0 {
		return nil
	}

	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONF_TABLENAME))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	tx := d.inner.Begin()
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	var keys []interface{}
	for _, data := range configs {
		keys = append(keys, *data.Key)
	}
	sqlStr := "DELETE FROM t_automation_conf WHERE f_key IN ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sqlStr), attribute.String(trace.DB_QUERY, fmt.Sprintf("%v", keys)))
	err = tx.Exec(sqlStr, keys).Error
	if err != nil {
		log.Warnf("[ConfDaoImpl.BatchUpdateConfig] delete failed, detail: %s", err.Error())
		return err
	}

	sqlStr = "INSERT INTO t_automation_conf (f_key, f_value) VALUES "
	values := make([]interface{}, 0, len(configs)*2)
	for _, data := range configs {
		sqlStr += "(?, ?),"
		values = append(values, data.Key, data.Value)
	}

	sqlStr = sqlStr[:len(sqlStr)-1]
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sqlStr), attribute.String(trace.DB_Values, fmt.Sprintf("%v", values)))
	err = tx.Exec(sqlStr, values...).Error
	if err != nil {
		log.Warnf("[ConfDaoImpl.BatchUpdateConfig] insert failed, detail: %s", err.Error())
		return err
	}

	err = tx.Commit().Error
	return err
}
