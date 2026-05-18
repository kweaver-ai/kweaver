// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

// Package errors DiscoverTask 模块错误码
package errors

// DiscoverTask 相关错误码
const (
	// 404 Not Found
	VegaBackend_DiscoverTask_NotFound = "VegaBackend.DiscoverTask.NotFound"

	// 400 Bad Request
	VegaBackend_DiscoverTask_InvalidStatus = "VegaBackend.DiscoverTask.InvalidStatus"

	// 409 Conflict
	VegaBackend_DiscoverTask_HasRunningExecution = "VegaBackend.DiscoverTask.HasRunningExecution"

	// 500 Internal Server Error
	VegaBackend_DiscoverTask_InternalError_GetFailed             = "VegaBackend.DiscoverTask.InternalError.GetFailed"
	VegaBackend_DiscoverTask_InternalError_DeleteFailed          = "VegaBackend.DiscoverTask.InternalError.DeleteFailed"
	VegaBackend_DiscoverTask_InternalError_GetAccountNamesFailed = "VegaBackend.DiscoverTask.InternalError.GetAccountNamesFailed"
)

var DiscoverTaskErrCodeList = []string{
	VegaBackend_DiscoverTask_NotFound,
	VegaBackend_DiscoverTask_InvalidStatus,
	VegaBackend_DiscoverTask_HasRunningExecution,
	VegaBackend_DiscoverTask_InternalError_GetFailed,
	VegaBackend_DiscoverTask_InternalError_DeleteFailed,
	VegaBackend_DiscoverTask_InternalError_GetAccountNamesFailed,
}
