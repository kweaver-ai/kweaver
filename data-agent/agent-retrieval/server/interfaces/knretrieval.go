package interfaces

import "context"

const MaxMatchScore float64 = 100 // 最大匹配分

// SemanticQueryStrategyType 语义查询策略类型
type SemanticQueryStrategyType string

const (
	ConceptGetStrategy              SemanticQueryStrategyType = "concept_get"               // 概念获取
	ConceptDiscoveryStrategy        SemanticQueryStrategyType = "concept_discovery"         // 概念发现
	ObjectInstanceDiscoveryStrategy SemanticQueryStrategyType = "object_instance_discovery" // 对象实例发现
)

// KnBaseConceptField 业务知识网络概念基础字段
type KnBaseConceptField string

const (
	ConceptFieldID    KnBaseConceptField = "id"     // 概念ID
	ConceptFieldName  KnBaseConceptField = "name"   // 概念名称
	ConceptFieldScore KnBaseConceptField = "_score" // 匹配分数
	ConceptFieldAny   KnBaseConceptField = "*"      // 任意字段
)

// SemanticQueryMode 语义检索策略模式
type SemanticQueryMode string

const (
	AgentIntentPlanning    SemanticQueryMode = "agent_intent_planning"    // 基于智能体意图分析与规划策略
	AgentIntentRetrieval   SemanticQueryMode = "agent_intent_retrieval"   // 意图分析智能体 + 传统召回策略
	KeywordVectorRetrieval SemanticQueryMode = "keyword_vector_retrieval" // 基于关键词+向量召回
)

// SearchScopeConfig 搜索域配置
type SearchScopeConfig struct {
	ConceptGroups        []string `json:"concept_groups"`
	IncludeObjectTypes   *bool    `json:"include_object_types" default:"true"`
	IncludeRelationTypes *bool    `json:"include_relation_types" default:"true"`
	IncludeActionTypes   *bool    `json:"include_action_types" default:"true"`
}

// KnowledgeConcept 业务知识网络概念定义
type KnowledgeConcept struct {
	ConceptType KnConceptType `json:"concept_type"` // 概念类型
	ConceptID   string        `json:"concept_id"`   // 概念id
	ConceptName string        `json:"concept_name"` // 概念名称
}

// SemanticQueryIntent 语义查询意图
type SemanticQueryIntent struct {
	QuerySegment      string              `json:"query_segment"`      // 查询片段
	Confidence        float32             `json:"confidence"`         // 置信度
	Reasoning         string              `json:"reasoning"`          // 推理
	RequiresReasoning bool                `json:"requires_reasoning"` // 是否需要进一步推理
	RelatedConcepts   []*KnowledgeConcept `json:"related_concepts"`   // 相关概念
}

// QueryStrategyCondition 策略筛选条件
type QueryStrategyCondition struct {
	Field     string `json:"field"`     // 字段名称
	Operation string `json:"operation"` // 操作符
	Value     any    `json:"value"`     // 字段值
}

// QueryStrategyFilter 查询策略筛选项
type QueryStrategyFilter struct {
	ConceptType KnConceptType             `json:"concept_type"` // 概念类型
	ConceptID   string                    `json:"concept_id"`   // 概念类ID
	ConceptIDs  []string                  `json:"concept_ids"`  // 概念类IDs
	Conditions  []*QueryStrategyCondition `json:"conditions"`   // 筛选条件
}

// SemanticQueryStrategy 语义查询策略
type SemanticQueryStrategy struct {
	StrategyType SemanticQueryStrategyType `json:"strategy_type"` // 策略类型
	Filter       *QueryStrategyFilter      `json:"filter"`        // 筛选条件
}

// QueryUnderstanding 查询理解
type QueryUnderstanding struct {
	OriginQuery    string                   `json:"origin_query"`    // 原始Query
	ProcessedQuery string                   `json:"processed_query"` // 处理后的Query
	Intent         []*SemanticQueryIntent   `json:"intent"`          // 语义查询意图
	QueryStrategys []*SemanticQueryStrategy `json:"query_strategy"`  // 语义查询策略
}

// SemanticSearchRequest 语义搜索请求
type SemanticSearchRequest struct {
	Mode                     SemanticQueryMode         `form:"mode" validate:"required,oneof=keyword_vector_retrieval agent_intent_planning agent_intent_retrieval" default:"keyword_vector_retrieval"` // 语义检索策略模式
	RerankAction             KnowledgeRerankActionType `json:"rerank_action" validate:"required,oneof=llm vector" default:"vector"`                                                                     // 操作:llm基于大模型做排序，vector基于向量
	ReturnQueryUnderstanding *bool                     `json:"return_query_understanding" default:"false"`                                                                                              // 是否返回查询理解信息
	Query                    string                    `json:"query" validate:"required"`                                                                                                               // 用户Query
	KnID                     string                    `json:"kn_id" validate:"required"`                                                                                                               // 业务知识网络id
	PreviousQueries          []string                  `json:"previous_queries"`                                                                                                                        // 历史Query
	SearchScope              *SearchScopeConfig        `json:"search_scope"`                                                                                                                            // 搜索域配置
	MaxConcepts              int                       `json:"max_concepts" default:"10"`                                                                                                               // 最大概念数
}

// ConceptResult 概念结果
type ConceptResult struct {
	ConceptType   KnConceptType `json:"concept_type"`   //概念类型
	ConceptID     string        `json:"concept_id"`     //概念id
	ConceptName   string        `json:"concept_name"`   // 概念名称
	ConceptDetail any           `json:"concept_detail"` //概念详情
	IntentScore   float64       `json:"intent_score"`   // 意图分
	MatchScore    float64       `json:"match_score"`    // 匹配分
	RerankScore   float64       `json:"rerank_score"`   // 重排分
	Samples       []any         `json:"samples"`        // 样本
}

type SemanticSearchResponse struct {
	QueryUnderstanding *QueryUnderstanding `json:"query_understanding,omitempty" validate:"required"` // 查询理解
	KnowledgeConcepts  []*ConceptResult    `json:"concepts" validate:"required"`                      // 业务知识网络概念
	HitsTotal          int                 `json:"hits_total"`                                        // 概念命中总数
}

// IKnRetrievalService 基于业务知识网络检索服务
type IKnRetrievalService interface {
	// AgentIntentPlanning 语义检索: 基于意图分析智能体+规划策略
	AgentIntentPlanning(ctx context.Context, req *SemanticSearchRequest) (*SemanticSearchResponse, error)
	// AgentIntentRetrieval 语义检索: 基于意图分析智能体+召回策略
	AgentIntentRetrieval(ctx context.Context, req *SemanticSearchRequest) (resp *SemanticSearchResponse, err error)
	// KeywordVectorRetrieval 语义检索: 基于关键词+向量召回
	KeywordVectorRetrieval(ctx context.Context, req *SemanticSearchRequest) (resp *SemanticSearchResponse, err error)
}
