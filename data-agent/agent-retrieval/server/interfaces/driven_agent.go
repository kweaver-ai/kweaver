package interfaces

import "context"

// ChatRequest 聊天请求
type ChatRequest struct {
	AgentKey     string         `json:"agent_key"`                                // agent key
	AgentVersion string         `json:"agent_version,omitempty" default:"latest"` // agent 版本,默认请求最新版本
	Stream       bool           `json:"stream"`                                   // 是否流式返回
	Query        string         `json:"query"`                                    // 用户提问问题
	CustomQuerys map[string]any `json:"custom_querys"`                            // 输入配置中的自定义输入变量
}

type Answer struct {
	Text string `json:"text"` // 回答内容
}

// FinalAnswer 最终结果
type FinalAnswer struct {
	Query  string  `json:"query"`  // 原始查询
	Answer *Answer `json:"answer"` // 回答
}

type ChatContent struct {
	FinalAnswer *FinalAnswer `json:"final_answer"` // 最终结果
}

// ChatMessage 消息内容
type ChatMessage struct {
	ID             string       `json:"id"`              // 消息ID
	ConversationID string       `json:"conversation_id"` // 会话ID
	Role           string       `json:"role"`            // 消息角色
	Content        *ChatContent `json:"content"`         // 消息内容
}

// ChatResponse 聊天响应
type ChatResponse struct {
	ConversationID     string       `json:"conversation_id"`      // 会话ID
	UserMessageID      string       `json:"user_message_id"`      // 用户消息ID
	AssistantMessageID string       `json:"assistant_message_id"` // 助手消息ID
	Message            *ChatMessage `json:"message"`              // 消息内容
}

// ConceptIntentionAnalysisAgentReq 概念意图分析智能体请求
type ConceptIntentionAnalysisAgentReq struct {
	PreviousQueries []string `json:"previous_queries"` // 历史查询
	Query           string   `json:"query"`            // 当前查询
	KnID            string   `json:"kn_id"`            // 知识网络ID
}

// ConceptRetrievalStrategistReq 概念召回策略智能体请求
type ConceptRetrievalStrategistReq struct {
	QueryParam      *ConceptRetrievalStrategistQueryParam `json:"query_param"`      // 概念召回策略智能体Query
	PreviousQueries []string                              `json:"previous_queries"` // 历史查询
	KnID            string                                `json:"kn_id"`            // 知识网络ID
}

// ConceptRetrievalStrategistQueryParam 概念召回策略智能体Query
type ConceptRetrievalStrategistQueryParam struct {
	OriginalQuery        string               `json:"original_query"`         // 原始查询
	CurrentIntentSegment *SemanticQueryIntent `json:"current_intent_segment"` // 当前意图片段
	ConceptCandidates    []*ConceptResult     `json:"concept_candidates"`     // 概念候选集
}

// AgentApp 智能体接口
type AgentApp interface {
	APIChat(ctx context.Context, req *ChatRequest) (*ChatResponse, error)
	// ConceptIntentionAnalysisAgent 概念意图分析智能体
	ConceptIntentionAnalysisAgent(ctx context.Context, req *ConceptIntentionAnalysisAgentReq) (*QueryUnderstanding, error)
	// ConceptRetrievalStrategistAgent 概念召回策略智能体
	ConceptRetrievalStrategistAgent(ctx context.Context, req *ConceptRetrievalStrategistReq) ([]*SemanticQueryStrategy, error)
}
