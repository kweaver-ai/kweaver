package driveradapters

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
	"github.com/golang/mock/gomock"
	. "github.com/smartystreets/goconvey/convey"

	"flow-stream-data-pipeline/common"
)

var (
	testCtx = context.WithValue(context.Background(), rest.XLangKey, rest.DefaultLanguage)
)

func setGinMode() func() {
	old := gin.Mode()
	gin.SetMode(gin.TestMode)
	return func() {
		gin.SetMode(old)
	}
}

func mockNewRestHandler(appSetting *common.AppSetting) (r *restHandler) {
	r = &restHandler{
		appSetting: appSetting,
	}
	return r
}

func Test_RestHandler_HealthCheck(t *testing.T) {
	Convey("Test HealthCheck\n", t, func() {
		test := setGinMode()
		defer test()

		engine := gin.New()
		engine.Use(gin.Recovery())

		mockCtrl := gomock.NewController(t)
		defer mockCtrl.Finish()

		appSetting := &common.AppSetting{}
		handler := mockNewRestHandler(appSetting)
		handler.RegisterPublic(engine)

		url := "/health"

		Convey("TestHealthCheck Success \n", func() {
			req := httptest.NewRequest(http.MethodGet, url, nil)
			w := httptest.NewRecorder()
			engine.ServeHTTP(w, req)

			So(w.Result().StatusCode, ShouldEqual, http.StatusOK)
		})
	})
}
