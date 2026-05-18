// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package discover_schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/kweaver-ai/kweaver-go-lib/logger"
	"github.com/kweaver-ai/kweaver-go-lib/otel/otellog"
	"github.com/kweaver-ai/kweaver-go-lib/otel/oteltrace"
	"github.com/kweaver-ai/kweaver-go-lib/rest"
	"github.com/rs/xid"
	"go.opentelemetry.io/otel/codes"

	"vega-backend/common"
	"vega-backend/drivenadapters/discover_schedule"
	verrors "vega-backend/errors"
	"vega-backend/interfaces"
	"vega-backend/logics/user_mgmt"
)

var (
	dsServiceOnce sync.Once
	dsService     interfaces.DiscoverScheduleService
)

type discoverScheduleService struct {
	appSetting *common.AppSetting
	dsa        interfaces.DiscoverScheduleAccess
	dts        interfaces.DiscoverTaskService
	ums        interfaces.UserMgmtService
}

func (dss *discoverScheduleService) UpdateLastRun(ctx context.Context, id string, lastRun int64) error {
	return dss.dsa.UpdateLastRun(ctx, id, lastRun)
}

// NewDiscoverScheduleService creates a new DiscoverScheduleService.
func NewDiscoverScheduleService(appSetting *common.AppSetting, dts interfaces.DiscoverTaskService) interfaces.DiscoverScheduleService {
	dsServiceOnce.Do(func() {
		dsService = &discoverScheduleService{
			appSetting: appSetting,
			dsa:        discover_schedule.NewDiscoverScheduleAccess(appSetting),
			dts:        dts,
			ums:        user_mgmt.NewUserMgmtService(appSetting),
		}
	})
	return dsService
}

/**
 * 创建定时发现任务服务
 * @param ctx context.Context 上下文信息，用于传递请求范围的数据和取消信号
 * @param req *interfaces.DiscoverSchedule 定时发现任务请求结构体
 * @return string 返回创建的任务ID
 * @return error 返回操作过程中可能发生的错误
 */
func (dss *discoverScheduleService) Create(ctx context.Context, req *interfaces.DiscoverScheduleRequest) (string, error) {
	// 使用OpenTelemetry追踪请求执行过程
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.Create")
	defer span.End()

	// Validate cron expression
	if req.CronExpr == "" {
		otellog.LogError(ctx, "Cron expression is required", nil)
		return "", fmt.Errorf("cron_expr is required")
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	now := time.Now().UnixMilli()
	schedule := &interfaces.DiscoverSchedule{
		ID:         xid.New().String(),
		Name:       req.Name,
		CatalogID:  req.CatalogID,
		CronExpr:   req.CronExpr,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Enabled:    req.Enabled,
		Strategies: req.Strategies,

		Creator:    accountInfo,
		CreateTime: now,
		Updater:    accountInfo,
		UpdateTime: now,
	}

	// Create schedule
	if err := dss.dsa.Create(ctx, schedule); err != nil {
		otellog.LogError(ctx, "Failed to create discover schedule", err)
		return "", err
	}

	logger.Infof("Created discover schedule: id=%s, catalog_id=%s, cron=%s",
		schedule.ID, schedule.CatalogID, schedule.CronExpr)
	return schedule.ID, nil
}

// GetByID retrieves a discover schedule by ID.
func (dss *discoverScheduleService) GetByID(ctx context.Context, id string) (*interfaces.DiscoverSchedule, error) {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.GetByID")
	defer span.End()

	schedule, err := dss.dsa.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if schedule != nil {
		if err := dss.ums.GetAccountNames(ctx, []*interfaces.AccountInfo{&schedule.Creator, &schedule.Updater}); err != nil {
			span.SetStatus(codes.Error, "GetAccountNames error")
			return nil, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				verrors.VegaBackend_DiscoverSchedule_InternalError_GetAccountNamesFailed).WithErrorDetails(err.Error())
		}
	}
	return schedule, nil
}

// List lists discover schedules.
func (dss *discoverScheduleService) List(ctx context.Context, params interfaces.DiscoverScheduleQueryParams) ([]*interfaces.DiscoverSchedule, int64, error) {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.List")
	defer span.End()

	schedules, total, err := dss.dsa.List(ctx, params)
	if err != nil {
		return nil, 0, err
	}

	accountInfos := make([]*interfaces.AccountInfo, 0, len(schedules)*2)
	for _, s := range schedules {
		accountInfos = append(accountInfos, &s.Creator, &s.Updater)
	}
	if err := dss.ums.GetAccountNames(ctx, accountInfos); err != nil {
		span.SetStatus(codes.Error, "GetAccountNames error")
		return nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
			verrors.VegaBackend_DiscoverSchedule_InternalError_GetAccountNamesFailed).WithErrorDetails(err.Error())
	}
	return schedules, total, nil
}

// Update updates a discover schedule.
func (dss *discoverScheduleService) Update(ctx context.Context, schedule *interfaces.DiscoverSchedule, req *interfaces.DiscoverScheduleRequest) error {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.Update")
	defer span.End()

	if schedule == nil {
		return fmt.Errorf("discover schedule not found")
	}

	accountInfo := interfaces.AccountInfo{}
	if ctx.Value(interfaces.ACCOUNT_INFO_KEY) != nil {
		accountInfo = ctx.Value(interfaces.ACCOUNT_INFO_KEY).(interfaces.AccountInfo)
	}

	schedule.CronExpr = req.CronExpr
	schedule.Name = req.Name
	schedule.StartTime = req.StartTime
	schedule.EndTime = req.EndTime
	schedule.Strategies = req.Strategies
	schedule.Updater = accountInfo
	schedule.UpdateTime = time.Now().UnixMilli()

	// Update schedule
	if err := dss.dsa.Update(ctx, schedule); err != nil {
		otellog.LogError(ctx, "Failed to update discover schedule", err)
		return err
	}
	logger.Infof("Updated discover schedule: id=%s", schedule.ID)
	return nil
}

// Delete deletes a discover schedule by ID.
func (dss *discoverScheduleService) Delete(ctx context.Context, id string) error {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.Delete")
	defer span.End()

	// Delete schedule
	if err := dss.dsa.Delete(ctx, id); err != nil {
		otellog.LogError(ctx, "Failed to delete discover schedule", err)
		return err
	}

	logger.Infof("Deleted discover schedule: id=%s", id)
	return nil
}

// Enable enables a discover schedule.
func (dss *discoverScheduleService) Enable(ctx context.Context, id string) error {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.Enable")
	defer span.End()

	if err := dss.dsa.Enable(ctx, id); err != nil {
		otellog.LogError(ctx, "Failed to enable discover schedule", err)
		return err
	}

	return nil
}

// Disable disables a discover schedule.
func (dss *discoverScheduleService) Disable(ctx context.Context, id string) error {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.Disable")
	defer span.End()

	if err := dss.dsa.Disable(ctx, id); err != nil {
		otellog.LogError(ctx, "Failed to disable discover schedule", err)
		return err
	}

	return nil
}

// GetEnabledSchedules retrieves all enabled discover schedules.
func (dss *discoverScheduleService) GetEnabledSchedules(ctx context.Context) ([]*interfaces.DiscoverSchedule, error) {
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.GetEnabledSchedules")
	defer span.End()
	return dss.dsa.GetEnabledSchedules(ctx)
}

// ExecuteSchedule 是一个执行计划发现任务的方法
// 它接收一个上下文和一个计划发现任务作为参数，返回一个错误
func (dss *discoverScheduleService) ExecuteSchedule(ctx context.Context, schedule *interfaces.DiscoverSchedule) error {
	// 使用追踪器创建一个新的span，用于监控和追踪请求的执行过程
	ctx, span := oteltrace.StartNamedInternalSpan(ctx, "DiscoverScheduleService.ExecuteSchedule")
	defer span.End() // 确保在函数返回时结束span

	// 检查DiscoverTaskService是否已设置
	if dss.dts == nil {
		otellog.LogError(ctx, "DiscoverTaskService not set", nil)
		return fmt.Errorf("DiscoverTaskService not set")
	}

	// 检查是否有正在执行的相同任务
	_, tasks, err := dss.dts.List(ctx, interfaces.DiscoverTaskQueryParams{
		CatalogID:   schedule.CatalogID,
		Status:      interfaces.DiscoverTaskStatusRunning,
		TriggerType: interfaces.DiscoverTaskTriggerScheduled,
	})
	if err != nil {
		otellog.LogError(ctx, "Failed to check running tasks", err)
		return err
	}
	if tasks > 0 {
		logger.Warnf("There is already a running discover task for catalog %s, skipping execution", schedule.CatalogID)
		return nil
	}

	// Create discover task：这里会创建一个task然后发送到redis mq里面去
	strategiesStr := strategiesToString(schedule.Strategies)
	_, err = dss.dts.Create(ctx, schedule.CatalogID, interfaces.DiscoverTaskTriggerScheduled, schedule.ID, strategiesStr)
	if err != nil {
		otellog.LogError(ctx, "Failed to create discover task", err)
		return err
	}

	// Update last run time
	now := time.Now().UnixMilli()
	if err := dss.UpdateLastRun(ctx, schedule.ID, now); err != nil {
		otellog.LogError(ctx, "Failed to update last run time", err)
		return err
	}
	logger.Infof("Executed discover schedule: id=%s, catalog_id=%s", schedule.ID, schedule.CatalogID)
	return nil
}

// Helper functions for strategies array handling
func strategiesToString(strategies []string) string {
	if len(strategies) == 0 {
		return ""
	}
	data, err := json.Marshal(strategies)
	if err != nil {
		return ""
	}
	return string(data)
}
