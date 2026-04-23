package common

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/mocks"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"
)

func TestImport(t *testing.T) {
	Convey("TestImport", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockImpex := mocks.NewMockIComponentImpexConfig(ctrl)
		mockValidator := mocks.NewMockValidator(ctrl)
		handler := &impexHandler{
			ComponentImpexConfig: mockImpex,
			Validator:            mockValidator,
		}

		mockValidator.EXPECT().ValidatorStruct(gomock.Any(), gomock.AssignableToTypeOf(&interfaces.ImportConfigReq{})).Return(nil)
		mockImpex.EXPECT().ImportConfig(gomock.Any(), gomock.AssignableToTypeOf(&interfaces.ImportConfigReq{})).DoAndReturn(
			func(_ interface{}, req *interfaces.ImportConfigReq) error {
				So(req.Type, ShouldEqual, interfaces.ComponentTypeToolBox)
				So(req.Mode, ShouldEqual, interfaces.ImportTypeUpsert)
				So(string(req.Data), ShouldEqual, `{"toolbox":{"configs":[]}}`)
				return nil
			},
		)

		recorder := performMultipartImportRequest(http.MethodPost, "/impex/:type", "/impex/toolbox", map[string]string{
			"user_id":           "user_id",
			"x-business-domain": "bd_001",
		}, map[string]string{
			"mode": "upsert",
		}, "data", `{"toolbox":{"configs":[]}}`, handler.Import)

		So(recorder.Code, ShouldEqual, http.StatusCreated)
	})
}

func TestImportInternal(t *testing.T) {
	Convey("TestImportInternal", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		mockImpex := mocks.NewMockIComponentImpexConfig(ctrl)
		mockValidator := mocks.NewMockValidator(ctrl)
		handler := &impexHandler{
			ComponentImpexConfig: mockImpex,
			Validator:            mockValidator,
		}

		mockValidator.EXPECT().ValidatorStruct(gomock.Any(), gomock.AssignableToTypeOf(&interfaces.InternalImportConfigReq{})).Return(nil)
		mockValidator.EXPECT().ValidatorIntCompVersion(gomock.Any(), "0.6.0").Return(nil)
		mockImpex.EXPECT().ImportConfigInternal(gomock.Any(), gomock.AssignableToTypeOf(&interfaces.InternalImportConfigReq{})).DoAndReturn(
			func(_ interface{}, req *interfaces.InternalImportConfigReq) (*interfaces.InternalImportConfigResp, error) {
				So(req.Type, ShouldEqual, interfaces.ComponentTypeToolBox)
				So(req.PackageVersion, ShouldEqual, "0.6.0")
				So(string(req.Data), ShouldEqual, `{"toolbox":{"configs":[]}}`)
				return &interfaces.InternalImportConfigResp{
					Status: interfaces.InternalImportStatusSkipped,
					Type:   interfaces.ComponentTypeToolBox,
				}, nil
			},
		)

		recorder := performMultipartImportRequest(http.MethodPost, "/impex/intcomp/import/:type", "/impex/intcomp/import/toolbox", map[string]string{
			"user_id": "system",
		}, map[string]string{
			"mode":            "upsert",
			"package_version": "0.6.0",
		}, "data", `{"toolbox":{"configs":[]}}`, handler.ImportInternal)

		So(recorder.Code, ShouldEqual, http.StatusCreated)
	})
}

func performMultipartImportRequest(method, routePath, requestPath string, headers map[string]string, fields map[string]string,
	fileField, fileContent string, handler func(c *gin.Context)) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Handle(method, routePath, handler)

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		_ = writer.WriteField(key, value)
	}
	part, _ := writer.CreateFormFile(fileField, "import.adp")
	_, _ = part.Write([]byte(fileContent))
	_ = writer.Close()

	req := httptest.NewRequest(method, requestPath, &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)
	return recorder
}

func TestSetRawData(t *testing.T) {
	Convey("TestSetRawData", t, func() {
		data := json.RawMessage(`{"toolbox":{"configs":[]}}`)
		req := &interfaces.ImportConfigReq{}

		err := setRawData(req, data)

		So(err, ShouldBeNil)
		So(req.Data, ShouldResemble, data)
	})
}
