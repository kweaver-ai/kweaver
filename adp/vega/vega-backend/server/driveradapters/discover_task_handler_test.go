// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package driveradapters

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"

	"vega-backend/common"
	"vega-backend/interfaces"
	vmock "vega-backend/interfaces/mock"
)

func Test_DiscoverTaskRestHandler_ListDiscoverTasks(t *testing.T) {
	Convey("Test DiscoverTaskHandler ListDiscoverTasks\n", t, func() {
		test := setGinMode()
		defer test()

		engine := gin.New()
		engine.Use(gin.Recovery())

		mockCtrl := gomock.NewController(t)
		defer mockCtrl.Finish()

		dts := vmock.NewMockDiscoverTaskService(mockCtrl)
		handler := MockNewRestHandler(&common.AppSetting{}, nil, nil, nil, nil, nil, nil, dts, nil, nil, nil)
		handler.RegisterPublic(engine)

		url := "/api/vega-backend/in/v1/discover-tasks"

		Convey("Invalid offset\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?offset=-1", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Offset")
		})

		Convey("Invalid limit\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?limit=99999999", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Limit")
		})

		Convey("Invalid sort field\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?sort=unknown_field", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Sort")
		})

		Convey("Invalid direction\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?direction=foo", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Direction")
		})

		Convey("Invalid trigger type\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?trigger_type=foo", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "invalid trigger_type")
		})

		Convey("Success with default pagination\n", func() {
			dts.EXPECT().List(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, params interfaces.DiscoverTaskQueryParams) ([]*interfaces.DiscoverTask, int64, error) {
					So(params.Offset, ShouldEqual, 0)
					So(params.Limit, ShouldEqual, 20)
					So(params.Sort, ShouldEqual, "f_create_time")
					So(params.Direction, ShouldEqual, interfaces.DESC_DIRECTION)
					return []*interfaces.DiscoverTask{}, int64(0), nil
				})

			req := httptest.NewRequest(http.MethodGet, url, nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})

		Convey("Success with explicit query params\n", func() {
			dts.EXPECT().List(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, params interfaces.DiscoverTaskQueryParams) ([]*interfaces.DiscoverTask, int64, error) {
					So(params.CatalogID, ShouldEqual, "cat-1")
					So(params.ScheduleID, ShouldEqual, "sch-1")
					So(params.Status, ShouldEqual, interfaces.DiscoverTaskStatusCompleted)
					So(params.TriggerType, ShouldEqual, interfaces.DiscoverTaskTriggerScheduled)
					So(params.Offset, ShouldEqual, 5)
					So(params.Limit, ShouldEqual, 10)
					So(params.Sort, ShouldEqual, "f_start_time")
					So(params.Direction, ShouldEqual, interfaces.ASC_DIRECTION)
					return []*interfaces.DiscoverTask{}, int64(0), nil
				})

			req := httptest.NewRequest(http.MethodGet, url+"?catalog_id=cat-1&schedule_id=sch-1&status=completed&trigger_type=scheduled&offset=5&limit=10&sort=start_time&direction=asc", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})
	})
}
