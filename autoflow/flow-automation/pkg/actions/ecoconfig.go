package actions

import (
	"fmt"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/store"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

type EcoconfigReindex struct {
	DocID    string   `json:"docid"`
	PartType []string `json:"part_type"`
}

// Name implements entity.Action.
func (a *EcoconfigReindex) Name() string {
	return common.OpEcoconfigReindex
}

func (a *EcoconfigReindex) ParameterNew() interface{} {
	return &EcoconfigReindex{}
}

// Run implements entity.Action.
func (a *EcoconfigReindex) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error

	input := params.(*EcoconfigReindex)

	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	ecoconfig := drivenadapters.NewEcoconfig()
	ctx.Trace(newCtx, "run start", entity.TraceOpPersistAfterAction)

	docID := input.DocID

	if len(docID) >= 32 {
		docID = docID[len(docID)-32:]
	}

	taskIns := ctx.GetTaskInstance()
	statusKey := fmt.Sprintf("__status_%s", taskIns.ID)
	code, err := ecoconfig.Reindex(ctx.Context(), docID, strings.Join(input.PartType, ","))
	if err != nil {
		//403 为重复索引，当为重复索引时，状态调整为：成功
		if code == 403 {
			ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
			return nil, nil
		} else {
			ctx.ShareData().Set(statusKey, "error")
			return nil, err
		}
	}

	taskBlockKey := fmt.Sprintf("%s%s", entity.EcoconfigReindexKeyPrefix, docID)
	redis := store.NewRedis()
	client := redis.GetClient()

	err = client.HSet(ctx.Context(), taskBlockKey, taskIns.ID, "").Err()
	if err != nil {
		ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
	} else {
		_ = client.Expire(ctx.Context(), taskBlockKey, time.Hour*24).Err()
		ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusBlocked)
	}

	return map[string]interface{}{}, nil
}

func (a *EcoconfigReindex) RunAfter(ctx entity.ExecuteContext, _ interface{}) (entity.TaskInstanceStatus, error) {
	taskIns := ctx.GetTaskInstance()
	statusKey := fmt.Sprintf("__status_%s", taskIns.ID)
	status, ok := ctx.ShareData().Get(statusKey)
	if ok && status == entity.TaskInstanceStatusBlocked {
		return entity.TaskInstanceStatusBlocked, nil
	}

	return entity.TaskInstanceStatusSuccess, nil
}

var _ entity.Action = (*EcoconfigReindex)(nil)
