package rds

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/db"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

const DAG_INSTANCE_EVENT_TABLE = "t_dag_instance_event"

type DagInstanceEventType uint8

const (
	DagInstanceEventTypeVariable     DagInstanceEventType = 1 // 变量变化
	DagInstanceEventTypeTaskStatus   DagInstanceEventType = 2 // 状态变化
	DagInstanceEventTypeInstructions DagInstanceEventType = 3 // VM 指令
	DagInstanceEventTypeVM           DagInstanceEventType = 4 // VM 其它数据
	DagInstanceEventTypeTrace        DagInstanceEventType = 5 // 节点trace变更
)

type DagInstanceEventVisibility uint8

const (
	DagInstanceEventVisibilityPrivate = 0
	DagInstanceEventVisibilityPublic  = 1
)

type DagInstanceEvent struct {
	ID         uint64                     `gorm:"column:f_id" json:"id,omitempty"`
	Type       DagInstanceEventType       `gorm:"column:f_type" json:"type,omitempty"`
	InstanceID string                     `gorm:"column:f_instance_id" json:"instance_id,omitempty"`
	Operator   string                     `gorm:"column:f_operator" json:"operator,omitempty"`
	TaskID     string                     `gorm:"column:f_task_id" json:"task_id,omitempty"`
	Status     string                     `gorm:"column:f_status" json:"status,omitempty"`
	Name       string                     `gorm:"column:f_name" json:"name,omitempty"`
	Data       string                     `gorm:"column:f_data" json:"data,omitempty"`
	Size       int                        `gorm:"column:f_size" json:"size,omitempty"`
	Inline     bool                       `gorm:"column:f_inline" json:"inline,omitempty"`
	Visibility DagInstanceEventVisibility `gorm:"column:f_visibility" json:"visibility,omitempty"`
	Timestamp  int64                      `gorm:"column:f_timestamp" json:"timestamp,omitempty"`
}

type DagInstanceEventField string

const (
	DagInstanceEventFieldID         DagInstanceEventField = "f_id"
	DagInstanceEventFieldType       DagInstanceEventField = "f_type"
	DagInstanceEventFieldInstanceID DagInstanceEventField = "f_instance_id"
	DagInstanceEventFieldOperator   DagInstanceEventField = "f_operator"
	DagInstanceEventFieldTaskID     DagInstanceEventField = "f_task_id"
	DagInstanceEventFieldStatus     DagInstanceEventField = "f_status"
	DagInstanceEventFieldName       DagInstanceEventField = "f_name"
	DagInstanceEventFieldData       DagInstanceEventField = "f_data"
	DagInstanceEventFieldSize       DagInstanceEventField = "f_size"
	DagInstanceEventFieldInline     DagInstanceEventField = "f_inline"
	DagInstanceEventFieldTimestamp  DagInstanceEventField = "f_timestamp"
	DagInstanceEventFieldVisibility DagInstanceEventField = "f_visibility"
)

var (
	DagInstanceEventFieldAll = []DagInstanceEventField{
		DagInstanceEventFieldID,
		DagInstanceEventFieldType,
		DagInstanceEventFieldInstanceID,
		DagInstanceEventFieldOperator,
		DagInstanceEventFieldTaskID,
		DagInstanceEventFieldStatus,
		DagInstanceEventFieldName,
		DagInstanceEventFieldData,
		DagInstanceEventFieldSize,
		DagInstanceEventFieldInline,
		DagInstanceEventFieldTimestamp,
		DagInstanceEventFieldVisibility,
	}
	DagInstanceEventFieldPublic = []DagInstanceEventField{
		DagInstanceEventFieldType,
		DagInstanceEventFieldOperator,
		DagInstanceEventFieldTaskID,
		DagInstanceEventFieldStatus,
		DagInstanceEventFieldName,
		DagInstanceEventFieldData,
		DagInstanceEventFieldSize,
		DagInstanceEventFieldInline,
		DagInstanceEventFieldTimestamp,
	}
)

type DagInstanceEventListOptions struct {
	DagInstanceID string
	Offset        int
	Limit         int
	Visibilities  []DagInstanceEventVisibility
	Types         []DagInstanceEventType
	Fields        []DagInstanceEventField
	Names         []string
	Inline        *bool
	LatestOnly    bool
}

type DagInstanceEventRepository interface {
	InsertMany(ctx context.Context, events []*DagInstanceEvent) error
	List(ctx context.Context, opts *DagInstanceEventListOptions) ([]*DagInstanceEvent, error)
	ListCount(ctx context.Context, opts *DagInstanceEventListOptions) (int, error)
	DeleteByInstanceIDs(ctx context.Context, instanceIDs []string) error
}

type dagInstanceEventRepository struct {
	db *gorm.DB
}

var (
	dagInstanceEventRepositoryOnce sync.Once
	dagInstanceEventRepositoryIns  DagInstanceEventRepository
)

func NewDagInstanceEventRepository() DagInstanceEventRepository {
	dagInstanceEventRepositoryOnce.Do(func() {
		dagInstanceEventRepositoryIns = &dagInstanceEventRepository{
			db: db.NewDB(),
		}
	})
	return dagInstanceEventRepositoryIns
}

func (d *dagInstanceEventRepository) InsertMany(ctx context.Context, events []*DagInstanceEvent) (err error) {
	if len(events) == 0 {
		return nil
	}
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EVENT_TABLE))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	sqlStr := "INSERT INTO t_dag_instance_event (f_id, f_type, f_instance_id, f_operator, f_task_id, f_status, f_name, f_data, f_size, f_inline, f_visibility, f_timestamp) VALUES "
	values := make([]interface{}, 0, len(events)*12)
	for _, e := range events {
		sqlStr += "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?),"
		values = append(values, e.ID, e.Type, e.InstanceID, e.Operator, e.TaskID, e.Status, e.Name, e.Data, e.Size, e.Inline, e.Visibility, e.Timestamp)
	}
	sqlStr = strings.TrimRight(sqlStr, ",")
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sqlStr), attribute.String(trace.DB_Values, fmt.Sprintf("%v", values)))

	result := d.db.Exec(sqlStr, values...)
	if result.Error != nil {
		log.Warnf("[DagInstanceEventRepository.InsertMany] insert err: %s", result.Error.Error())
		err = result.Error
	}

	return err
}

func (d *dagInstanceEventRepository) ListCount(ctx context.Context, opts *DagInstanceEventListOptions) (int, error) {
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EVENT_TABLE))
	defer func() { trace.TelemetrySpanEnd(span, nil) }()
	log := traceLog.WithContext(newCtx)

	var args []interface{}
	where := " WHERE f_instance_id = ?"
	args = append(args, opts.DagInstanceID)

	if len(opts.Names) > 0 {
		where += " AND f_name IN ?"
		args = append(args, opts.Names)
	}
	if len(opts.Types) > 0 {
		where += " AND f_type IN ?"
		args = append(args, opts.Types)
	}
	if len(opts.Visibilities) > 0 {
		where += " AND f_visibility IN ?"
		args = append(args, opts.Visibilities)
	}
	if opts.Inline != nil {
		where += " AND f_inline = ?"
		args = append(args, *opts.Inline)
	}

	sql := fmt.Sprintf("SELECT COUNT(*) FROM t_dag_instance_event%s", where)
	if opts.LatestOnly {
		sql = fmt.Sprintf(`
			SELECT COUNT(*) FROM (
				SELECT 1
				FROM (
					SELECT f_type, f_name,
						ROW_NUMBER() OVER (PARTITION BY f_type, f_name ORDER BY f_id DESC) AS rn
					FROM t_dag_instance_event%s
				) t
				WHERE rn = 1
			) cnt
		`, where)
	}

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_QUERY, fmt.Sprintf("%v", args)))

	var count int
	err := d.db.Raw(sql, args...).Scan(&count).Error
	if err != nil {
		log.Warnf("[DagInstanceEventRepository.ListCount] query failed: %s", err.Error())
		return 0, err
	}

	return count, nil
}

func (d *dagInstanceEventRepository) List(ctx context.Context, opts *DagInstanceEventListOptions) (result []*DagInstanceEvent, err error) {
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EVENT_TABLE))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	fields := opts.Fields
	if len(fields) == 0 {
		fields = DagInstanceEventFieldAll
	}

	fieldStrs := make([]string, 0, len(fields))
	for _, f := range fields {
		fieldStrs = append(fieldStrs, string(f))
	}
	var args []interface{}
	where := " WHERE f_instance_id = ?"
	args = append(args, opts.DagInstanceID)

	if len(opts.Names) > 0 {
		where += " AND f_name IN ?"
		args = append(args, opts.Names)
	}
	if len(opts.Types) > 0 {
		where += " AND f_type IN ?"
		args = append(args, opts.Types)
	}
	if len(opts.Visibilities) > 0 {
		where += " AND f_visibility IN ?"
		args = append(args, opts.Visibilities)
	}
	if opts.Inline != nil {
		where += " AND f_inline = ?"
		args = append(args, *opts.Inline)
	}

	sql := fmt.Sprintf("SELECT %s FROM t_dag_instance_event%s", strings.Join(fieldStrs, ", "), where)
	if opts.LatestOnly {
		sql = fmt.Sprintf(`
			SELECT %s FROM (
				SELECT %s,
					ROW_NUMBER() OVER (PARTITION BY f_type, f_name ORDER BY f_id DESC) AS rn
				FROM t_dag_instance_event%s
			) t
			WHERE rn = 1
		`, strings.Join(fieldStrs, ", "), strings.Join(fieldStrs, ", "), where)
	}

	sql += " ORDER BY f_id"

	if opts.Limit > 0 {
		sql = fmt.Sprintf("%s LIMIT ? OFFSET ?", sql)
		args = append(args, opts.Limit, opts.Offset)
	}
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_QUERY, fmt.Sprintf("%v", args)))

	var rows []*struct {
		ID         uint64                     `gorm:"column:f_id"`
		Type       DagInstanceEventType       `gorm:"column:f_type"`
		InstanceID string                     `gorm:"column:f_instance_id"`
		Operator   string                     `gorm:"column:f_operator"`
		TaskID     string                     `gorm:"column:f_task_id"`
		Status     string                     `gorm:"column:f_status"`
		Name       string                     `gorm:"column:f_name"`
		Data       string                     `gorm:"column:f_data"`
		Size       int                        `gorm:"column:f_size"`
		Inline     bool                       `gorm:"column:f_inline"`
		Timestamp  int64                      `gorm:"column:f_timestamp"`
		Visibility DagInstanceEventVisibility `gorm:"column:f_visibility"`
	}
	err = d.db.Raw(sql, args...).Scan(&rows).Error
	if err != nil {
		log.Warnf("[DagInstanceEventRepository.List] query failed: %s", err.Error())
		return
	}
	result = make([]*DagInstanceEvent, 0, len(rows))
	for _, row := range rows {
		result = append(result, &DagInstanceEvent{
			ID:         row.ID,
			Type:       row.Type,
			InstanceID: row.InstanceID,
			Operator:   row.Operator,
			TaskID:     row.TaskID,
			Status:     row.Status,
			Name:       row.Name,
			Data:       row.Data,
			Size:       row.Size,
			Inline:     row.Inline,
			Timestamp:  row.Timestamp,
			Visibility: row.Visibility,
		})
	}
	return
}

func (d *dagInstanceEventRepository) DeleteByInstanceIDs(ctx context.Context, instanceIDs []string) (err error) {
	if len(instanceIDs) == 0 {
		return nil
	}
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, DAG_INSTANCE_EVENT_TABLE))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	sqlStr := "DELETE FROM t_dag_instance_event WHERE f_instance_id IN ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sqlStr), attribute.String(trace.DB_QUERY, fmt.Sprintf("%v", instanceIDs)))
	result := d.db.Exec(sqlStr, instanceIDs)
	if result.Error != nil {
		log.Warnf("[DagInstanceEventRepository.DeleteByInstanceIDs] delete err: %s", result.Error.Error())
		err = result.Error
		return err
	}
	return err
}
