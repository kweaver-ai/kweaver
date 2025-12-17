package agentfactorydto

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"

type Field struct {
	Name string `json:"name"`
	Type string `json:"type"`
}
type Rewrite struct {
	Enable    bool      `json:"enable"`
	LLMConfig LLMConfig `json:"llm_config"`
}
type AugmentDatasource struct {
	Kg []Kg `json:"kg"`
}
type Kg struct {
	KgID            string   `json:"kg_id"`
	Fields          []string `json:"fields"`
	FieldProperties []string `json:"field_properties"`
	OutputFields    []string `json:"output_fields"`
}
type DocField struct {
	Name   string `json:"name"`
	Path   string `json:"path"`
	Source string `json:"source"`
}
type Doc struct {
	DsID   string     `json:"ds_id"`
	Fields []DocField `json:"fields"`
}

type Augment struct {
	Enable     bool              `json:"enable"`
	Datasource AugmentDatasource `json:"data_source"`
}
type LLMConfig struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ModelType string `json:"model_type"`

	Temperature      float64 `json:"temperature"`
	TopP             float64 `json:"top_p"`
	TopK             int     `json:"top_k"`
	FrequencyPenalty float64 `json:"frequency_penalty"`
	PresencePenalty  float64 `json:"presence_penalty"`
	MaxTokens        int     `json:"max_tokens"`
}

type TempZoneConfig struct {
	Name                    string   `json:"name"`
	MaxFileCount            int      `json:"max_file_count"`
	SingleFileSizeLimit     int      `json:"single_file_size_limit"`
	SingleFileSizeLimitUnit string   `json:"single_file_size_limit_unit"`
	SupportDataType         []string `json:"support_data_type"`
	AllowedFileCategories   []string `json:"allowed_file_categories"`
	AllowedFileTypes        []string `json:"allowed_file_types"`
	TempFileUseType         string   `json:"tmp_file_use_type"`
}

type AgentConfigInput struct {
	Fields            []Field        `json:"fields"`
	Rewrite           Rewrite        `json:"rewrite"`
	Augment           Augment        `json:"augment"`
	IsTempZoneEnabled int            `json:"is_temp_zone_enabled"`
	TempZoneConfig    TempZoneConfig `json:"temp_zone_config"`
}

type AgentConfigOutput struct {
	DefaultFormat string   `json:"default_format"`
	Variables     Variable `json:"variables"`
}

type Variable struct {
	AnswerVar           string   `json:"answer_var"`
	DocRetrievalVar     string   `json:"doc_retrieval_var"`
	GraphRetrievalVar   string   `json:"graph_retrieval_var"`
	RelatedQuestionsVar string   `json:"related_questions_var"`
	OtherVars           []string `json:"other_vars"`
}

type Answer struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type AgentDatasource struct {
	Kg  []Kg  `json:"kg"`
	Doc []Doc `json:"doc"`
}
type AgentAdvancedConfig struct {
	Kg  KgAdvancedConfig  `json:"kg"`
	Doc DocAdvancedConfig `json:"doc"`
}
type KgAdvancedConfig struct {
	TextMatchEntityNums   int     `json:"text_match_entity_nums"`
	VectorMatchEntityNums int     `json:"vector_match_entity_nums"`
	GraphRagTopk          int     `json:"graph_rag_topk"`
	LongTextLength        int     `json:"long_text_length"`
	RerankerSimThreshold  float64 `json:"reranker_sim_threshold"`
	RetrievalMaxLength    int     `json:"retrieval_max_length"`
}
type DocAdvancedConfig struct {
	RetrievalSlicesNum int     `json:"retrieval_slices_num"`
	MaxSlicePerCite    int     `json:"max_slice_per_cite"`
	RerankTopk         int     `json:"rerank_topk"`
	SliceHeadNum       int     `json:"slice_head_num"`
	SliceTailNum       int     `json:"slice_tail_num"`
	DocumentsNum       int     `json:"documents_num"`
	DocumentThreshold  float64 `json:"document_threshold"`
	RetrievalMaxLength int     `json:"retrieval_max_length"`
}

type AgentConfigLLM struct {
	IsDefault bool      `json:"is_default"`
	LLMConfig LLMConfig `json:"llm_config"`
}

type Tool struct {
	ToolType           string      `json:"tool_type"`
	ToolName           string      `json:"tool_name"`
	ToolID             string      `json:"tool_id"`
	ToolBoxID          string      `json:"tool_box_id"`
	ToolUseDescription string      `json:"tool_use_description"`
	ToolInput          interface{} `json:"tool_input"`
	Intervention       bool        `json:"intervention"` // 中断配置
}

//	type AgentConfig struct {
//		Input                AgentConfigInput    `json:"input"`
//		SystemPrompt         string              `json:"system_prompt"`
//		Dolphin              string              `json:"dolphin"`
//		IsDolphinMode        int                 `json:"is_dolphin_mode"`
//		Datasource           AgentDatasource     `json:"datasource"`
//		Tools                []Tool              `json:"tools"`
//		LLMs                 []LLMConfig         `json:"llms"`
//		IsDataflowSetEnabled int                 `json:"is_data_flow_set_enabled"`
//		OpeningRemarkConfig  OpeningRemarkConfig `json:"opening_remark_config"`
//		PresetQuestion       []PresetQuestion    `json:"preset_question"`
//		Output               AgentConfigOutput   `json:"output"`
//	}
// type AgentConfig struct {
// 	Input                *daconfvalobj.Input                   `json:"input"`
// 	SystemPrompt         string                                `json:"system_prompt"`
// 	Dolphin              string                                `json:"dolphin"`
// 	IsDolphinMode        cdaenum.DolphinMode                   `json:"is_dolphin_mode"`
// 	Datasource           *datasourcevalobj.RetrieverDataSource `json:"data_source"`
// 	Skills               *skillvalobj.Skill                    `json:"skills"`
// 	Llms                 []*daconfvalobj.LlmItem               `json:"llms"`
// 	IsDataflowSetEnabled int                                   `json:"is_data_flow_set_enabled"`
// 	OpeningRemarkConfig  OpeningRemarkConfig                   `json:"opening_remark_config"`
// 	PresetQuestion       []PresetQuestion                      `json:"preset_question"`
// 	Output               *daconfvalobj.Output                  `json:"output"`
// }

type OpeningRemarkConfig struct {
	Type                       string `json:"type"`                          // 开场白类型（固定/动态）
	FixedOpeningRemark         string `json:"fixed_opening_remark"`          // 固定开场白
	DynamicOpeningRemarkPrompt string `json:"dynamic_opening_remark_prompt"` // 动态开场白提示语
}

// PresetQuestion 预设问题
type PresetQuestion struct {
	Question string `json:"question"` // 问题内容
}

type Agent struct {
	ID           string              `json:"id"`
	Key          string              `json:"key"`
	IsBuiltIn    int                 `json:"is_built_in"`
	Name         string              `json:"name"`
	CategoryID   string              `json:"category_id"`
	CategoryName string              `json:"category_name"`
	Profile      string              `json:"profile"`
	Version      string              `json:"version"`
	Config       daconfvalobj.Config `json:"config"`
	AvatarType   int                 `json:"avatar_type"`
	Avatar       string              `json:"avatar"`
	ProductID    int                 `json:"product_id"`
	ProductName  string              `json:"product_name"`
	PublishInfo  PublishInfo         `json:"publish_info"`
}

type PublishInfo struct {
	IsAPIAgent      int `json:"is_api_agent"`
	IsSDKAgent      int `json:"is_sdk_agent"`
	IsSkillAgent    int `json:"is_skill_agent"`
	IsDataFlowAgent int `json:"is_data_flow_agent"`
}
