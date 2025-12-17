package operator

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"testing"
	"time"

	myErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/logger"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/metric"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/mocks"
	"github.com/agiledragon/gomonkey"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"
)

func TestRegisterOperatorByOpenAPI(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockDBOperatorManager := mocks.NewMockIOperatorRegisterDB(ctrl)
	mockDBAPIMetadataManager := mocks.NewMockIAPIMetadataDB(ctrl)
	mockDBTx := mocks.NewMockDBTx(ctrl)
	mockCategoryManager := mocks.NewMockCategoryManager(ctrl)
	mockUserMgnt := mocks.NewMockUserManagement(ctrl)
	mockValidator := mocks.NewMockValidator(ctrl)
	mockOpenAPIParser := mocks.NewMockIOpenAPIParser(ctrl)
	mockProxy := mocks.NewMockProxyHandler(ctrl)
	mockOpReleaseDB := mocks.NewMockIOperatorReleaseDB(ctrl)
	mockOpReleaseHistoryDB := mocks.NewMockIOperatorReleaseHistoryDB(ctrl)
	mockIntCompConfigSvc := mocks.NewMockIIntCompConfigService(ctrl)
	mockAuthService := mocks.NewMockIAuthorizationService(ctrl)
	mockAuditLog := mocks.NewMockLogModelOperator[*metric.AuditLogBuilderParams](ctrl)
	operator := &operatorManager{
		Logger:               logger.DefaultLogger(),
		DBOperatorManager:    mockDBOperatorManager,
		DBAPIMetadataManager: mockDBAPIMetadataManager,
		DBTx:                 mockDBTx,
		CategoryManager:      mockCategoryManager,
		UserMgnt:             mockUserMgnt,
		Validator:            mockValidator,
		OpenAPIParser:        mockOpenAPIParser,
		Proxy:                mockProxy,
		OpReleaseDB:          mockOpReleaseDB,
		OpReleaseHistoryDB:   mockOpReleaseHistoryDB,
		IntCompConfigSvc:     mockIntCompConfigSvc,
		AuthService:          mockAuthService,
		AuditLog:             mockAuditLog,
	}
	Convey("TestRegisterOperatorByOpenAPI:算子注册", t, func() {
		req := &interfaces.OperatorRegisterReq{
			OperatorInfo: &interfaces.OperatorInfo{
				Category: "test_category",
			},
		}
		accessor := &interfaces.AuthAccessor{}
		items := []*interfaces.PathItemContent{
			{
				Summary:    "test_summary1",
				Path:       "/test_path1",
				Method:     "POST",
				ErrMessage: "test_err_message1",
			},
			{
				Summary: "test_summary2",
				Path:    "/test_path2",
				Method:  "POST",
			},
		}
		Convey("获取accessor信息失败", func() {
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(nil, mocks.MockFuncErr("GetAccessor")).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
		})
		Convey("无新建权限", func() {
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(mocks.MockFuncErr("CheckCreatePermission")).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
		})
		Convey("分类不存在", func() {
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(false).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("元数据类型不支持", func() {
			req.OperatorInfo.Category = interfaces.CategoryTypeOther
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("解析API数据失败", func() {
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(nil, mocks.MockFuncErr("GetPathItems")).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("单次导入算子个数超出限制", func() {
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(mocks.MockFuncErr("ValidateOperatorImportCount")).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
		})
		Convey("不允许直接发布多个算子", func() {
			req.DirectPublish = true
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			_, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("算子名称不合法", func() {
			req.DirectPublish = false
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(mocks.MockFuncErr("ValidateOperatorName")).Times(1)
			resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(len(resp), ShouldEqual, 2)
			So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
			So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
		})
		Convey("算子描述不合法", func() {
			req.DirectPublish = false
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(mocks.MockFuncErr("ValidateOperatorDesc")).Times(1)
			resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(len(resp), ShouldEqual, 2)
			So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
			So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
		})
		Convey("检查重名： 查询重名算子报错（db）", func() {
			req.DirectPublish = false
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockDBOperatorManager.EXPECT().SelectByNameAndStatus(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil, mocks.MockFuncErr("SelectByNameAndStatus")).Times(1)
			resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(len(resp), ShouldEqual, 2)
			So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
			So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
		})
		Convey("检查重名： 存在重名算子", func() {
			req.DirectPublish = false
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockDBOperatorManager.EXPECT().SelectByNameAndStatus(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, &model.OperatorRegisterDB{}, nil).Times(1)
			resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(len(resp), ShouldEqual, 2)
			So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
			So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
		})
		Convey("插入数据（事件）", func() {
			req.DirectPublish = false
			req.MetadataType = interfaces.MetadataTypeAPI
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil)
			mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil)
			mockDBOperatorManager.EXPECT().SelectByNameAndStatus(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil, nil).Times(1)
			mockDBTx.EXPECT().GetTx(gomock.Any()).Return(&sql.Tx{}, nil)
			p := gomonkey.ApplyFunc((*sql.Tx).Rollback, func(*sql.Tx) error {
				return nil
			})
			defer p.Reset()
			p1 := gomonkey.ApplyFunc((*sql.Tx).Commit, func(*sql.Tx) error {
				return nil
			})
			defer p1.Reset()
			Convey("插入元数据失败（db）", func() {
				mockDBAPIMetadataManager.EXPECT().InsertAPIMetadata(gomock.Any(), gomock.Any(), gomock.Any()).Return("", mocks.MockFuncErr("InsertAPIMetadata")).Times(1)
				resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldBeNil)
				So(resp, ShouldNotBeNil)
				So(len(resp), ShouldEqual, 2)
				So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
				So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
			})
			Convey("插入算子失败（db）", func() {
				mockDBAPIMetadataManager.EXPECT().InsertAPIMetadata(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
				mockDBOperatorManager.EXPECT().InsertOperator(gomock.Any(), gomock.Any(), gomock.Any()).Return("", mocks.MockFuncErr("InsertOperator")).Times(1)
				resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldBeNil)
				So(resp, ShouldNotBeNil)
				So(len(resp), ShouldEqual, 2)
				So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
				So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
			})
			Convey("触发新建策略，创建人默认拥有对当前资源的所有操作权限, 请求失败", func() {
				mockDBAPIMetadataManager.EXPECT().InsertAPIMetadata(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
				mockDBOperatorManager.EXPECT().InsertOperator(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
				mockAuthService.EXPECT().CreateOwnerPolicy(gomock.Any(), gomock.Any(), gomock.Any()).Return(mocks.MockFuncErr("CreateOwnerPolicy")).Times(1)
				resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldBeNil)
				So(resp, ShouldNotBeNil)
				So(len(resp), ShouldEqual, 2)
				So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
				So(resp[1].Status, ShouldEqual, interfaces.ResultStatusFailed)
			})
			Convey("批量创建（不发布）算子部分成功", func() {
				mockDBAPIMetadataManager.EXPECT().InsertAPIMetadata(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
				mockDBOperatorManager.EXPECT().InsertOperator(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
				mockAuthService.EXPECT().CreateOwnerPolicy(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
				mockAuditLog.EXPECT().Logger(gomock.Any(), gomock.Any()).Times(1)
				resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldBeNil)
				So(resp, ShouldNotBeNil)
				So(len(resp), ShouldEqual, 2)
				So(resp[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
				So(resp[1].Status, ShouldEqual, interfaces.ResultStatusSuccess)
				time.Sleep(100 * time.Millisecond)
			})
		})
		Convey("直接发布", func() {
			req.DirectPublish = true
			req.MetadataType = interfaces.MetadataTypeAPI
			items := []*interfaces.PathItemContent{
				{
					Path:        "/v1/operator",
					Method:      "POST",
					Summary:     "创建算子",
					Description: "创建算子",
				},
			}
			mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil)
			mockAuthService.EXPECT().CheckCreatePermission(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return(items, nil)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
			mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil)
			mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil)
			mockDBOperatorManager.EXPECT().SelectByNameAndStatus(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil, nil).Times(1)
			mockDBTx.EXPECT().GetTx(gomock.Any()).Return(&sql.Tx{}, nil)
			p := gomonkey.ApplyFunc((*sql.Tx).Rollback, func(*sql.Tx) error {
				return nil
			})
			defer p.Reset()
			p1 := gomonkey.ApplyFunc((*sql.Tx).Commit, func(*sql.Tx) error {
				return nil
			})
			defer p1.Reset()
			mockDBAPIMetadataManager.EXPECT().InsertAPIMetadata(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
			mockDBOperatorManager.EXPECT().InsertOperator(gomock.Any(), gomock.Any(), gomock.Any()).Return("", nil).Times(1)
			mockAuthService.EXPECT().CreateOwnerPolicy(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockOpReleaseDB.EXPECT().SelectByOpID(gomock.Any(), gomock.Any()).Return(true, &model.OperatorReleaseDB{}, nil).Times(1)
			mockOpReleaseDB.EXPECT().UpdateByOpID(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockOpReleaseHistoryDB.EXPECT().Insert(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(1)
			mockAuditLog.EXPECT().Logger(gomock.Any(), gomock.Any()).Times(2)
			resp, err := operator.RegisterOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(len(resp), ShouldEqual, 1)
			So(resp[0].Status, ShouldEqual, interfaces.ResultStatusSuccess)
			time.Sleep(100 * time.Millisecond)
		})
	})
}

func TestUpdateOperatorByOpenAPI(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockDBOperatorManager := mocks.NewMockIOperatorRegisterDB(ctrl)
	mockDBAPIMetadataManager := mocks.NewMockIAPIMetadataDB(ctrl)
	mockDBTx := mocks.NewMockDBTx(ctrl)
	mockCategoryManager := mocks.NewMockCategoryManager(ctrl)
	mockUserMgnt := mocks.NewMockUserManagement(ctrl)
	mockValidator := mocks.NewMockValidator(ctrl)
	mockOpenAPIParser := mocks.NewMockIOpenAPIParser(ctrl)
	mockProxy := mocks.NewMockProxyHandler(ctrl)
	mockOpReleaseDB := mocks.NewMockIOperatorReleaseDB(ctrl)
	mockOpReleaseHistoryDB := mocks.NewMockIOperatorReleaseHistoryDB(ctrl)
	mockIntCompConfigSvc := mocks.NewMockIIntCompConfigService(ctrl)
	mockAuthService := mocks.NewMockIAuthorizationService(ctrl)
	mockAuditLog := mocks.NewMockLogModelOperator[*metric.AuditLogBuilderParams](ctrl)
	operator := &operatorManager{
		Logger:               logger.DefaultLogger(),
		DBOperatorManager:    mockDBOperatorManager,
		DBAPIMetadataManager: mockDBAPIMetadataManager,
		DBTx:                 mockDBTx,
		CategoryManager:      mockCategoryManager,
		UserMgnt:             mockUserMgnt,
		Validator:            mockValidator,
		OpenAPIParser:        mockOpenAPIParser,
		Proxy:                mockProxy,
		OpReleaseDB:          mockOpReleaseDB,
		OpReleaseHistoryDB:   mockOpReleaseHistoryDB,
		IntCompConfigSvc:     mockIntCompConfigSvc,
		AuthService:          mockAuthService,
		AuditLog:             mockAuditLog,
	}
	Convey("TestUpdateOperatorByOpenAPI: 更新算子", t, func() {
		req := &interfaces.OperatorUpdateReq{
			OperatorRegisterReq: &interfaces.OperatorRegisterReq{
				OperatorInfo:           &interfaces.OperatorInfo{},
				OperatorExecuteControl: &interfaces.OperatorExecuteControl{},
			},
		}
		Convey("解析算子失败", func() {
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(false).Times(1)
			_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("导入数据为空", func() {
			req.MetadataType = interfaces.MetadataTypeAPI
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return([]*interfaces.PathItemContent{}, nil)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
			_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("导入多条数据", func() {
			req.MetadataType = interfaces.MetadataTypeAPI
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return([]*interfaces.PathItemContent{{}, {}}, nil)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
			_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
			So(err, ShouldNotBeNil)
			httpErr := &myErr.HTTPError{}
			So(errors.As(err, &httpErr), ShouldBeTrue)
			So(httpErr.HTTPCode, ShouldEqual, http.StatusBadRequest)
		})
		Convey("编辑算子：校验失败", func() {
			req.DirectPublish = true
			req.MetadataType = interfaces.MetadataTypeAPI
			mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
			mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(), gomock.Any()).Return([]*interfaces.PathItemContent{{
				Summary:     "测试算子",
				Path:        "/test",
				Method:      "POST",
				Description: "测试算子",
			}}, nil)
			mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
			operatorDB := &model.OperatorRegisterDB{}
			accessor := &interfaces.AuthAccessor{}
			Convey("查询算子失败（db）", func() {
				mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil, mocks.MockFuncErr("SelectByOperatorID")).Times(1)
				_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldNotBeNil)
				httpErr := &myErr.HTTPError{}
				So(errors.As(err, &httpErr), ShouldBeTrue)
				So(httpErr.HTTPCode, ShouldEqual, http.StatusInternalServerError)
			})
			Convey("算子不存在", func() {
				mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil, nil).Times(1)
				_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldNotBeNil)
				httpErr := &myErr.HTTPError{}
				So(errors.As(err, &httpErr), ShouldBeTrue)
				So(httpErr.HTTPCode, ShouldEqual, http.StatusNotFound)
			})
			Convey("获取accessor信息失败", func() {
				mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, operatorDB, nil).Times(1)
				mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(nil, mocks.MockFuncErr("GetAccessorInfo")).Times(1)
				_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldNotBeNil)
			})
			Convey("检查编辑和发布权限报错,无编辑和发布权限", func() {
				mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, operatorDB, nil).Times(1)
				mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
				mockAuthService.EXPECT().MultiCheckOperationPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), interfaces.AuthOperationTypeModify,
					interfaces.AuthOperationTypePublish).Return(mocks.MockFuncErr("MultiCheckOperationPermission")).Times(1)
				_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldNotBeNil)
			})
			Convey("获取数据库事务失败", func() {
				operatorDB.MetadataType = string(interfaces.MetadataTypeAPI)
				mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, operatorDB, nil).Times(1)
				mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
				mockAuthService.EXPECT().MultiCheckOperationPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), interfaces.AuthOperationTypeModify,
					interfaces.AuthOperationTypePublish).Return(nil).Times(1)
				mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil).MaxTimes(2)
				mockDBAPIMetadataManager.EXPECT().SelectByVersion(gomock.Any(), gomock.Any()).Return(true, &model.APIMetadataDB{
					APISpec: `{}`,
				}, nil).Times(1)
				mockValidator.EXPECT().ValidatorStruct(gomock.Any(), gomock.Any()).Return(nil).Times(1)
				mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil).Times(1)
				mockDBTx.EXPECT().GetTx(gomock.Any()).Return(nil, mocks.MockFuncErr("GetTx")).Times(1)
				mockAuditLog.EXPECT().Logger(gomock.Any(), gomock.Any()).Times(1)
				editRes, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
				So(err, ShouldBeNil)
				So(editRes, ShouldNotBeNil)
				So(len(editRes), ShouldEqual, 1)
				So(editRes[0].Status, ShouldEqual, interfaces.ResultStatusFailed)
				httpErr := &myErr.HTTPError{}
				So(errors.As(editRes[0].Error, &httpErr), ShouldBeTrue)
				So(httpErr.HTTPCode, ShouldEqual, http.StatusInternalServerError)
				time.Sleep(100 * time.Millisecond)
			})
		})
		// Convey("校验成功", func() {
		// 	req.DirectPublish = true
		// 	req.MetadataType = interfaces.MetadataTypeAPI
		// 	mockCategoryManager.EXPECT().CheckCategory(gomock.Any()).Return(true).Times(1)
		// 	mockOpenAPIParser.EXPECT().GetPathItems(gomock.Any(),gomock.Any()).Return([]*interfaces.PathItemContent{{
		// 		Summary:     "测试算子",
		// 		Path:        "/test",
		// 		Method:      "POST",
		// 		Description: "测试算子",
		// 	}}, nil)
		// 	mockValidator.EXPECT().ValidateOperatorImportCount(gomock.Any(), gomock.Any()).Return(nil)
		// 	operatorDB := &model.OperatorRegisterDB{
		// 		MetadataType: string(interfaces.MetadataTypeAPI),
		// 	}
		// 	accessor := &interfaces.AuthAccessor{}
		// 	mockDBOperatorManager.EXPECT().SelectByOperatorID(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, operatorDB, nil).Times(1)
		// 	mockAuthService.EXPECT().GetAccessor(gomock.Any(), gomock.Any()).Return(accessor, nil).Times(1)
		// 	mockAuthService.EXPECT().OperationCheckAll(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), interfaces.AuthOperationTypeModify,
		// 		interfaces.AuthOperationTypePublish).Return(true, nil).Times(1)
		// 	mockValidator.EXPECT().ValidateOperatorName(gomock.Any(), gomock.Any()).Return(nil).MaxTimes(2)
		// 	mockDBAPIMetadataManager.EXPECT().SelectByVersion(gomock.Any(), gomock.Any()).Return(true, &model.APIMetadataDB{
		// 		APISpec: `{}`,
		// 	}, nil).Times(1)
		// 	mockValidator.EXPECT().ValidatorStruct(gomock.Any(), gomock.Any()).Return(nil).Times(1)
		// 	mockValidator.EXPECT().ValidateOperatorDesc(gomock.Any(), gomock.Any()).Return(nil).Times(1)
		// 	Convey("", func() {

		// 		_, err := operator.UpdateOperatorByOpenAPI(context.TODO(), req, "")
		// 		fmt.Println(err)
		// 		So(err, ShouldNotBeNil)
		// 	})

		// })
	})
}
