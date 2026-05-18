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

func Test_DiscoverScheduleRestHandler_ListDiscoverSchedules(t *testing.T) {
	Convey("Test DiscoverScheduleHandler ListDiscoverSchedules\n", t, func() {
		test := setGinMode()
		defer test()

		engine := gin.New()
		engine.Use(gin.Recovery())

		mockCtrl := gomock.NewController(t)
		defer mockCtrl.Finish()

		dss := vmock.NewMockDiscoverScheduleService(mockCtrl)
		handler := MockNewRestHandler(&common.AppSetting{}, nil, nil, nil, nil, nil, nil, nil, dss, nil, nil)
		handler.RegisterPublic(engine)

		url := "/api/vega-backend/in/v1/discover-schedules"

		Convey("Invalid offset\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?offset=-1", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Offset")
		})

		Convey("Invalid offset non-numeric\n", func() {
			req := httptest.NewRequest(http.MethodGet, url+"?offset=abc", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusBadRequest)
			So(w.Body.String(), ShouldContainSubstring, "VegaBackend.InvalidParameter.Offset")
		})

		Convey("Invalid limit exceeds max\n", func() {
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

		Convey("Success with default pagination\n", func() {
			dss.EXPECT().List(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, params interfaces.DiscoverScheduleQueryParams) ([]*interfaces.DiscoverSchedule, int64, error) {
					So(params.Offset, ShouldEqual, 0)
					So(params.Limit, ShouldEqual, 20)
					So(params.Sort, ShouldEqual, "f_update_time")
					So(params.Direction, ShouldEqual, interfaces.DESC_DIRECTION)
					return []*interfaces.DiscoverSchedule{}, int64(0), nil
				})

			req := httptest.NewRequest(http.MethodGet, url, nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})

		Convey("Success with explicit sort and direction\n", func() {
			dss.EXPECT().List(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, params interfaces.DiscoverScheduleQueryParams) ([]*interfaces.DiscoverSchedule, int64, error) {
					So(params.Sort, ShouldEqual, "f_next_run")
					So(params.Direction, ShouldEqual, interfaces.ASC_DIRECTION)
					So(params.Offset, ShouldEqual, 5)
					So(params.Limit, ShouldEqual, 10)
					return []*interfaces.DiscoverSchedule{}, int64(0), nil
				})

			req := httptest.NewRequest(http.MethodGet, url+"?sort=next_run&direction=asc&offset=5&limit=10", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})

		Convey("Success with catalog_id and enabled filters preserved\n", func() {
			dss.EXPECT().List(gomock.Any(), gomock.Any()).
				DoAndReturn(func(_ context.Context, params interfaces.DiscoverScheduleQueryParams) ([]*interfaces.DiscoverSchedule, int64, error) {
					So(params.CatalogID, ShouldEqual, "cat-1")
					So(params.Enabled, ShouldNotBeNil)
					So(*params.Enabled, ShouldBeTrue)
					return []*interfaces.DiscoverSchedule{}, int64(0), nil
				})

			req := httptest.NewRequest(http.MethodGet, url+"?catalog_id=cat-1&enabled=true", nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})
	})
}
