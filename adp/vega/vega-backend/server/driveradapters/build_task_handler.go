// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package driveradapters

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/kweaver-go-lib/audit"
	"github.com/kweaver-ai/kweaver-go-lib/hydra"
	"github.com/kweaver-ai/kweaver-go-lib/logger"
	"github.com/kweaver-ai/kweaver-go-lib/otel/otellog"
	"github.com/kweaver-ai/kweaver-go-lib/otel/oteltrace"
	"github.com/kweaver-ai/kweaver-go-lib/rest"

	"vega-backend/common"
	"vega-backend/common/visitor"
	verrors "vega-backend/errors"
	"vega-backend/interfaces"
)

// =========================== POST /build-tasks ===========================

// CreateBuildTaskByEx handles POST /api/vega-backend/v1/build-tasks (External).
func (r *restHandler) CreateBuildTaskByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.createBuildTask(c, visitor)
}

// CreateBuildTaskByIn handles POST /api/vega-backend/in/v1/build-tasks (Internal).
func (r *restHandler) CreateBuildTaskByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.createBuildTask(c, visitor)
}

func (r *restHandler) createBuildTask(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	var req interfaces.CreateBuildTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
			WithErrorDetails(err.Error())
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	resource, err := r.rs.GetByID(ctx, req.ResourceID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	if req.BuildKeyFields == "" && req.Mode == interfaces.BuildTaskModeBatch {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
			WithErrorDetails("build_key_fields is required for batch mode")
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	schemaFields := make(map[string]bool, len(resource.SchemaDefinition))
	for _, prop := range resource.SchemaDefinition {
		schemaFields[prop.Name] = true
	}
	if req.BuildKeyFields != "" {
		for _, key := range strings.Split(req.BuildKeyFields, ",") {
			key = strings.TrimSpace(key)
			if key != "" && !schemaFields[key] {
				httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
					WithErrorDetails(fmt.Sprintf("build_key_field '%s' not found in resource schema", key))
				oteltrace.AddHttpAttrs4HttpError(span, httpErr)
				rest.ReplyError(c, httpErr)
				return
			}
		}
	}
	if req.EmbeddingFields != "" {
		for _, field := range strings.Split(req.EmbeddingFields, ",") {
			field = strings.TrimSpace(field)
			if field != "" && !schemaFields[field] {
				httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
					WithErrorDetails(fmt.Sprintf("embedding_field '%s' not found in resource schema", field))
				oteltrace.AddHttpAttrs4HttpError(span, httpErr)
				rest.ReplyError(c, httpErr)
				return
			}
		}
	}

	taskID, err := r.bts.CreateBuildTask(ctx, &req)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, "build", audit.TransforOperator(visitor),
		interfaces.GenerateResourceAuditObject(req.ResourceID, ""), "")

	logger.Debug("Handler CreateBuildTask Success")
	oteltrace.AddHttpAttrs4Ok(span, http.StatusCreated)
	rest.ReplyOK(c, http.StatusCreated, map[string]any{
		"id":          taskID,
		"resource_id": req.ResourceID,
		"status":      interfaces.BuildTaskStatusInit,
	})
}

// =========================== GET /build-tasks/:id ===========================

func (r *restHandler) GetBuildTaskByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.getBuildTask(c, visitor)
}

func (r *restHandler) GetBuildTaskByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.getBuildTask(c, visitor)
}

func (r *restHandler) getBuildTask(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	taskID := c.Param("id")
	buildTask, err := r.bts.GetBuildTaskByID(ctx, taskID)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	oteltrace.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, buildTask)
}

// =========================== GET /build-tasks ===========================

func (r *restHandler) ListBuildTasksByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.listBuildTasks(c, visitor)
}

func (r *restHandler) ListBuildTasksByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.listBuildTasks(c, visitor)
}

func (r *restHandler) listBuildTasks(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	offset := common.GetQueryOrDefault(c, "offset", interfaces.DEFAULT_OFFSET)
	limit := common.GetQueryOrDefault(c, "limit", interfaces.DEFAULT_LIMIT)
	sort := common.GetQueryOrDefault(c, "sort", "update_time")
	direction := common.GetQueryOrDefault(c, "direction", interfaces.DESC_DIRECTION)

	pageParam, err := validatePaginationQueryParams(ctx,
		offset, limit, sort, direction, interfaces.BUILD_TASK_SORT)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		otellog.LogError(ctx, fmt.Sprintf("%s. %v", httpErr.BaseError.Description,
			httpErr.BaseError.ErrorDetails), nil)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	params := interfaces.BuildTasksQueryParams{
		PaginationQueryParams: pageParam,
		ResourceID:            c.Query("resource_id"),
		CatalogID:             c.Query("catalog_id"),
		Status:                c.Query("status"),
		Mode:                  c.Query("mode"),
	}

	if err := ValidateBuildTaskQueryParams(ctx, params); err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	tasks, total, err := r.bts.ListBuildTasks(ctx, params)
	if err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}
	oteltrace.AddHttpAttrs4Ok(span, http.StatusOK)
	rest.ReplyOK(c, http.StatusOK, map[string]any{
		"entries":     tasks,
		"total_count": total,
	})
}

// =========================== DELETE /build-tasks/:ids ===========================

// DeleteBuildTasksByEx handles DELETE /build-tasks/:ids (External).
// `ids` is a comma-separated list. Optional query: ?ignore_missing=true
func (r *restHandler) DeleteBuildTasksByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.deleteBuildTasks(c, visitor)
}

func (r *restHandler) DeleteBuildTasksByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.deleteBuildTasks(c, visitor)
}

func (r *restHandler) deleteBuildTasks(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	idsStr := c.Param("ids")
	ids := make([]string, 0)
	for _, id := range strings.Split(idsStr, ",") {
		id = strings.TrimSpace(id)
		if id != "" {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		httpErr := rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
			WithErrorDetails("ids path parameter is required")
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	ignoreMissing := strings.EqualFold(c.Query("ignore_missing"), "true")

	if err := r.bts.DeleteBuildTasks(ctx, ids, ignoreMissing); err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	for _, id := range ids {
		audit.NewWarnLog(audit.OPERATION, audit.DELETE, audit.TransforOperator(visitor),
			interfaces.GenerateResourceAuditObject(id, ""), audit.SUCCESS, "")
	}

	oteltrace.AddHttpAttrs4Ok(span, http.StatusNoContent)
	rest.ReplyOK(c, http.StatusNoContent, nil)
}

// =========================== POST /build-tasks/:id/start ===========================

func (r *restHandler) StartBuildTaskByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.startBuildTask(c, visitor)
}

func (r *restHandler) StartBuildTaskByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.startBuildTask(c, visitor)
}

func (r *restHandler) startBuildTask(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	taskID := c.Param("id")
	var req interfaces.StartBuildTaskRequest
	// body is optional; bind errors are tolerated
	_ = c.ShouldBindJSON(&req)

	if err := r.bts.StartBuildTask(ctx, taskID, req.ExecuteType); err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, "start", audit.TransforOperator(visitor),
		interfaces.GenerateResourceAuditObject(taskID, ""), "")

	oteltrace.AddHttpAttrs4Ok(span, http.StatusAccepted)
	rest.ReplyOK(c, http.StatusAccepted, nil)
}

// =========================== POST /build-tasks/:id/stop ===========================

func (r *restHandler) StopBuildTaskByEx(c *gin.Context) {
	visitor, err := r.verifyOAuth(rest.GetLanguageCtx(c), c)
	if err != nil {
		return
	}
	r.stopBuildTask(c, visitor)
}

func (r *restHandler) StopBuildTaskByIn(c *gin.Context) {
	visitor := visitor.GenerateVisitor(c)
	r.stopBuildTask(c, visitor)
}

func (r *restHandler) stopBuildTask(c *gin.Context, visitor hydra.Visitor) {
	ctx, span := oteltrace.StartServerSpan(c)
	defer span.End()

	accountInfo := interfaces.AccountInfo{
		ID:   visitor.ID,
		Type: string(visitor.Type),
	}
	ctx = context.WithValue(ctx, interfaces.ACCOUNT_INFO_KEY, accountInfo)
	oteltrace.AddHttpAttrs4API(span, oteltrace.GetAttrsByGinCtx(c))

	taskID := c.Param("id")
	if err := r.bts.StopBuildTask(ctx, taskID); err != nil {
		httpErr := err.(*rest.HTTPError)
		oteltrace.AddHttpAttrs4HttpError(span, httpErr)
		rest.ReplyError(c, httpErr)
		return
	}

	audit.NewInfoLog(audit.OPERATION, "stop", audit.TransforOperator(visitor),
		interfaces.GenerateResourceAuditObject(taskID, ""), "")

	oteltrace.AddHttpAttrs4Ok(span, http.StatusAccepted)
	rest.ReplyOK(c, http.StatusAccepted, nil)
}

// =========================== helpers ===========================
