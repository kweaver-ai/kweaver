// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

// Package discover_task provides DiscoverTask data access operations.
package discover_task

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/bytedance/sonic"
	libdb "github.com/kweaver-ai/kweaver-go-lib/db"
	"github.com/kweaver-ai/kweaver-go-lib/logger"
	"github.com/kweaver-ai/kweaver-go-lib/otel/otellog"
	"github.com/kweaver-ai/kweaver-go-lib/otel/oteltrace"
	attr "go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"

	"vega-backend/common"
	"vega-backend/interfaces"
)

const (
	DISCOVER_TASK_TABLE_NAME = "t_discover_task"
)

var (
	dtAccessOnce sync.Once
	dtAccess     interfaces.DiscoverTaskAccess
)

type discoverTaskAccess struct {
	appSetting *common.AppSetting
	db         *sql.DB
}

type discoverTaskScanner interface {
	Scan(dest ...any) error
}

func discoverTaskColumns() []string {
	return []string{
		"f_id",
		"f_catalog_id",
		"f_schedule_id",
		"f_strategies",
		"f_trigger_type",
		"f_status",
		"f_progress",
		"f_message",
		"f_start_time",
		"f_finish_time",
		"f_result",
		"f_creator",
		"f_creator_type",
		"f_create_time",
	}
}

func scanDiscoverTask(scanner discoverTaskScanner) (*interfaces.DiscoverTask, error) {
	task := &interfaces.DiscoverTask{}
	var resultStr sql.NullString
	var strategiesStr sql.NullString

	err := scanner.Scan(
		&task.ID,
		&task.CatalogID,
		&task.ScheduleID,
		&strategiesStr,
		&task.TriggerType,
		&task.Status,
		&task.Progress,
		&task.Message,
		&task.StartTime,
		&task.FinishTime,
		&resultStr,
		&task.Creator.ID,
		&task.Creator.Type,
		&task.CreateTime,
	)
	if err != nil {
		return nil, err
	}

	if strategiesStr.Valid && strategiesStr.String != "" {
		if err := sonic.Unmarshal([]byte(strategiesStr.String), &task.Strategies); err != nil {
			logger.Errorf("Failed to unmarshal strategies: %v", err)
			task.Strategies = []string{}
		}
	} else {
		task.Strategies = []string{}
	}

	if resultStr.Valid && resultStr.String != "" {
		task.Result = &interfaces.DiscoverResult{}
		_ = sonic.UnmarshalString(resultStr.String, task.Result)
	}

	return task, nil
}

// NewDiscoverTaskAccess creates a new DiscoverTaskAccess.
func NewDiscoverTaskAccess(appSetting *common.AppSetting) interfaces.DiscoverTaskAccess {
	dtAccessOnce.Do(func() {
		dtAccess = &discoverTaskAccess{
			appSetting: appSetting,
			db:         libdb.NewDB(&appSetting.DBSetting),
		}
	})
	return dtAccess
}

// GetScheduledTaskStrategies retrieves strategies from t_discover_schedule table by ID.
func (dta *discoverTaskAccess) GetScheduledTaskStrategies(ctx context.Context, scheduledTaskID string) ([]string, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Query discover_schedule by ID")
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	sqlStr, vals, err := sq.Select("f_strategies").
		From("t_discover_schedule").
		Where(sq.Eq{"f_id": scheduledTaskID}).
		ToSql()
	if err != nil {
		otellog.LogError(ctx, "Failed to build select discover_schedule sql", err)
		return nil, err
	}

	var strategiesStr string
	err = dta.db.QueryRowContext(ctx, sqlStr, vals...).Scan(&strategiesStr)
	if err == sql.ErrNoRows {
		span.SetStatus(codes.Ok, "")
		return []string{}, nil
	}
	if err != nil {
		logger.Errorf("Scan discover_schedule failed: %v", err)
		span.SetStatus(codes.Error, "Scan failed")
		return nil, err
	}

	// Parse strategies string to array
	if strategiesStr == "" {
		return []string{}, nil
	}
	var strategies []string
	if err := sonic.Unmarshal([]byte(strategiesStr), &strategies); err != nil {
		logger.Errorf("Failed to unmarshal strategies: %v", err)
		return []string{}, nil
	}

	span.SetStatus(codes.Ok, "")
	return strategies, nil
}

// Create creates a new DiscoverTask.
func (dta *discoverTaskAccess) Create(ctx context.Context, task *interfaces.DiscoverTask) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Insert into discover_task")
	defer span.End()

	span.SetAttributes(
		attr.Key("db_url").String(libdb.GetDBUrl()),
		attr.Key("db_type").String(libdb.GetDBType()))

	// Serialize strategies to JSON string
	strategiesStr := ""
	if len(task.Strategies) > 0 {
		strategiesBytes, err := sonic.Marshal(task.Strategies)
		if err != nil {
			otellog.LogError(ctx, "Failed to marshal strategies", err)
			return err
		}
		strategiesStr = string(strategiesBytes)
	}

	sqlStr, vals, err := sq.Insert(DISCOVER_TASK_TABLE_NAME).
		Columns(discoverTaskColumns()...).
		Values(
			task.ID,
			task.CatalogID,
			task.ScheduleID,
			strategiesStr,
			task.TriggerType,
			task.Status,
			task.Progress,
			task.Message,
			task.StartTime,
			task.FinishTime,
			"", // result initially empty
			task.Creator.ID,
			task.Creator.Type,
			task.CreateTime,
		).ToSql()
	if err != nil {
		otellog.LogError(ctx, "Failed to build insert discover_schedule sql", err)
		return err
	}

	otellog.LogInfo(ctx, fmt.Sprintf("Insert discover_task SQL: %s", sqlStr))

	_, err = dta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Insert discover_schedule failed", err)
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// GetByID retrieves a DiscoverTask by ID.
func (dta *discoverTaskAccess) GetByID(ctx context.Context, id string) (*interfaces.DiscoverTask, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Query discover_task by ID")
	defer span.End()

	span.SetAttributes(attr.Key("task_id").String(id))

	sqlStr, vals, err := sq.Select(discoverTaskColumns()...).
		From(DISCOVER_TASK_TABLE_NAME).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build select discover_task sql: %v", err)
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, err
	}

	row := dta.db.QueryRowContext(ctx, sqlStr, vals...)
	task, err := scanDiscoverTask(row)
	if err == sql.ErrNoRows {
		span.SetStatus(codes.Ok, "")
		return nil, nil
	}
	if err != nil {
		logger.Errorf("Scan discover_task failed: %v", err)
		span.SetStatus(codes.Error, "Scan failed")
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return task, nil
}

// List lists DiscoverTasks with filters.
func (dta *discoverTaskAccess) List(ctx context.Context, params interfaces.DiscoverTaskQueryParams) ([]*interfaces.DiscoverTask, int64, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "List discover_tasks")
	defer span.End()

	builder := sq.Select(discoverTaskColumns()...).From(DISCOVER_TASK_TABLE_NAME)

	countBuilder := sq.Select("COUNT(*)").From(DISCOVER_TASK_TABLE_NAME)

	if params.CatalogID != "" {
		builder = builder.Where(sq.Eq{"f_catalog_id": params.CatalogID})
		countBuilder = countBuilder.Where(sq.Eq{"f_catalog_id": params.CatalogID})
	}
	if params.ScheduleID != "" {
		builder = builder.Where(sq.Eq{"f_schedule_id": params.ScheduleID})
		countBuilder = countBuilder.Where(sq.Eq{"f_schedule_id": params.ScheduleID})
	}
	if params.Status != "" {
		builder = builder.Where(sq.Eq{"f_status": params.Status})
		countBuilder = countBuilder.Where(sq.Eq{"f_status": params.Status})
	}
	if params.TriggerType != "" {
		builder = builder.Where(sq.Eq{"f_trigger_type": params.TriggerType})
		countBuilder = countBuilder.Where(sq.Eq{"f_trigger_type": params.TriggerType})
	}

	countSql, countVals, _ := countBuilder.ToSql()
	var total int64
	err := dta.db.QueryRowContext(ctx, countSql, countVals...).Scan(&total)
	if err != nil {
		logger.Errorf("Failed to count discover_tasks: %v", err)
		span.SetStatus(codes.Error, "Count failed")
		return nil, 0, err
	}

	// Pagination
	if params.Limit > 0 {
		builder = builder.Limit(uint64(params.Limit)).Offset(uint64(params.Offset))
	}
	if params.Sort != "" && params.Direction != "" {
		builder = builder.OrderBy(fmt.Sprintf("%s %s", params.Sort, params.Direction))
	} else {
		builder = builder.OrderBy("f_create_time DESC")
	}

	sqlStr, vals, err := builder.ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, 0, err
	}

	rows, err := dta.db.QueryContext(ctx, sqlStr, vals...)
	if err != nil {
		span.SetStatus(codes.Error, "Query failed")
		return nil, 0, err
	}
	defer func() { _ = rows.Close() }()

	tasks := make([]*interfaces.DiscoverTask, 0)
	for rows.Next() {
		task, err := scanDiscoverTask(rows)
		if err != nil {
			span.SetStatus(codes.Error, "Scan row failed")
			return nil, 0, err
		}

		tasks = append(tasks, task)
	}

	span.SetStatus(codes.Ok, "")
	return tasks, total, nil
}

// UpdateStatus updates a DiscoverTask's status and message.
func (dta *discoverTaskAccess) UpdateStatus(ctx context.Context, id, status, message string, stime int64) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Update discover_task status")
	defer span.End()

	span.SetAttributes(
		attr.Key("task_id").String(id),
		attr.Key("status").String(status),
	)

	data := map[string]any{
		"f_status":  status,
		"f_message": message,
	}
	if status == interfaces.DiscoverTaskStatusRunning {
		data["f_start_time"] = stime
	}
	sqlStr, vals, err := sq.Update(DISCOVER_TASK_TABLE_NAME).
		SetMap(data).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	_, err = dta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		span.SetStatus(codes.Error, "Update failed")
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// UpdateProgress updates a DiscoverTask's progress.
func (dta *discoverTaskAccess) UpdateProgress(ctx context.Context, id string, progress int) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Update discover_task progress")
	defer span.End()

	sqlStr, vals, err := sq.Update(DISCOVER_TASK_TABLE_NAME).
		Set("f_progress", progress).
		Set("f_update_time", time.Now().UnixMilli()).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	_, err = dta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		span.SetStatus(codes.Error, "Update failed")
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// UpdateResult updates a DiscoverTask's result and sets status to completed.
func (dta *discoverTaskAccess) UpdateResult(ctx context.Context, id string, result *interfaces.DiscoverResult, stime int64) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Update discover_task result")
	defer span.End()

	resultBytes, _ := sonic.MarshalString(result)

	sqlStr, vals, err := sq.Update(DISCOVER_TASK_TABLE_NAME).
		Set("f_status", interfaces.DiscoverTaskStatusCompleted).
		Set("f_result", resultBytes).
		Set("f_progress", 100).
		Set("f_finish_time", stime).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	_, err = dta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		span.SetStatus(codes.Error, "Update failed")
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// CheckExistByStatuses checks if DiscoverTasks exist by catalog ID and statuses.
func (dta *discoverTaskAccess) CheckExistByStatuses(ctx context.Context, catalogID string, statuses []string) (bool, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Check discover_tasks exist")
	defer span.End()

	countBuilder := sq.Select("COUNT(*)").From(DISCOVER_TASK_TABLE_NAME)

	if catalogID != "" {
		countBuilder = countBuilder.Where(sq.Eq{"f_catalog_id": catalogID})
	}
	if len(statuses) > 0 {
		countBuilder = countBuilder.Where(sq.Eq{"f_status": statuses})
	}

	countSql, countVals, _ := countBuilder.ToSql()
	var total int64
	err := dta.db.QueryRowContext(ctx, countSql, countVals...).Scan(&total)
	if err != nil {
		logger.Errorf("Failed to count discover_tasks: %v", err)
		span.SetStatus(codes.Error, "Count failed")
		return false, err
	}

	span.SetStatus(codes.Ok, "")
	return total > 0, nil
}

// Delete deletes a DiscoverTask by ID. Returns sql.ErrNoRows if no row was affected.
func (dta *discoverTaskAccess) Delete(ctx context.Context, id string) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Delete discover_task")
	defer span.End()

	span.SetAttributes(attr.Key("id").String(id))

	sqlStr, vals, err := sq.Delete(DISCOVER_TASK_TABLE_NAME).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		logger.Errorf("Failed to build delete discover_task sql: %v", err)
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	res, err := dta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Delete discover_task failed", err)
		return err
	}

	affected, err := res.RowsAffected()
	if err != nil {
		span.SetStatus(codes.Error, "RowsAffected failed")
		return err
	}
	if affected == 0 {
		span.SetStatus(codes.Ok, "discover_task not found")
		return sql.ErrNoRows
	}

	span.SetStatus(codes.Ok, "")
	return nil
}
