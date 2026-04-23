package impex

import (
	"context"
	"database/sql"
	"net/http"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/infra/errors"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/interfaces"
	"github.com/kweaver-ai/adp/execution-factory/operator-integration/server/mocks"
	. "github.com/smartystreets/goconvey/convey"
	"go.uber.org/mock/gomock"
)

func TestImportConfigInternal(t *testing.T) {
	Convey("TestImportConfigInternal", t, func() {
		ctrl := gomock.NewController(t)
		defer ctrl.Finish()

		validator := mocks.NewMockValidator(ctrl)
		toolboxMgr := mocks.NewMockIToolService(ctrl)
		dbTx := mocks.NewMockDBTx(ctrl)

		manager := &componentImpexManager{
			Validator:  validator,
			ToolboxMgr: toolboxMgr,
			DBTx:       dbTx,
		}

		ctx := context.Background()
		req := &interfaces.InternalImportConfigReq{
			Type:           interfaces.ComponentTypeToolBox,
			Mode:           interfaces.ImportTypeUpsert,
			PackageVersion: "0.6.0",
			Data: []byte(`{
				"toolbox": {
					"configs": [{
						"box_id": "toolbox_001",
						"box_name": "执行工厂工具集",
						"box_desc": "desc",
						"category": "other_category",
						"status": "published",
						"tools": [{
							"tool_id": "tool_001",
							"name": "tool_a",
							"description": "desc",
							"status": "enabled",
							"metadata_type": "function",
							"metadata": {
								"name": "tool_a",
								"description": "desc",
								"parameters": {
									"type": "object"
								}
							}
						}]
					}]
				}
			}`),
		}

		Convey("当前版本大于等于待导入版本时跳过", func() {
			validator.EXPECT().ValidatorStruct(ctx, gomock.Any()).Return(nil)
			toolboxMgr.EXPECT().GetToolBox(ctx, &interfaces.GetToolBoxReq{
				UserID: interfaces.SystemUser,
				BoxID:  "toolbox_001",
			}, false).Return(&interfaces.ToolBoxToolInfo{
				BoxID:   "toolbox_001",
				BoxName: "执行工厂工具集_0.6.0",
			}, nil)

			resp, err := manager.ImportConfigInternal(ctx, req)

			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(resp.Status, ShouldEqual, interfaces.InternalImportStatusSkipped)
			So(resp.ResourceIDs, ShouldResemble, []string{"toolbox_001"})
		})

		Convey("当前版本低于待导入版本时更新", func() {
			validator.EXPECT().ValidatorStruct(ctx, gomock.Any()).Return(nil)
			toolboxMgr.EXPECT().GetToolBox(ctx, &interfaces.GetToolBoxReq{
				UserID: interfaces.SystemUser,
				BoxID:  "toolbox_001",
			}, false).Return(&interfaces.ToolBoxToolInfo{
				BoxID:   "toolbox_001",
				BoxName: "执行工厂工具集_0.5.0",
			}, nil)

			db, sqlMock, err := sqlmock.New()
			So(err, ShouldBeNil)
			defer db.Close()
			sqlMock.ExpectBegin()
			sqlMock.ExpectCommit()

			tx, err := db.Begin()
			So(err, ShouldBeNil)

			dbTx.EXPECT().GetTx(ctx).Return(tx, nil)
			toolboxMgr.EXPECT().Import(ctx, tx, interfaces.ImportTypeUpsert, gomock.Any(), interfaces.SystemUser).DoAndReturn(
				func(_ context.Context, _ *sql.Tx, _ interfaces.ImportType, data *interfaces.ComponentImpexConfigModel, _ string) error {
					So(data.Toolbox, ShouldNotBeNil)
					So(len(data.Toolbox.Configs), ShouldEqual, 1)
					So(data.Toolbox.Configs[0].BoxName, ShouldEqual, "执行工厂工具集_0.6.0")
					return nil
				},
			)

			resp, err := manager.ImportConfigInternal(ctx, req)

			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(resp.Status, ShouldEqual, interfaces.InternalImportStatusUpdated)
			So(sqlMock.ExpectationsWereMet(), ShouldBeNil)
		})

		Convey("资源不存在时直接导入", func() {
			validator.EXPECT().ValidatorStruct(ctx, gomock.Any()).Return(nil)
			toolboxMgr.EXPECT().GetToolBox(ctx, &interfaces.GetToolBoxReq{
				UserID: interfaces.SystemUser,
				BoxID:  "toolbox_001",
			}, false).Return(nil, errors.DefaultHTTPError(ctx, http.StatusNotFound, "not found"))

			db, sqlMock, err := sqlmock.New()
			So(err, ShouldBeNil)
			defer db.Close()
			sqlMock.ExpectBegin()
			sqlMock.ExpectCommit()

			tx, err := db.Begin()
			So(err, ShouldBeNil)

			dbTx.EXPECT().GetTx(ctx).Return(tx, nil)
			toolboxMgr.EXPECT().Import(ctx, tx, interfaces.ImportTypeUpsert, gomock.Any(), interfaces.SystemUser).Return(nil)

			resp, err := manager.ImportConfigInternal(ctx, req)

			So(err, ShouldBeNil)
			So(resp, ShouldNotBeNil)
			So(resp.Status, ShouldEqual, interfaces.InternalImportStatusImported)
			So(sqlMock.ExpectationsWereMet(), ShouldBeNil)
		})
	})
}

func TestParseVersionFromToolboxName(t *testing.T) {
	Convey("TestParseVersionFromToolboxName", t, func() {
		Convey("标准 semver 后缀可以解析", func() {
			version, ok := parseVersionFromToolboxName("执行工厂工具集_0.6.0")
			So(ok, ShouldBeTrue)
			So(version, ShouldEqual, "0.6.0")
		})

		Convey("紧凑版本后缀可以解析", func() {
			version, ok := parseVersionFromToolboxName("contextloader工具集_060")
			So(ok, ShouldBeTrue)
			So(version, ShouldEqual, "0.6.0")
		})

		Convey("无版本后缀时返回未解析", func() {
			version, ok := parseVersionFromToolboxName("执行工厂工具集")
			So(ok, ShouldBeFalse)
			So(version, ShouldEqual, "")
		})
	})
}

func TestEnsureToolboxNameVersion(t *testing.T) {
	Convey("TestEnsureToolboxNameVersion", t, func() {
		Convey("缺少版本时自动补齐包版本", func() {
			name := ensureToolboxNameVersion("执行工厂工具集", "0.6.0")
			So(name, ShouldEqual, "执行工厂工具集_0.6.0")
		})

		Convey("已有版本后缀时保持原值", func() {
			name := ensureToolboxNameVersion("contextloader工具集_060", "0.7.0")
			So(name, ShouldEqual, "contextloader工具集_060")
		})
	})
}

func TestCompareSemanticVersions(t *testing.T) {
	Convey("TestCompareSemanticVersions", t, func() {
		Convey("低版本返回 -1", func() {
			result, err := compareSemanticVersions("0.5.0", "0.6.0")
			So(err, ShouldBeNil)
			So(result, ShouldEqual, -1)
		})

		Convey("同版本返回 0", func() {
			result, err := compareSemanticVersions("0.6.0", "0.6.0")
			So(err, ShouldBeNil)
			So(result, ShouldEqual, 0)
		})

		Convey("高版本返回 1", func() {
			result, err := compareSemanticVersions("0.7.0", "0.6.0")
			So(err, ShouldBeNil)
			So(result, ShouldEqual, 1)
		})

		Convey("非法版本格式返回错误", func() {
			_, err := compareSemanticVersions("060", "0.6.0")
			So(err, ShouldNotBeNil)
		})
	})
}
