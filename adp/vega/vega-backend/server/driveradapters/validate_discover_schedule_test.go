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

func Test_ValidateDiscoverScheduleRequest(t *testing.T) {
	Convey("Test ValidateDiscoverScheduleRequest\n", t, func() {
		validReq := func() *interfaces.DiscoverScheduleRequest {
			return &interfaces.DiscoverScheduleRequest{
				CatalogID:  "catalog-1",
				CronExpr:   "*/5 * * * *",
				StartTime:  1000,
				EndTime:    2000,
				Strategies: []string{"insert", "update"},
			}
		}

		Convey("Valid request\n", func() {
			err := ValidateDiscoverScheduleRequest(context.Background(), validReq())
			So(err, ShouldBeNil)
		})

		Convey("Missing catalog ID\n", func() {
			req := validReq()
			req.CatalogID = ""
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Missing cron expression\n", func() {
			req := validReq()
			req.CronExpr = ""
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Invalid cron expression\n", func() {
			req := validReq()
			req.CronExpr = "invalid"
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Invalid strategy\n", func() {
			req := validReq()
			req.Strategies = []string{"unknown"}
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Invalid time range\n", func() {
			req := validReq()
			req.StartTime = 2000
			req.EndTime = 1000
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Valid time range without end time\n", func() {
			req := validReq()
			req.StartTime = 0
			req.EndTime = 0
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldBeNil)
		})

		Convey("Negative start time\n", func() {
			req := validReq()
			req.StartTime = -1
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})

		Convey("Negative end time\n", func() {
			req := validReq()
			req.EndTime = -1
			err := ValidateDiscoverScheduleRequest(context.Background(), req)
			So(err, ShouldNotBeNil)
		})
	})
}
