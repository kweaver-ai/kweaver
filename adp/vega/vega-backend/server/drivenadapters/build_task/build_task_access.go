// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

// Package build_task provides BuildTask data access layer.
package build_task

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/kweaver-ai/kweaver-go-lib/db"
	"github.com/kweaver-ai/kweaver-go-lib/otel/otellog"
	"github.com/kweaver-ai/kweaver-go-lib/otel/oteltrace"
	"go.opentelemetry.io/otel/codes"

	"vega-backend/common"
	"vega-backend/interfaces"
)

var (
	btaOnce sync.Once
	bta     interfaces.BuildTaskAccess
)

const (
	BUILD_TASK_TABLE_NAME = "t_build_task"
)

var buildTaskColumns = []string{
	"f_id",
	"f_resource_id",
	"f_catalog_id",
	"f_status",
	"f_mode",
	"f_total_count",
	"f_synced_count",
	"f_vectorized_count",
	"f_synced_mark",
	"f_error_msg",
	"f_creator",
	"f_creator_type",
	"f_create_time",
	"f_updater",
	"f_updater_type",
	"f_update_time",
	"f_embedding_fields",
	"f_build_key_fields",
	"f_embedding_model",
	"f_model_dimensions",
}

type buildTaskAccess struct {
	db *sql.DB
}

type buildTaskScanner interface {
	Scan(dest ...any) error
}

func scanBuildTask(scanner buildTaskScanner) (*interfaces.BuildTask, error) {
	buildTask := &interfaces.BuildTask{}
	var creatorID, creatorType, updaterID, updaterType string

	err := scanner.Scan(
		&buildTask.ID,
		&buildTask.ResourceID,
		&buildTask.CatalogID,
		&buildTask.Status,
		&buildTask.Mode,
		&buildTask.TotalCount,
		&buildTask.SyncedCount,
		&buildTask.VectorizedCount,
		&buildTask.SyncedMark,
		&buildTask.ErrorMsg,
		&creatorID,
		&creatorType,
		&buildTask.CreateTime,
		&updaterID,
		&updaterType,
		&buildTask.UpdateTime,
		&buildTask.EmbeddingFields,
		&buildTask.BuildKeyFields,
		&buildTask.EmbeddingModel,
		&buildTask.ModelDimensions,
	)
	if err != nil {
		return nil, err
	}

	buildTask.Creator = interfaces.AccountInfo{ID: creatorID, Type: creatorType}
	buildTask.Updater = interfaces.AccountInfo{ID: updaterID, Type: updaterType}
	return buildTask, nil
}

// NewBuildTaskAccess creates a new BuildTaskAccess.
func NewBuildTaskAccess(appSetting *common.AppSetting) interfaces.BuildTaskAccess {
	btaOnce.Do(func() {
		bta = &buildTaskAccess{
			db: db.NewDB(&appSetting.DBSetting),
		}
	})
	return bta
}

// Create creates a new build task.
func (bta *buildTaskAccess) Create(ctx context.Context, buildTask *interfaces.BuildTask) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Create build task")
	defer span.End()

	sqlStr, vals, err := sq.Insert(BUILD_TASK_TABLE_NAME).
		Columns(buildTaskColumns...).
		Values(
			buildTask.ID,
			buildTask.ResourceID,
			buildTask.CatalogID,
			buildTask.Status,
			buildTask.Mode,
			buildTask.TotalCount,
			buildTask.SyncedCount,
			buildTask.VectorizedCount,
			buildTask.SyncedMark,
			buildTask.ErrorMsg,
			buildTask.Creator.ID,
			buildTask.Creator.Type,
			buildTask.CreateTime,
			buildTask.Updater.ID,
			buildTask.Updater.Type,
			buildTask.UpdateTime,
			buildTask.EmbeddingFields,
			buildTask.BuildKeyFields,
			buildTask.EmbeddingModel,
			buildTask.ModelDimensions,
		).ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	_, err = bta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Create build task failed", err)
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// GetByID retrieves a build task by ID.
func (bta *buildTaskAccess) GetByID(ctx context.Context, id string) (*interfaces.BuildTask, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Get build task by ID")
	defer span.End()

	sqlStr, vals, err := sq.Select(buildTaskColumns...).
		From(BUILD_TASK_TABLE_NAME).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, err
	}

	buildTask, err := scanBuildTask(bta.db.QueryRowContext(ctx, sqlStr, vals...))
	if err == sql.ErrNoRows {
		span.SetStatus(codes.Ok, "Build task not found")
		return nil, nil
	}

	if err != nil {
		otellog.LogError(ctx, "Get build task by ID failed", err)
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return buildTask, nil
}

// GetByResourceID retrieves a build task by resource ID.
func (bta *buildTaskAccess) GetByResourceID(ctx context.Context, resourceID string) (*interfaces.BuildTask, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Get build task by resource ID")
	defer span.End()

	sqlStr, vals, err := sq.Select(buildTaskColumns...).
		From(BUILD_TASK_TABLE_NAME).
		Where(sq.Eq{"f_resource_id": resourceID}).
		Limit(1).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, err
	}

	buildTask, err := scanBuildTask(bta.db.QueryRowContext(ctx, sqlStr, vals...))
	if err == sql.ErrNoRows {
		span.SetStatus(codes.Ok, "Build task not found")
		return nil, nil
	}

	if err != nil {
		otellog.LogError(ctx, "Scan build task row failed", err)
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return buildTask, nil
}

// GetByCatalogID retrieves build tasks by catalog ID.
func (bta *buildTaskAccess) GetByCatalogID(ctx context.Context, catalogID string) ([]*interfaces.BuildTask, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Get build tasks by catalog ID")
	defer span.End()

	sqlStr, vals, err := sq.Select(buildTaskColumns...).
		From(BUILD_TASK_TABLE_NAME).
		Where(sq.Eq{"f_catalog_id": catalogID}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, err
	}

	rows, err := bta.db.QueryContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Get build tasks by catalog ID failed", err)
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	buildTasks := []*interfaces.BuildTask{}
	for rows.Next() {
		buildTask, err := scanBuildTask(rows)
		if err != nil {
			otellog.LogError(ctx, "Scan build task row failed", err)
			return nil, err
		}

		buildTasks = append(buildTasks, buildTask)
	}

	if err = rows.Err(); err != nil {
		otellog.LogError(ctx, "Rows iteration failed", err)
		return nil, err
	}

	span.SetStatus(codes.Ok, "")
	return buildTasks, nil
}

// UpdateStatus updates a build task's status and other fields.
func (bta *buildTaskAccess) UpdateStatus(ctx context.Context, id string, updates map[string]interface{}) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Update build task status")
	defer span.End()

	fieldMap := map[string]string{
		"status":          "f_status",
		"totalCount":      "f_total_count",
		"syncedCount":     "f_synced_count",
		"vectorizedCount": "f_vectorized_count",
		"syncedMark":      "f_synced_mark",
		"errorMsg":        "f_error_msg",
	}

	builder := sq.Update(BUILD_TASK_TABLE_NAME)
	for field, value := range updates {
		if column, ok := fieldMap[field]; ok {
			builder = builder.Set(column, value)
		}
	}

	sqlStr, vals, err := builder.
		Set("f_update_time", time.Now().UnixMilli()).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	_, err = bta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Update build task status failed", err)
		return err
	}

	span.SetStatus(codes.Ok, "")
	return nil
}

// GetStatus retrieves the status of a build task by ID.
func (bta *buildTaskAccess) GetStatus(ctx context.Context, id string) (string, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Get build task status")
	defer span.End()

	var status string
	sqlStr, vals, err := sq.Select("f_status").
		From(BUILD_TASK_TABLE_NAME).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return "", err
	}

	err = bta.db.QueryRowContext(ctx, sqlStr, vals...).Scan(&status)
	if err == sql.ErrNoRows {
		span.SetStatus(codes.Ok, "Build task not found")
		return "", fmt.Errorf("build task not found")
	}

	if err != nil {
		otellog.LogError(ctx, "Get build task status failed", err)
		return "", err
	}

	span.SetStatus(codes.Ok, "")
	return status, nil
}

// List retrieves build tasks with optional filters and pagination.
func (bta *buildTaskAccess) List(ctx context.Context, params interfaces.BuildTasksQueryParams) ([]*interfaces.BuildTask, int64, error) {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Get build tasks with filters")
	defer span.End()

	builder := sq.Select(buildTaskColumns...).From(BUILD_TASK_TABLE_NAME)

	countBuilder := sq.Select("COUNT(*)").From(BUILD_TASK_TABLE_NAME)

	if params.ResourceID != "" {
		builder = builder.Where(sq.Eq{"f_resource_id": params.ResourceID})
		countBuilder = countBuilder.Where(sq.Eq{"f_resource_id": params.ResourceID})
	}
	if params.CatalogID != "" {
		builder = builder.Where(sq.Eq{"f_catalog_id": params.CatalogID})
		countBuilder = countBuilder.Where(sq.Eq{"f_catalog_id": params.CatalogID})
	}
	if params.Status != "" {
		builder = builder.Where(sq.Eq{"f_status": params.Status})
		countBuilder = countBuilder.Where(sq.Eq{"f_status": params.Status})
	}
	if params.Mode != "" {
		builder = builder.Where(sq.Eq{"f_mode": params.Mode})
		countBuilder = countBuilder.Where(sq.Eq{"f_mode": params.Mode})
	}

	countSQL, countVals, err := countBuilder.ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build count sql failed")
		return nil, 0, err
	}
	var totalCount int64
	if err := bta.db.QueryRowContext(ctx, countSQL, countVals...).Scan(&totalCount); err != nil {
		otellog.LogError(ctx, "Count build tasks failed", err)
		return nil, 0, err
	}

	if params.Sort != "" && params.Direction != "" {
		builder = builder.OrderBy(fmt.Sprintf("%s %s", params.Sort, params.Direction))
	} else {
		builder = builder.OrderBy("f_update_time DESC")
	}

	if params.Limit > 0 {
		builder = builder.Limit(uint64(params.Limit)).Offset(uint64(params.Offset))
	}

	query, queryArgs, err := builder.ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return nil, 0, err
	}
	rows, err := bta.db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		otellog.LogError(ctx, "Get build tasks with filters failed", err)
		return nil, 0, err
	}
	defer func() { _ = rows.Close() }()

	buildTasks := []*interfaces.BuildTask{}
	for rows.Next() {
		buildTask, err := scanBuildTask(rows)
		if err != nil {
			otellog.LogError(ctx, "Scan build task row failed", err)
			return nil, 0, err
		}
		buildTasks = append(buildTasks, buildTask)
	}
	if err := rows.Err(); err != nil {
		otellog.LogError(ctx, "Rows iteration failed", err)
		return nil, 0, err
	}

	span.SetStatus(codes.Ok, "")
	return buildTasks, totalCount, nil
}

// Delete deletes a build task by ID.
func (bta *buildTaskAccess) Delete(ctx context.Context, id string) error {
	ctx, span := oteltrace.StartNamedClientSpan(ctx, "Delete build task")
	defer span.End()

	sqlStr, vals, err := sq.Delete(BUILD_TASK_TABLE_NAME).
		Where(sq.Eq{"f_id": id}).
		ToSql()
	if err != nil {
		span.SetStatus(codes.Error, "Build sql failed")
		return err
	}

	result, err := bta.db.ExecContext(ctx, sqlStr, vals...)
	if err != nil {
		otellog.LogError(ctx, "Delete build task failed", err)
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		otellog.LogError(ctx, "Get rows affected failed", err)
		return err
	}

	if affected == 0 {
		span.SetStatus(codes.Ok, "Build task not found")
		return fmt.Errorf("build task not found")
	}

	span.SetStatus(codes.Ok, "")
	return nil
}
