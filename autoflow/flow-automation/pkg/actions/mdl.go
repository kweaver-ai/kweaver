package actions

import (
	"fmt"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

type MDLDataViewTrigger struct{}

// Name implements entity.Action.
func (m *MDLDataViewTrigger) Name() string {
	return common.MDLDataViewTrigger
}

func (m *MDLDataViewTrigger) ParameterNew() interface{} {
	return &MDLDataViewTrigger{}
}

// Run implements entity.Action.
func (m *MDLDataViewTrigger) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	id := ctx.GetTaskID()

	result := make(map[string]any)
	originalResult, ok := ctx.ShareData().Get("__" + id)
	if !ok {
		ctx.Trace(ctx.Context(), "run end")
		return result, nil
	}

	resultMap, ok := originalResult.(map[string]any)
	if !ok {
		ctx.Trace(ctx.Context(), "run end")
		return result, nil
	}

	if status, ok := resultMap["status"]; ok && status == string(entity.TaskInstanceStatusFailed) {
		return nil, fmt.Errorf("trigger error")
	}

	data, ok := resultMap["data"]
	if !ok {
		ctx.Trace(ctx.Context(), "run end")
		return result, nil
	}

	dataArr, ok := data.([]any)
	if !ok {
		ctx.Trace(ctx.Context(), "run end")
		return result, nil
	}

	if len(dataArr) > 10 {
		result["summary"] = fmt.Sprintf("共 %d 条数据，仅显示前 10 条", len(dataArr))
		result["data"] = dataArr[0:10]
	} else {
		result["data"] = dataArr
	}

	ctx.Trace(ctx.Context(), "run end")
	return result, nil
}

var _ entity.Action = (*MDLDataViewTrigger)(nil)
