package rds

import (
	"context"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/db"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

const DAG_INSTANCE_EXT_DATA_TABLE = "t_automation_dag_instance_ext_data"

type DagInstanceExtData struct {
	ID        string `gorm:"column:f_id;primary_key:not null" json:"id" bson:"_id"`
	CreatedAt int64  `gorm:"column:f_created_at;type:bigint" json:"createdAt" bson:"createdAt"`
	UpdatedAt int64  `gorm:"column:f_updated_at;type:bigint" json:"updatedAt" bson:"updatedAt"`
	DagID     string `gorm:"column:f_dag_id;type:varchar(64)" json:"dagId" bson:"dagId"`
	DagInsID  string `gorm:"column:f_dag_ins_id;type:varchar(64)" json:"dagInsId" bson:"dagInsId"`
	Field     string `gorm:"column:f_field;type:varchar(64)" json:"field" bson:"field"`
	OssID     string `gorm:"column:f_oss_id;type:varchar(64)" json:"ossId" bson:"ossId"`
	OssKey    string `gorm:"column:f_oss_key;type:varchar(255)" json:"ossKey" bson:"ossKey"`
	Size      int64  `gorm:"column:f_size;type:bigint" json:"size" bson:"size"`
	Removed   bool   `gorm:"column:f_removed;type:tinyint(1)" json:"removed" bson:"removed"`
}

type ExtDataQueryOptions struct {
	IDs         []string
	DagID       string
	DagInsID    string
	Removed     bool
	Limit       int
	MinID       string
	SelectField []string
}

type DagInstanceExtDataDao interface {
	InsertMany(ctx context.Context, items []*DagInstanceExtData) error
	List(ctx context.Context, opts *ExtDataQueryOptions) ([]*DagInstanceExtData, error)
	Remove(ctx context.Context, opts *ExtDataQueryOptions) error
	Delete(ctx context.Context, opts *ExtDataQueryOptions) error
}

var (
	dagInstanceExtDataDaoIns  DagInstanceExtDataDao
	dagInstanceExtDataDaoOnce sync.Once
)

type dagInstanceExtDataDao struct {
	db *gorm.DB
}

func NewDagInstanceExtDataDao() DagInstanceExtDataDao {
	dagInstanceExtDataDaoOnce.Do(func() {
		dagInstanceExtDataDaoIns = &dagInstanceExtDataDao{
			db.NewDB(),
		}
	})
	return dagInstanceExtDataDaoIns
}

func (d *dagInstanceExtDataDao) InsertMany(ctx context.Context, items []*DagInstanceExtData) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = d.db.Transaction(func(tx *gorm.DB) error {
		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))
		sql := "insert into t_automation_dag_instance_ext_data (f_id, f_created_at, f_updated_at, f_dag_id, f_dag_ins_id, f_field, f_oss_id, f_oss_key, f_size, f_removed) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

		for _, item := range items {
			result := tx.Exec(sql,
				item.ID,
				item.CreatedAt,
				item.UpdatedAt,
				item.DagID,
				item.DagInsID,
				item.Field,
				item.OssID,
				item.OssKey,
				item.Size,
				item.Removed)

			if result.Error != nil {
				log.Warnf("[dagInstanceExtDataDao.Create] create failed: %s", result.Error.Error())
				return result.Error
			}
		}

		return nil
	})

	return err
}

func (d *dagInstanceExtDataDao) List(ctx context.Context, opts *ExtDataQueryOptions) ([]*DagInstanceExtData, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))

	var results []*DagInstanceExtData
	selectFields := "f_id, f_created_at, f_updated_at, f_dag_id, f_dag_ins_id, f_field, f_oss_id, f_oss_key, f_size, f_removed"
	if len(opts.SelectField) > 0 {
		selectFields = ""
		for i, field := range opts.SelectField {
			if i > 0 {
				selectFields += ", "
			}
			selectFields += field
		}
	}
	baseSQL := "SELECT " + selectFields + " FROM t_automation_dag_instance_ext_data WHERE f_removed = ?"
	args := []interface{}{opts.Removed}

	if len(opts.IDs) > 0 {
		baseSQL += " AND f_id IN ?"
		args = append(args, opts.IDs)
	}
	if opts.DagID != "" {
		baseSQL += " AND f_dag_id = ?"
		args = append(args, opts.DagID)
	}
	if opts.DagInsID != "" {
		baseSQL += " AND f_dag_ins_id = ?"
		args = append(args, opts.DagInsID)
	}

	if opts.MinID != "" {
		baseSQL += " AND f_id > ?"
		args = append(args, opts.MinID)
	}

	baseSQL += " ORDER BY f_id ASC"

	if opts.Limit > 0 {
		baseSQL += " LIMIT ?"
		args = append(args, opts.Limit)
	}

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, baseSQL))
	err = d.db.Raw(baseSQL, args...).Scan(&results).Error
	if err != nil {
		log.Warnf("[dagInstanceExtDataDao.List] query failed: %s", err.Error())
		return nil, err
	}

	return results, nil
}

func (d *dagInstanceExtDataDao) Remove(ctx context.Context, opts *ExtDataQueryOptions) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))

	err = d.db.Transaction(func(tx *gorm.DB) error {
		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))
		sql := "UPDATE t_automation_dag_instance_ext_data SET f_removed = ?, f_updated_at = ? WHERE f_removed = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

		batchSize := 1000
		updatedAt := time.Now().Unix()

		if len(opts.IDs) > 0 {
			for i := 0; i < len(opts.IDs); i += batchSize {
				end := i + batchSize
				if end > len(opts.IDs) {
					end = len(opts.IDs)
				}
				batch := opts.IDs[i:end]

				result := tx.Exec(sql+" AND f_id IN ?",
					true, updatedAt, false, batch)
				if result.Error != nil {
					log.Warnf("[dagInstanceExtDataDao.Remove] batch update failed: %s", result.Error.Error())
					return result.Error
				}
			}
			return nil
		}

		where := ""
		args := []interface{}{true, updatedAt, false}
		if opts.DagID != "" {
			where += " AND f_dag_id = ?"
			args = append(args, opts.DagID)
		}
		if opts.DagInsID != "" {
			where += " AND f_dag_ins_id = ?"
			args = append(args, opts.DagInsID)
		}

		for {
			result := tx.Exec(sql+where+" LIMIT ?",
				append(args, batchSize)...)
			if result.Error != nil {
				log.Warnf("[dagInstanceExtDataDao.Remove] batch update failed: %s", result.Error.Error())
				return result.Error
			}
			if result.RowsAffected < int64(batchSize) {
				break
			}
		}

		return nil
	})

	return err
}

func (d *dagInstanceExtDataDao) Delete(ctx context.Context, opts *ExtDataQueryOptions) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))

	err = d.db.Transaction(func(tx *gorm.DB) error {
		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EXT_DATA_TABLE))
		sql := "DELETE FROM t_automation_dag_instance_ext_data WHERE 1=1"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

		batchSize := 1000

		if len(opts.IDs) > 0 {
			for i := 0; i < len(opts.IDs); i += batchSize {
				end := i + batchSize
				if end > len(opts.IDs) {
					end = len(opts.IDs)
				}
				batch := opts.IDs[i:end]

				result := tx.Exec(sql+" AND f_id IN ?", batch)
				if result.Error != nil {
					log.Warnf("[dagInstanceExtDataDao.Delete] batch delete failed: %s", result.Error.Error())
					return result.Error
				}
			}
			return nil
		}

		where := ""
		args := []interface{}{}
		if opts.DagID != "" {
			where += " AND f_dag_id = ?"
			args = append(args, opts.DagID)
		}
		if opts.DagInsID != "" {
			where += " AND f_dag_ins_id = ?"
			args = append(args, opts.DagInsID)
		}

		for {
			result := tx.Exec(sql+where+" LIMIT ?",
				append(args, batchSize)...)
			if result.Error != nil {
				log.Warnf("[dagInstanceExtDataDao.Delete] batch delete failed: %s", result.Error.Error())
				return result.Error
			}
			if result.RowsAffected < int64(batchSize) {
				break
			}
		}

		return nil
	})

	return err
}

var _ DagInstanceExtDataDao = (*dagInstanceExtDataDao)(nil)
