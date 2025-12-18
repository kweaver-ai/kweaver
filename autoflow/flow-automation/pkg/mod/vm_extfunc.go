package mod

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/actions"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/dependency"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/utils"
)

type extfunc struct {
	vm           *VMExt
	dagIns       *entity.DagInstance
	userID       string
	varsGetter   utils.KeyValueGetter
	varsIterator utils.KeyValueIterator
	taskIns      *entity.TaskInstance
	patchTask    func(context.Context, *entity.TaskInstance) error
}

func NewExtFunc(vm *VMExt, dagIns *entity.DagInstance, userID string) vm.Func {
	return &extfunc{
		vm:           vm,
		dagIns:       dagIns,
		userID:       userID,
		varsGetter:   dagIns.VarsGetter(),
		varsIterator: dagIns.VarsIterator(),
		taskIns:      nil,
		patchTask: func(ctx context.Context, instance *entity.TaskInstance) error {
			return GetStore().PatchTaskIns(ctx, instance)
		},
	}
}

func (f *extfunc) getToken(name string) (token *entity.Token, err error) {
	if strings.HasPrefix(name, "@anyshare") ||
		strings.HasPrefix(name, "@custom") ||
		strings.HasPrefix(name, "@operator") ||
		name == common.MannualTrigger ||
		name == common.CronTrigger ||
		name == common.CronWeekTrigger ||
		name == common.CronMonthTrigger ||
		name == common.CronCustomTrigger ||
		name == common.InternalToolPy3Opt ||
		name == common.AnyshareFileOCROpt ||
		name == common.AudioTransfer ||
		name == common.DocInfoEntityExtract ||
		name == common.DataflowDocTrigger ||
		name == common.DataflowUserTrigger ||
		name == common.DataflowDeptTrigger ||
		name == common.DataflowTagTrigger ||
		name == common.OpAnyDataCallAgent ||
		name == common.OpLLMChatCompletion ||
		name == common.OpContentEntity ||
		name == common.OpEcoconfigReindex ||
		name == common.DatabaseWriteOpt ||
		name == common.OpLLMReranker ||
		name == common.OpLLmEmbedding ||
		name == common.OpContentFileParse {
		tokenMgnt := NewTokenMgnt(f.userID)
		return tokenMgnt.GetUserToken("", f.userID)
	}

	return
}

func (f *extfunc) Call(ctx context.Context, name string, _ int, args ...interface{}) (wait bool, rets []interface{}, err error) {

	action, ok := ActionMap[name]

	var params interface{}
	var taskInsParams map[string]interface{}

	if ok {
		if paramAct, ok := action.(entity.ParameterAction); ok {
			if len(args) == 0 {
				err = fmt.Errorf("call %s failed, missing parameter", name)
				return
			}

			params = paramAct.ParameterNew()
			err = weakDecode(args[0], params)

			if err != nil {
				err = fmt.Errorf("call %s failed, invalid parameter", name)
				return
			}

			if p, ok := args[0].(map[string]interface{}); ok {
				taskInsParams = p
			}
		}
	} else if strings.HasPrefix(name, "@custom/") {
		segment := strings.Split(name, "/")

		if len(segment) != 3 {
			return false, rets, fmt.Errorf("invalid action: %s", name)
		}

		customAction := &actions.CustomAction{}

		if executorID, err := strconv.ParseUint(segment[1], 10, 64); err != nil {
			return false, rets, fmt.Errorf("invalid action: %s", name)
		} else {
			customAction.ExecutorID = executorID
		}

		if actionID, err := strconv.ParseUint(segment[2], 10, 64); err != nil {
			return false, rets, fmt.Errorf("invalid action: %s", name)
		} else {
			customAction.ActionID = actionID
		}

		if len(args) > 0 {
			if p, ok := args[0].(map[string]interface{}); ok {
				taskInsParams = p
				customAction.Parameters = p
			}
		}

		params, action, ok = customAction, customAction, true
	} else if strings.HasPrefix(name, "@operator/") {
		if len(args) == 0 {
			err = fmt.Errorf("call %s failed, missing parameter", name)
			return
		}
		act := &actions.ComboOperator{}
		err = weakDecode(args[0], act)

		if err != nil {
			err = fmt.Errorf("call %s failed, invalid parameter", name)
			return
		}

		act.Operator = name

		if p, ok := args[0].(map[string]interface{}); ok {
			taskInsParams = p
		}

		params, action, ok = act, act, true
	} else if strings.HasPrefix(name, common.TriggerOperatorPrefix) {
		if len(args) == 0 {
			err = fmt.Errorf("call %s failed, missing parameter", name)
			return
		}
		act := &actions.TriggerOperator{}
		err = weakDecode(args[0], act)

		if err != nil {
			err = fmt.Errorf("call %s failed, invalid parameter", name)
			return
		}

		act.Operator = name

		if p, ok := args[0].(map[string]interface{}); ok {
			taskInsParams = p
		}

		params, action, ok = act, act, true
	}

	if ok {
		taskIns := &entity.TaskInstance{
			TaskID:             f.GetTaskID(),
			DagInsID:           f.dagIns.ID,
			Name:               f.GetTaskTitle(),
			ActionName:         name,
			Params:             taskInsParams,
			Status:             entity.TaskInstanceStatusRunning,
			Patch:              f.patchTask,
			Context:            f,
			RelatedDagInstance: f.dagIns,
			TimeoutSecs:        1 * 10e9,
		}

		instances, dbErr := GetStore().BatchCreateTaskIns(f.Context(), []*entity.TaskInstance{taskIns})

		if dbErr != nil {
			return false, rets, dbErr
		}

		taskIns = instances[0]
		f.taskIns = taskIns

		defer func() {
			f.taskIns = nil
		}()

		patch := &entity.TaskInstance{
			BaseInfo: taskIns.BaseInfo,
			Status:   entity.TaskInstanceStatusRunning,
		}

		if beforeAct, ok := action.(entity.BeforeAction); ok {
			beforeRunStatus, err := beforeAct.RunBefore(f, params)

			if err != nil {
				patch.Status = entity.TaskInstanceStatusFailed
				patch.Reason = err.Error()
				_ = taskIns.Patch(f.Context(), patch)
				return false, rets, err
			}

			patch.Status = beforeRunStatus
		}

		token, err := f.getToken(name)

		if err != nil {
			patch.Status = entity.TaskInstanceStatusFailed
			patch.Reason = err.Error()
			_ = taskIns.Patch(f.Context(), patch)
			return false, rets, err
		}

		ret, err := action.Run(f, params, token)

		if err != nil {
			patch.Status = entity.TaskInstanceStatusFailed
			patch.Reason = err.Error()
			_ = taskIns.Patch(f.Context(), patch)
			return false, rets, err
		}

		if afterAct, ok := action.(entity.AfterAction); ok {
			afterRunStatus, err := afterAct.RunAfter(f, params)
			if err != nil {
				patch.Status = entity.TaskInstanceStatusFailed
				patch.Reason = err.Error()
				_ = taskIns.Patch(f.Context(), patch)
				return false, rets, err
			}

			patch.Status = afterRunStatus
		}

		wait = patch.Status == entity.TaskInstanceStatusBlocked

		if !wait {
			patch.Status = entity.TaskInstanceStatusSuccess
		}

		patch.Results = ret

		if err := taskIns.Patch(f.Context(), patch); err != nil {
			return false, rets, err
		}

		rets = append(rets, ret)
		return wait, rets, err
	}

	err = fmt.Errorf("func %s not found", name)

	return
}

// ExecuteContext
func (f *extfunc) Context() context.Context {
	return f.vm.Context()
}

func (f *extfunc) GetParam(paramName string) (interface{}, bool) {
	return nil, false
}

func (f *extfunc) GetTaskID() string {
	if frame := f.vm.CallFrame(); frame != nil {
		return frame.Label
	}
	return ""
}

func (f *extfunc) GetTaskTitle() string {
	if frame := f.vm.CallFrame(); frame != nil {
		return frame.Title
	}
	return ""
}

func (f *extfunc) GetTaskInstance() *entity.TaskInstance {
	return f.taskIns
}

func (f *extfunc) GetVar(varName string) (interface{}, bool) {
	return f.varsGetter(varName)
}

func (f *extfunc) IterateVars(iterateFunc utils.KeyValueIterateFunc) {
	f.varsIterator(iterateFunc)
}

func (f *extfunc) NewASDoc() drivenadapters.Efast {
	return drivenadapters.NewEfast()
}

func (f *extfunc) NewExecuteMethods() entity.ExecuteMethods {

	getDag := func(ctx context.Context, id, versionID string) (*entity.Dag, error) {
		return GetStore().GetDagWithOptionalVersion(ctx, id, versionID)
	}

	return entity.ExecuteMethods{
		Publish: NewMQHandler().Publish,
		GetDag:  getDag,
	}
}

func (f *extfunc) NewRepo() dependency.Repo {
	return dependency.NewDriven()
}

func (f *extfunc) SetContext(ctx context.Context) {
	f.vm.SetContext(ctx)
}

func (f *extfunc) ShareData() entity.ShareDataOperator {
	return f.dagIns.ShareData
}

func (f *extfunc) Trace(ctx context.Context, msg string, opt ...entity.TraceOp) {
	if f.taskIns != nil {
		f.taskIns.Trace(ctx, msg, opt...)
	}
}

func splitArgsAndOpt(a ...interface{}) ([]interface{}, []entity.TraceOp) {
	optStartIndex := len(a)
	for i := len(a) - 1; i >= 0; i -= 1 {
		if _, ok := a[i].(entity.TraceOp); !ok {
			optStartIndex = i + 1
			break
		}
		if i == 0 {
			optStartIndex = 0
		}
	}

	var traceOps []entity.TraceOp
	for i := optStartIndex; i < len(a); i++ {
		traceOps = append(traceOps, a[i].(entity.TraceOp))
	}

	return a[:optStartIndex], traceOps
}

func (f *extfunc) Tracef(ctx context.Context, msg string, a ...interface{}) {
	if f.taskIns != nil {
		args, ops := splitArgsAndOpt(a...)
		f.taskIns.Trace(ctx, fmt.Sprintf(msg, args...), ops...)
	}
}

func (f *extfunc) WithValue(key interface{}, value interface{}) {
}

// IsDebug returns true if the task is in debug mode.
// Debug mode is enabled by setting "single_debug" to "true" in the dagIns's runVars.
// In debug mode, the task will not write any trace to the database.
// This can be useful for testing tasks without polluting the database with test data.
func (e *extfunc) IsDebug() bool {
	if v, ok := e.varsGetter("single_debug"); ok {
		return v == "true"
	}

	return false
}

var _ entity.ExecuteContext = (*extfunc)(nil)
var _ vm.Func = (*extfunc)(nil)
