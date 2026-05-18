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

	verrors "vega-backend/errors"
	"vega-backend/interfaces"
)

func ValidateDiscoverTaskQueryParams(ctx context.Context, params interfaces.DiscoverTaskQueryParams) error {
	if params.Status != "" && !isValidDiscoverTaskStatus(params.Status) {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_DiscoverTask_InvalidStatus).
			WithErrorDetails(fmt.Sprintf("invalid status: %s", params.Status))
	}

	if params.TriggerType != "" && !isValidDiscoverTaskTriggerType(params.TriggerType) {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_InvalidParameter_RequestBody).
			WithErrorDetails(fmt.Sprintf("invalid trigger_type: %s", params.TriggerType))
	}

	return nil
}

func isValidDiscoverTaskStatus(s string) bool {
	switch s {
	case interfaces.DiscoverTaskStatusPending,
		interfaces.DiscoverTaskStatusRunning,
		interfaces.DiscoverTaskStatusCompleted,
		interfaces.DiscoverTaskStatusFailed:
		return true
	}
	return false
}

func isValidDiscoverTaskTriggerType(s string) bool {
	switch s {
	case interfaces.DiscoverTaskTriggerManual,
		interfaces.DiscoverTaskTriggerScheduled:
		return true
	}
	return false
}
