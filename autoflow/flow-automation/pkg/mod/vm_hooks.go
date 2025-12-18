package mod

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/log"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm/hook"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm/state"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/utils"
	liberrors "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
)

func (vm *VMExt) HookBeforeAssign(id string, target string, value any) {
	taskIns := &entity.TaskInstance{
		TaskID:     id,
		DagInsID:   vm.dagIns.ID,
		ActionName: common.InternalAssignOpt,
		Params: map[string]any{
			"target": target,
			"value":  value,
		},
		Status: entity.TaskInstanceStatusSuccess,
	}

	_, err := GetStore().BatchCreateTaskIns(vm.Context(), []*entity.TaskInstance{taskIns})

	if err != nil {
		vm.logger.Warnf("[VMExt.HookBeforeAssign] BatchCreateTaskIns err: %s", err.Error())
	}
}

func (vm *VMExt) HookBranchSkip(id string) {
	taskIns := &entity.TaskInstance{
		TaskID:     id,
		DagInsID:   vm.dagIns.ID,
		ActionName: common.BranchOpt,
		Status:     entity.TaskInstanceStatusSkipped,
	}

	_, err := GetStore().BatchCreateTaskIns(vm.Context(), []*entity.TaskInstance{taskIns})

	if err != nil {
		vm.logger.Warnf("[VMExt.HookBranchSkip] BatchCreateTaskIns err: %s", err.Error())
	}
}

func (vm *VMExt) HookBranchStart(id string) {
	taskIns := &entity.TaskInstance{
		TaskID:     id,
		DagInsID:   vm.dagIns.ID,
		ActionName: common.BranchOpt,
		Status:     entity.TaskInstanceStatusSuccess,
	}

	_, err := GetStore().BatchCreateTaskIns(vm.Context(), []*entity.TaskInstance{taskIns})

	if err != nil {
		vm.logger.Warnf("[VMExt.HookBranchStart] BatchCreateTaskIns err: %s", err.Error())
	}
}

func (vm *VMExt) HookLoopStart(id string, value any) {
	taskIns := &entity.TaskInstance{
		TaskID:     id,
		DagInsID:   vm.dagIns.ID,
		ActionName: common.Loop,
		Results:    value,
		Status:     entity.TaskInstanceStatusSuccess,
	}

	_, err := GetStore().BatchCreateTaskIns(vm.Context(), []*entity.TaskInstance{taskIns})

	if err != nil {
		vm.logger.Warnf("[VMExt.HookLoopStart] BatchCreateTaskIns err: %s", err.Error())
	}
}

func (vm *VMExt) HookBeforeReturn(id string, value any) {
	taskIns := &entity.TaskInstance{
		TaskID:     id,
		DagInsID:   vm.dagIns.ID,
		ActionName: common.InternalReturnOpt,
		Results:    value,
		Status:     entity.TaskInstanceStatusSuccess,
	}

	_, err := GetStore().BatchCreateTaskIns(vm.Context(), []*entity.TaskInstance{taskIns})

	if err != nil {
		vm.logger.Warnf("[VMExt.HookBeforeReturn] BatchCreateTaskIns err: %s", err.Error())
	}
}

func (vm *VMExt) HookVMStop() {
	ctx := vm.Context()
	now := time.Now()

	bytes, err := json.Marshal(vm)

	if err != nil {
		vm.logger.Warnf("[VMExt.HookVMStop] PatchDagIns err, detail: %s", err.Error())
		return
	}

	patch := &entity.DagInstance{
		BaseInfo:  vm.dagIns.BaseInfo,
		DagID:     vm.dagIns.DagID,
		Dump:      string(bytes),
		ShareData: vm.dagIns.ShareData,
		EndedAt:   now.Unix(),
	}

	vmState, data, vmErr := vm.Result()

	switch vmState {
	case state.Done:
		patch.Status = entity.DagInstanceStatusSuccess
		vm.logger.Infof("[VMExt.HookVMStop] 运行完成: %v\n", data)
		go vm.dagIns.SendSuccessCallback(data)

	case state.Error:
		patch.Status = entity.DagInstanceStatusFailed
		log.Infof("[VMExt.HookVMStop] 运行失败: %v\n", vmErr)
		go vm.dagIns.SendErrorCallback(
			liberrors.NewPublicRestError(context.Background(), liberrors.PErrorInternalServerError,
				liberrors.PErrorInternalServerError,
				vmErr))

	case state.Wait:
		log.Infof("[VMExt.HookVMStop] 运行挂起\n")
		patch.Status = entity.DagInstanceStatusBlocked
	}

	if err := patch.SaveExtData(context.Background()); err != nil {
		log.Warnf("[VMExt.HookVMStop] SaveExtData err, detail: %s", err.Error())
		return
	}

	if err = GetStore().PatchDagIns(ctx, patch); err != nil {
		log.Warnf("[VMExt.HookVMStop] PatchDagIns err, detail: %s", err.Error())
	}

	go vm.AfterStopLog(ctx, vm.dagIns, patch.Status)
}

func (vm *VMExt) AfterStopLog(ctx context.Context, dagIns *entity.DagInstance, status entity.DagInstanceStatus) {
	if status != entity.DagInstanceStatusFailed && status != entity.DagInstanceStatusSuccess {
		return
	}

	// 流程执行成功删除所有task信息
	if status == entity.DagInstanceStatusSuccess {
		dErr := GetStore().DeleteTaskInsByDagInsID(context.Background(), dagIns.ID)
		if dErr != nil {
			log.Warnf("run success,delete task instance failed: %s", dErr.Error())
		}
	}

	dag, err := GetStore().GetDagWithOptionalVersion(ctx, dagIns.DagID, dagIns.VersionID)
	if err != nil {
		log.Warnf("[logic.AfterStopLog] get dag[%s] failed: %s", dagIns.DagID, err)
		return
	}

	if dag.IsDebug {
		return
	}

	var detail string

	bodyType := common.CompleteTaskWithFailed
	if dagIns.Status == entity.DagInstanceStatusSuccess {
		bodyType = common.CompleteTaskWithSuccess
	}
	detail, _ = common.GetLogBody(bodyType, []interface{}{dag.Name}, []interface{}{})

	object := map[string]interface{}{
		"type":          dag.Trigger,
		"id":            dagIns.ID,
		"dagId":         dagIns.DagID,
		"name":          dag.Name,
		"priority":      dagIns.Priority,
		"status":        status,
		"biz_domain_id": utils.IfNot(dag.BizDomainID == "", common.BizDomainDefaultID, dag.BizDomainID),
	}

	if len(dag.Type) != 0 {
		object["dagType"] = dag.Type
	} else {
		object["dagType"] = common.DagTypeDefault
	}

	if dagIns.EndedAt < dagIns.CreatedAt {
		endedAt := time.Now().Unix()
		object["duration"] = endedAt - dagIns.CreatedAt
	} else {
		object["duration"] = dagIns.EndedAt - dagIns.CreatedAt
	}

	varsGetter := dagIns.VarsGetter()
	userID, _ := varsGetter("operator_id")
	userType, _ := varsGetter("operator_type")

	var userInfo drivenadapters.UserInfo
	userInfo, err0 := drivenadapters.NewUserManagement().GetUserInfoByType(fmt.Sprintf("%v", userID), fmt.Sprintf("%v", userType))
	if err0 != nil {
		log.Warnf("[logic.AfterStopLog] GetUserInfoByType failed: %s", err0.Error())
		userName, _ := varsGetter("operator_name")
		userInfo = drivenadapters.UserInfo{
			UserID:   fmt.Sprintf("%v", userID),
			UserName: fmt.Sprintf("%v", userName),
			Type:     fmt.Sprintf("%v", userType),
		}
	}
	userInfo.VisitorType = common.AuthenticatedUserType

	drivenadapters.NewLogger().LogO11y(&drivenadapters.BuildARLogParams{
		Operation:   common.ArLogEndDagIns,
		Description: detail,
		UserInfo:    &userInfo,
		Object:      object,
	}, &drivenadapters.O11yLogWriter{Logger: traceLog.NewFlowO11yLogger()})
}

var _ hook.BeforeAssign = (*VMExt)(nil)
var _ hook.BeforeReturn = (*VMExt)(nil)
var _ hook.LoopStart = (*VMExt)(nil)
var _ hook.BranchStart = (*VMExt)(nil)
var _ hook.BranchSkip = (*VMExt)(nil)
var _ hook.VMStop = (*VMExt)(nil)
