package actions

import (
	"encoding/json"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/vm"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

type Assign struct {
	Target string
	Value  any `json:"value"`
}

func (a *Assign) Name() string {
	return common.InternalAssignOpt
}

func (a *Assign) ParameterNew() interface{} {
	return &Assign{}
}

func (a *Assign) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*Assign)

	tokens := vm.Parse(input.Target)

	if len(tokens) != 1 || tokens[0].Type != vm.TokenVariable {
		return nil, fmt.Errorf("target must be variable")
	}

	target := tokens[0].Value.(string)

	if len(tokens[0].AccessList) == 0 {
		ctx.ShareData().Set(target, input.Value)
		return nil, nil
	}

	value, ok := ctx.ShareData().Get(target)

	if !ok {
		return nil, fmt.Errorf("variable %s not exists", target)
	}

	valueBytes, _ := json.Marshal(value)
	obj := new(interface{})
	_ = json.Unmarshal(valueBytes, obj)

	var path []any

	for _, token := range tokens[0].AccessList {
		path = append(path, token.Value)
	}

	newObj := setJson(obj, path, input.Value)

	ctx.ShareData().Set(target, newObj)

	return nil, nil
}

var _ entity.Action = (*Assign)(nil)
