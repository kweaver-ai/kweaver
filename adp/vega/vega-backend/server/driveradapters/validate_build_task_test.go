// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package driveradapters

import (
	"context"
	"testing"

	. "github.com/smartystreets/goconvey/convey"

	"vega-backend/interfaces"
)

func Test_ValidateBuildTaskQueryParams(t *testing.T) {
	Convey("Test ValidateBuildTaskQueryParams\n", t, func() {
		ctx := context.Background()

		Convey("Valid empty params\n", func() {
			err := ValidateBuildTaskQueryParams(ctx, interfaces.BuildTasksQueryParams{})
			So(err, ShouldBeNil)
		})

		Convey("Valid status and mode\n", func() {
			err := ValidateBuildTaskQueryParams(ctx, interfaces.BuildTasksQueryParams{
				Status: interfaces.BuildTaskStatusCompleted,
				Mode:   interfaces.BuildTaskModeBatch,
			})
			So(err, ShouldBeNil)
		})

		Convey("Invalid status\n", func() {
			err := ValidateBuildTaskQueryParams(ctx, interfaces.BuildTasksQueryParams{
				Status: "unknown",
			})
			So(err, ShouldNotBeNil)
		})

		Convey("Invalid mode\n", func() {
			err := ValidateBuildTaskQueryParams(ctx, interfaces.BuildTasksQueryParams{
				Mode: "unknown",
			})
			So(err, ShouldNotBeNil)
		})
	})
}
