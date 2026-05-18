// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package driveradapters

import (
	"context"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/kweaver-go-lib/rest"
	"github.com/robfig/cron/v3"

	verrors "vega-backend/errors"
	"vega-backend/interfaces"
)

func ValidateDiscoverScheduleRequest(ctx context.Context, req *interfaces.DiscoverScheduleRequest) error {
	if req.CatalogID == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
			WithErrorDetails("catalog_id is required")
	}
	if req.CronExpr == "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_DiscoverSchedule_InvalidCronExpr).
			WithErrorDetails("cron_expr is required")
	}
	if _, err := cron.ParseStandard(req.CronExpr); err != nil {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_DiscoverSchedule_InvalidCronExpr).
			WithErrorDetails(fmt.Sprintf("invalid cron expression: %v", err))
	}
	if len(req.Strategies) > 0 {
		if err := validateStrategies(req.Strategies); err != nil {
			return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_DiscoverSchedule_InvalidStrategies).
				WithErrorDetails(err.Error())
		}
	}
	var errDetails string
	switch {
	case req.StartTime < 0:
		errDetails = "start_time must be greater than or equal to 0"
	case req.EndTime < 0:
		errDetails = "end_time must be greater than or equal to 0"
	case req.EndTime > 0 && req.StartTime > req.EndTime:
		errDetails = "start_time must be less than or equal to end_time"
	}
	if errDetails != "" {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_DiscoverSchedule_InvalidTimeRange).
			WithErrorDetails(errDetails)
	}
	return nil
}
