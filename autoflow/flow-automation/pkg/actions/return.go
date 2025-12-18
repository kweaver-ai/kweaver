package actions

import (
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

const (
	OpReturn            = "@internal/return"
	ReturnResultSuccess = "success"
	ReturnResultFailed  = "failed"
)

type Return struct {
}

type ReturnParam struct {
	Result string `json:"result"`
}

func (a *Return) Name() string {
	return OpReturn
}

func (r *Return) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*ReturnParam)

	return input.Result, nil
}

func (r *Return) ParameterNew() interface{} {
	return &ReturnParam{}
}
