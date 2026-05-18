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

func ValidateBuildTaskQueryParams(ctx context.Context, params interfaces.BuildTasksQueryParams) error {
	if params.Status != "" && !isValidBuildTaskStatus(params.Status) {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_BuildTask_InvalidStatus).
			WithErrorDetails(fmt.Sprintf("invalid status: %s", params.Status))
	}

	if params.Mode != "" && !isValidBuildTaskMode(params.Mode) {
		return rest.NewHTTPError(ctx, http.StatusBadRequest, verrors.VegaBackend_BuildTask_InvalidParameter_Mode).
			WithErrorDetails(fmt.Sprintf("invalid mode: %s", params.Mode))
	}

	return nil
}

func isValidBuildTaskStatus(s string) bool {
	switch s {
	case interfaces.BuildTaskStatusInit,
		interfaces.BuildTaskStatusRunning,
		interfaces.BuildTaskStatusStopping,
		interfaces.BuildTaskStatusStopped,
		interfaces.BuildTaskStatusCompleted,
		interfaces.BuildTaskStatusFailed:
		return true
	}
	return false
}

func isValidBuildTaskMode(m string) bool {
	switch m {
	case interfaces.BuildTaskModeStreaming,
		interfaces.BuildTaskModeBatch:
		return true
	}
	return false
}
