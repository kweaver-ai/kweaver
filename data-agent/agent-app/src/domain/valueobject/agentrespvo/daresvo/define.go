package daresvo

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentconfigvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
)

var DefOutputConf = &agentconfigvo.OutputVariablesS{
	AnswerVar:           "answer",
	DocRetrievalVar:     "doc_retrieval_res",
	GraphRetrievalVar:   "graph_retrieval_res",
	RelatedQuestionsVar: "related_questions",
	//OtherVars:           []string{"search_querys", "search_results"},
	OtherVars: []string{},
}

// DataAgentRes 表示数据代理响应的结构体
type DataAgentRes struct {
	Answer *agentrespvo.AnswerS `json:"answer"`
	// UserDefine map[string]interface{} `json:"user_define,omitempty"`
	Ask    interface{} `json:"ask"`
	Status string      `json:"status"`
	Error  interface{} `json:"error"`

	finalAnswerVarHelper      *ResHelper
	docRetrievalVarHelper     *ResHelper
	graphRetrievalVarHelper   *ResHelper
	relatedQuestionsVarHelper *ResHelper
	otherVarsHelper           *ResHelper
	middleOutputVarsHelper    *ResHelper
}

func NewDataAgentRes(ctx context.Context, data []byte, outputVariablesS *agentconfigvo.OutputVariablesS) (*DataAgentRes, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	r := &DataAgentRes{
		Answer: agentrespvo.NewAnswerS(),
		// UserDefine: make(map[string]interface{}),
	}

	err = r.loadFromMessage(data)
	if err != nil {
		// panic(err)
		err = errors.Wrapf(err, "loadFromMessage error: %s", string(data))
		return nil, err
	}

	r.finalAnswerVarHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeFinalAnswer)
	r.docRetrievalVarHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeDocRetrieval)
	r.graphRetrievalVarHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeGraphRetrieval)
	r.relatedQuestionsVarHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeRelatedQuestions)
	r.otherVarsHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeOther)
	r.middleOutputVarsHelper = NewResHelper(r.Answer, outputVariablesS, VarFieldTypeMiddleOutputVars)

	return r, nil
}

func (r *DataAgentRes) loadFromMessage(msg []byte) (err error) {
	err = sonic.Unmarshal(msg, r)
	return
}

func (r *DataAgentRes) GetAnswerHelper() *ResHelper {
	return r.finalAnswerVarHelper
}
