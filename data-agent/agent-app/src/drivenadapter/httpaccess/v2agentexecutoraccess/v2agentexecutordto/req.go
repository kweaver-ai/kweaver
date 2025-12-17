package v2agentexecutordto

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"
)

// V2AgentCallReq v2 版本的 Agent 调用请求
// 主要变化：agent_id, agent_config, agent_input 的字段名称与 v1 不同
// v2 中 user_id 和 visitor_type 在请求体中，而不是通过 Header 传递
type V2AgentCallReq struct {
	AgentID      string                 `json:"agent_id,omitempty"`
	AgentVersion string                 `json:"agent_version,omitempty"`
	AgentConfig  Config                 `json:"agent_config,omitempty"`
	AgentInput   map[string]interface{} `json:"agent_input"`
	UserID       string                 `json:"user_id,omitempty"`
	VisitorType  constant.VisitorType   `json:"visitor_type,omitempty"`
	AgentOptions AgentOptions           `json:"_options,omitempty"`

	Token             string            `json:"-"`
	CallType          constant.CallType `json:"-"`
	XAccountID        string            `json:"-"` // 用户ID
	XAccountType      cenum.AccountType `json:"-"` // 用户类型 app/user/anonymous
	XBusinessDomainID string            `json:"-"`
}

type AgentOptions struct {
	Stream bool `json:"stream"`
	Debug  bool `json:"debug"`
	Retry  bool `json:"retry"`
	//NOTE: 一个动态运行时需要的字段，不是固定的agent配置中的数据源范围，而是传参的数据源范围
	DynamicRetrieverFields RetrieverDataSource `json:"dynamic_retriever_fields"`
	Step                   string              `json:"step"`
	//UserDefine             map[string]interface{} `json:"user_define,omitempty"`

	// AgentID                string                 `json:"agent_id"`
	ConversationID string `json:"conversation_id"`
	AgentRunID     string `json:"agent_run_id"`
}

type Input struct {
	Query   string                  `json:"query"`
	File    []valueobject.TempFile  `json:"file"`
	Env     map[string]interface{}  `json:"_object"`
	Content interface{}             `json:"content,omitempty"`
	History []*comvalobj.LLMMessage `json:"history"`
	Options AgentOptions            `json:"_options,omitempty"`
	Object  map[string]interface{}  `json:"object"`
	Tool    interface{}             `json:"tool"` // ask 请求ad参数
	// 扩展字段
	ExtendedFields map[string]interface{} `json:"-"`
	ConfirmPlan    bool                   `json:"confirm_plan"`
}

type KgSource struct {
	KgID            string              `json:"kg_id"`
	Fields          []string            `json:"fields"`
	OutputFields    []string            `json:"output_fields"`
	FieldProperties map[string][]string `json:"field_properties"`
}

type DocFields struct {
	Name   string `json:"name"`
	Path   string `json:"path"`
	Source string `json:"source"`
}

type DocSource struct {
	// 本地上传文件输入
	FileSource string `json:"file_source"`
	ID         string `json:"id,omitempty"`
	Name       string `json:"name,omitempty"`
	//AS文件
	DsID     string       `json:"ds_id,omitempty"`
	Fields   []*DocFields `json:"fields,omitempty"`
	DataSets []string     `json:"datasets,omitempty"`
	// 这个根据数据源id自动填入
	Address  string `json:"address,omitempty"`
	Port     int    `json:"port,omitempty"`
	AsUserID string `json:"as_user_id,omitempty"`
	// 标识这个数据源只用于as鉴权，不召回文件
	Disabled bool `json:"disabled"`
}

// 数据源
type RetrieverDataSource struct {
	Kg  []*KgSource  `json:"kg"`  // 图谱类型数据源
	Doc []*DocSource `json:"doc"` // 文档类型数据源
}

type Config struct {
	daconfvalobj.Config `json:",inline"`
}

// V2AgentDebugReq v2 版本的 Agent Debug 请求
type V2AgentDebugReq struct {
	AgentID      string                 `json:"agent_id,omitempty"`
	AgentVersion string                 `json:"agent_version,omitempty"`
	AgentConfig  Config                 `json:"agent_config,omitempty"`
	AgentInput   map[string]interface{} `json:"agent_input"`
	UserID       string                 `json:"user_id,omitempty"`
	VisitorType  constant.VisitorType   `json:"visitor_type,omitempty"`
	AgentOptions AgentOptions           `json:"_options,omitempty"`

	Token string `json:"-"`

	XAccountID        string            `json:"-"` // 用户ID
	XAccountType      cenum.AccountType `json:"-"` // 用户类型 app/user/anonymous
	XBusinessDomainID string            `json:"-"`
}

// NOTE:agent_config和agent_id 不能同时为空。agent_config优先级高于agent_id。
type V2ConversationSessionInitReq struct {
	ConversationID    string              `json:"conversation_id"`
	AgentID           string              `json:"agent_id"`
	AgentVersion      string              `json:"agent_version"`
	AgentConfig       daconfvalobj.Config `json:"agent_config"`
	UserID            string              `json:"user_id"`
	XAccountID        string              `json:"x_account_id"`
	XAccountType      cenum.AccountType   `json:"x_account_type"`
	XBusinessDomainID string              `json:"x_business_domain_id"`
}
