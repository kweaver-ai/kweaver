package mod

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/log"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm/state"
	liberrors "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/errors"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"go.mongodb.org/mongo-driver/mongo"
)

type VMExt struct {
	*vm.VM

	dagIns *entity.DagInstance `json:"-"`
	logger traceLog.Logger     `json:"-"`
	userID string              `json:"-"`
}

func NewVMExt(ctx context.Context, dagIns *entity.DagInstance, userID string) *VMExt {
	dagIns.ShareData.Save = nil
	vmIns := &VMExt{
		VM:     vm.NewVM(),
		dagIns: dagIns,
		logger: traceLog.WithContext(ctx),
		userID: userID,
	}

	vmIns.SetContext(ctx)
	vmIns.AddFuncs(compareFuncs)
	vmIns.AddGlobals(NewGlobals(dagIns))
	vmIns.SetExtfunc(NewExtFunc(vmIns, dagIns, userID))
	vmIns.SetHook(vmIns)
	return vmIns
}

func (vmIns *VMExt) LoadDag(dag *entity.Dag) (err error) {
	steps := dag.Steps

	if len(steps) == 0 {
		return
	}

	g := vm.NewGenerator(vmIns.VM)
	err = g.GenerateTrigger(&steps[0])

	if err != nil {
		return
	}

	for _, step := range steps[1:] {
		err = g.GenerateStep(&step)
		if err != nil {
			return
		}
	}

	vmIns.LoadInstructions(g.Instructions)
	return nil
}

func (vmIns *VMExt) HandleDagInsError(err error) {
	ctx := vmIns.Context()
	store := GetStore()
	dagIns := vmIns.dagIns

	patch := &entity.DagInstance{
		BaseInfo: dagIns.BaseInfo,
		EndedAt:  time.Now().Unix(),
		Status:   entity.DagInstanceStatusFailed,
	}

	if dbErr := store.PatchDagIns(ctx, patch); dbErr != nil {
		log.Warnf("[VMExt.HandleDagInsError] PatchDagIns err: %s", dbErr.Error())
	}

	go dagIns.SendErrorCallback(err)
}

func (vmIns *VMExt) Boot() error {
	ctx := vmIns.Context()
	store := GetStore()
	dagIns, logger := vmIns.dagIns, vmIns.logger

	if dagIns == nil {
		err := errors.New("invalid dagIns")
		logger.Warnf("[VMExt.Boot] err: %s", err.Error())
		return err
	}

	if dagIns.Mode != entity.DagInstanceModeVM {
		err := fmt.Errorf("invalid dagIns: id %s, mode %v", dagIns.ID, dagIns.Mode)
		logger.Warnf("[VMExt.Boot] err: %s", err.Error())
		return err
	}

	switch dagIns.Status {
	case entity.DagInstanceStatusBlocked,
		entity.DagInstanceStatusCancled,
		entity.DagInstanceStatusFailed,
		entity.DagInstanceStatusInit,
		entity.DagInstanceStatusSuccess:
		err := fmt.Errorf("invalid dagIns: id %s, status %v", dagIns.ID, dagIns.Status)
		logger.Warnf("[VMExt.Boot] err: %s", err.Error())
		return err
	default:
		locked := dagIns.Lock(300 * time.Second)
		if locked {
			defer func() { dagIns.Unlock() }()
			if dagIns.Status == entity.DagInstanceStatusScheduled {
				if err := store.PatchDagIns(ctx, &entity.DagInstance{
					BaseInfo: dagIns.BaseInfo,
					Status:   entity.DagInstanceStatusRunning}); err != nil {
					vmIns.HandleDagInsError(err)
					return err
				}
				dagIns.Status = entity.DagInstanceStatusRunning
			}
		} else {
			if dagIns.Status == entity.DagInstanceStatusRunning {
				if err := store.PatchDagIns(ctx, &entity.DagInstance{
					BaseInfo: dagIns.BaseInfo,
					Status:   entity.DagInstanceStatusScheduled}); err != nil {
					vmIns.HandleDagInsError(err)
					return err
				}
			}
			return nil
		}
	}

	dag, err := store.GetDagWithOptionalVersion(ctx, dagIns.DagID, dagIns.VersionID)

	if err != nil {
		logger.Warnf("[VMExt.Boot] GetDag err, deail: %s", err.Error())

		if errors.Is(err, mongo.ErrNoDocuments) {
			err = liberrors.NewPublicRestError(ctx, liberrors.PErrorNotFound,
				liberrors.PErrorNotFound,
				map[string]string{"dagId": dagIns.DagID})
		} else {
			err = liberrors.NewPublicRestError(ctx, liberrors.PErrorInternalServerError,
				liberrors.PErrorInternalServerError,
				nil)
		}
		vmIns.HandleDagInsError(err)
		return err
	}

	if dagIns.Dump == "" {
		if err := vmIns.LoadDag(dag); err != nil {
			vmIns.HandleDagInsError(err)
			return err
		}
		vmIns.Run()
		return nil
	}

	if err := json.Unmarshal([]byte(dagIns.Dump), vmIns); err != nil {
		err = fmt.Errorf("invalid dagIns dump: id %s", dagIns.ID)
		vmIns.HandleDagInsError(err)
		return err
	}

	switch vmIns.State {
	case state.Wait:
		rets := make([]any, 1)
		if err := json.Unmarshal([]byte(dagIns.ResumeData), &rets); err != nil {
			vmIns.ResumeError(errors.New("invalid return values"))
			return err
		}

		if dagIns.ResumeStatus == entity.TaskInstanceStatusSuccess {
			vmIns.Resume(rets...)
		} else {
			vmIns.ResumeError(liberrors.NewPublicRestError(ctx,
				liberrors.PErrorInternalServerError,
				liberrors.PErrorInternalServerError, rets[0]))
		}
	default:
		vmIns.Start()
	}

	return nil
}
