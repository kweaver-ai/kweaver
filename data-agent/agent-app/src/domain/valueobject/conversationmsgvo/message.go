package conversationmsgvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/enum/chat_enum/chatresenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentconfigvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
)

type Message struct {
	ID             string                        `json:"id"`
	ConversationID string                        `json:"conversation_id"`
	Role           cdaenum.ConversationMsgRole   `json:"role"`
	Content        interface{}                   `json:"content"`
	ContentType    chatresenum.AnswerType        `json:"content_type"`
	Status         cdaenum.ConversationMsgStatus `json:"status"`
	ReplyID        string                        `json:"reply_id"`
	AgentInfo      valueobject.AgentInfo         `json:"agent_info"`
	Index          int                           `json:"index"`
	Ext            map[string]interface{}        `json:"ext"` // 扩展字段

}

//role:user
type UserContent struct {
	Text      string                 `json:"text"`
	TempFiles []valueobject.TempFile `json:"temp_file"`
}

//role:assistant
type AssistantContent struct {
	FinalAnswer  FinalAnswer   `json:"final_answer"`
	MiddleAnswer *MiddleAnswer `json:"middle_answer"`
}

type FinalAnswer struct {
	Query                 string                  `json:"query"`
	Answer                Answer                  `json:"answer"`
	TempFiles             []valueobject.TempFile  `json:"temp_files"`
	Thinking              string                  `json:"thinking"`
	SkillProcess          []*SkillsProcessItem    `json:"skill_process"`
	AnswerTypeOther       interface{}             `json:"answer_type_other"`       // 当content_type为other时使用
	OutputVariablesConfig *agentconfigvo.Variable `json:"output_variables_config"` //output 输出变量配置

}

type SkillsProcessItem struct {
	AgentName      string             `json:"agent_name"`
	Text           string             `json:"text"`
	Cites          interface{}        `json:"cites,omitempty"`
	Status         string             `json:"status"`
	Type           string             `json:"type"`
	Thinking       string             `json:"thinking"`
	InputMessage   interface{}        `json:"input_message"`
	Interrupted    bool               `json:"interrupted"`
	RelatedQueries []*RelatedQuestion `json:"related_queries"`
}

type RelatedQuestion struct {
	Query string `json:"query"`
}

type MiddleAnswer struct {
	Progress       []*agentrespvo.Progress        `json:"progress"` // Dolphin中间执行过程展示
	DocRetrieval   *agentrespvo.DocRetrievalField `json:"doc_retrieval"`
	GraphRetrieval any                            `json:"graph_retrieval"`
	OtherVariables map[string]interface{}         `json:"other_variables"` //用于存储配置中output.variables.other_vars配置的其他变量
}

type Answer struct {
	Text  string      `json:"text"`
	Cites interface{} `json:"cites,omitempty"`
	Ask   interface{} `json:"ask,omitempty"`
}
