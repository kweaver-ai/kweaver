package perm

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	aerr "devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/errors"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/mod"
	ierr "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	i18n "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/i18n"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
	traceCommon "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/common"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"github.com/agiledragon/gomonkey"
	"github.com/go-playground/assert/v2"
	"github.com/golang/mock/gomock"
	. "github.com/smartystreets/goconvey/convey"
	"go.mongodb.org/mongo-driver/mongo"
)

func initARLog() {
	if commonLog.NewLogger() == nil {
		logout := "1"
		logDir := "/var/log/contentAutoMation/ut"
		logName := "contentAutoMation.log"
		commonLog.InitLogger(logout, logDir, logName)
	}
	traceLog.InitARLog(&traceCommon.TelemetryConf{LogLevel: "all"})
}

func initErrorInfo() {
	i18n.InitI18nTranslator("../../" + common.MultiResourcePath)
	ierr.InitServiceName(common.ErrCodeServiceName)
}

type MockDependency struct {
	mongo *mod.MockStore
}

func NewDependency(t *testing.T) MockDependency {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	return MockDependency{
		mongo: mod.NewMockStore(ctrl),
	}
}

func NewPermChecker(dep MockDependency) *permChecker {
	initARLog()
	initErrorInfo()
	RegisterChecker(common.DagTypeDataFlow, &DataFlowDagPermChecker{})
	RegisterChecker(common.DagTypeComboOperator, &ComBoOperatorPermChecker{})
	RegisterChecker(common.DagTypeDefault, &DefaultDagPermChecker{})
	return &permChecker{
		mongo: dep.mongo,
	}
}

func TestCheckDagAndPerm(t *testing.T) {
	dependency := NewDependency(t)
	permChecker := NewPermChecker(dependency)

	user := &drivenadapters.UserInfo{}
	opMap := &MapOperationProvider{
		OpMap: map[string][]string{},
	}

	Convey("CheckDagAndPerm", t, func() {
		Convey("GetDag Error - Dag Not Found", func() {
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Times(1).Return(nil, mongo.ErrNoDocuments)
			_, err := permChecker.CheckDagAndPerm(context.Background(), "", user, opMap)
			assert.Equal(t, aerr.Is(err, aerr.TaskNotFound), true)
		})

		Convey("GetDag Error - Internal Error", func() {
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Times(1).Return(nil, fmt.Errorf("internal error"))
			_, err := permChecker.CheckDagAndPerm(context.Background(), "", user, opMap)
			assert.Equal(t, aerr.Is(err, aerr.InternalError), true)
		})

		Convey("Success case - User Has Permission", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     common.DagTypeDataFlow,
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DataFlowDagPermChecker{}), "Check",
				func(c *DataFlowDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return true, nil
				})
			defer patches.Reset()
			dependency.mongo.EXPECT().GetDagCount(gomock.Any(), gomock.Any()).Return(int64(1), nil)
			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}

			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, true, result)
			assert.Equal(t, nil, err)
		})

		Convey("Success case - User Has No Permission", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     common.DagTypeDataFlow,
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DataFlowDagPermChecker{}), "Check",
				func(c *DataFlowDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return true, nil
				})
			defer patches.Reset()
			dependency.mongo.EXPECT().GetDagCount(gomock.Any(), gomock.Any()).Return(int64(1), nil)
			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}

			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, true, result)
			assert.Equal(t, nil, err)
		})

		Convey("Error case - Invalid Type Use Default Checker", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     "dataflow",
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DefaultDagPermChecker{}), "Check",
				func(c *DefaultDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return false, fmt.Errorf("permission check failed")
				})
			defer patches.Reset()
			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}

			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, false, result)
			assert.NotEqual(t, nil, err)
		})

		Convey("Error case - CheckPerm Returns Error", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     common.DagTypeDataFlow,
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DataFlowDagPermChecker{}), "Check",
				func(c *DataFlowDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return false, fmt.Errorf("permission check failed")
				})
			defer patches.Reset()
			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}

			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, false, result)
			assert.NotEqual(t, nil, err)
		})

		Convey("Error case - GetDagCount Returns Error", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     common.DagTypeDataFlow,
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DataFlowDagPermChecker{}), "Check",
				func(c *DataFlowDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return false, nil
				})
			defer patches.Reset()
			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}
			dependency.mongo.EXPECT().GetDagCount(gomock.Any(), gomock.Any()).Return(int64(0), fmt.Errorf("get dag count failed"))

			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, false, result)
			assert.NotEqual(t, nil, err)
		})

		Convey("Error case - GetDagCount Zero", func() {
			dag := &entity.Dag{
				BaseInfo: entity.BaseInfo{ID: "test-dag-id"},
				Type:     common.DagTypeDataFlow,
				UserID:   "test-user-id",
			}
			dependency.mongo.EXPECT().GetDag(gomock.Any(), gomock.Any()).Return(dag, nil)
			patches := gomonkey.ApplyMethod(reflect.TypeOf(&DataFlowDagPermChecker{}), "Check",
				func(c *DataFlowDagPermChecker, ctx context.Context, dag *entity.Dag, userInfo *drivenadapters.UserInfo, opts ...string) (bool, error) {
					return false, nil
				})
			defer patches.Reset()

			opMap.OpMap[common.DagTypeDataFlow] = []string{"view", "modify"}
			dependency.mongo.EXPECT().GetDagCount(gomock.Any(), gomock.Any()).Return(int64(0), nil)
			result, err := permChecker.CheckDagAndPerm(context.Background(), "test-dag-id", user, opMap)
			assert.Equal(t, false, result)
			assert.NotEqual(t, nil, err)
		})

	})
}
