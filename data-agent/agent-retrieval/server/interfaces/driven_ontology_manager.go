package interfaces

import (
	"context"
)

// 业务知识网络操作符
type KnOperationType string

const (
	KnOperationTypeAnd            KnOperationType = "and"       // 与
	KnOperationTypeOr             KnOperationType = "or"        // 或
	KnOperationTypeEqual          KnOperationType = "=="        // 等于
	KnOperationTypeNotEqual       KnOperationType = "!="        // 不等于
	KnOperationTypeGreater        KnOperationType = ">"         // 大于
	KnOperationTypeLess           KnOperationType = "<"         // 小于
	KnOperationTypeGreaterOrEqual KnOperationType = ">="        // 大于等于
	KnOperationTypeLessOrEqual    KnOperationType = "<="        // 小于等于
	KnOperationTypeIn             KnOperationType = "in"        // in
	KnOperationTypeNotIn          KnOperationType = "not_in"    // not_in
	KnOperationTypeLike           KnOperationType = "like"      // like
	KnOperationTypeNotLike        KnOperationType = "not_like"  // not_like
	KnOperationTypeRange          KnOperationType = "range"     // range
	KnOperationTypeOutRange       KnOperationType = "out_range" // out_range
	KnOperationTypeExist          KnOperationType = "exist"     // exist
	KnOperationTypeNotExist       KnOperationType = "not_exist" // not_exist
	KnOperationTypeRegex          KnOperationType = "regex"     // regex
	KnOperationTypeMatch          KnOperationType = "match"     // match
	KnOperationTypeKnn            KnOperationType = "knn"       // knn
)

type KnBaseError struct {
	ErrorCode               string         `json:"error_code"`    // 错误码
	Description             string         `json:"description"`   // 错误描述
	Solution                string         `json:"solution"`      // 解决方法
	ErrorLink               string         `json:"error_link"`    // 错误链接
	ErrorDetails            interface{}    `json:"error_details"` // 详细内容
	DescriptionTemplateData map[string]any `json:"-"`             // 错误描述参数
	SolutionTemplateData    map[string]any `json:"-"`             // 解决方法参数
}

type ResourceInfo struct {
	Type string `json:"type"` // 数据来源类型
	ID   string `json:"id"`   // 数据视图id
	Name string `json:"name"` // 视图名称
}

type SimpleObjectType struct {
	OTID   string `json:"id"`
	OTName string `json:"name"`
	Icon   string `json:"icon"`
	Color  string `json:"color"`
}

// DataProperty 数据属性结构定义
type DataProperty struct {
	Name                string            `json:"name"`                 // 属性名称。只能包含小写英文字母、数字、下划线（_）、连字符（-），且不能以下划线和连字符开头
	DisplayName         string            `json:"display_name"`         // 属性显示名称
	Type                string            `json:"type"`                 // 属性数据类型。除了视图的字段类型之外，还有 metric、objective、event、trace、log、operator
	Comment             string            `json:"comment"`              // 备注
	MappedField         any               `json:"mapped_field"`         // 视图字段信息
	ConditionOperations []KnOperationType `json:"condition_operations"` // 该数据属性支持的查询条件操作符列表
}

// ObjectType 对象类结构定义
type ObjectType struct {
	ModuleType      string          `json:"module_type"` // 模块类型
	ID              string          `json:"id"`          // 对象id
	Name            string          `json:"name"`        // 对象名称
	Tags            []string        `json:"tags"`        // 标签
	Comment         string          `json:"comment"`     // 备注
	Score           float64         `json:"_score"`      // 分数
	DataSource      *ResourceInfo   `json:"data_source"`
	DataProperties  []*DataProperty `json:"data_properties,omitempty"`  // 数据属性
	LogicProperties []any           `json:"logic_properties,omitempty"` // 逻辑属性
	PrimaryKeys     []string        `json:"primary_keys"`               // 主键字段
}

// RelationType 关系类结构定义
type RelationType struct {
	ModuleType string   `json:"module_type"` // 模块类型
	ID         string   `json:"id"`          // 关系类id
	Name       string   `json:"name"`        // 关系类名称
	Tags       []string `json:"tags"`        // 标签
	Comment    string   `json:"comment"`     // 备注
	Score      float64  `json:"_score"`      // 分数

	SourceObjectTypeId string `json:"source_object_type_id"`        // 起点对象类ID
	TargetObjectTypeId string `json:"target_object_type_id"`        // 目标对象类ID
	SourceObjectType   any    `json:"source_object_type,omitempty"` // 查看详情的时候给出名称
	TargetObjectType   any    `json:"target_object_type,omitempty"` // 查看详情的时候给出名称
	MappingRules       any    `json:"mapping_rules"`                // 根据type来决定是不同的映射方式，direct对应的结构体是[]Mapping
	Type               string `json:"type"`                         // 关系类型
}

// ActionType 行动类结构定义
type ActionType struct {
	ModuleType string   `json:"module_type"` // 模块类型
	ID         string   `json:"id"`          // 行动类ID
	Name       string   `json:"name"`        // 行动类名称
	Tags       []string `json:"tags"`        // 标签
	Comment    string   `json:"comment"`     // 备注
	Score      float64  `json:"_score"`      // 分数

	ObjectTypeId string `json:"object_type_id"` // 行动类所绑定的对象类ID
}

type KnCondValueFrom string

const (
	CondValueFromConst KnCondValueFrom = "const"
)

type KnCondLimitKey string

const (
	CondLimitKeyK           KnCondLimitKey = "k"            // 分页key
	CondLimitKeyMinScore    KnCondLimitKey = "min_score"    // 最小分数
	CondLimitKeyMinDistance KnCondLimitKey = "min_distance" // 最小距离
)

// KnCondition 检索条件
type KnCondition struct {
	Field         string          `json:"field"`          // 字段名
	Operation     KnOperationType `json:"operation"`      // 操作符
	SubConditions []*KnCondition  `json:"sub_conditions"` // 子过滤条件
	Value         any             `json:"value"`          // 字段值
	ValueFrom     KnCondValueFrom `json:"value_from"`     // 字段值来源
	LimitKey      KnCondLimitKey  `json:"limit_key"`
	LimitValue    any             `json:"limit_value"`
}

type KnSortParams struct {
	Field     string `json:"field"`
	Direction string `json:"direction"`
}

// QueryConceptsReq 查询概念类请求
type QueryConceptsReq struct {
	KnID      string          `json:"-"`         // 知识网络ID
	Cond      *KnCondition    `json:"condition"` // 检索条件
	Sort      []*KnSortParams `json:"sort"`
	Limit     int             `json:"limit"`      // 返回熟练，默认值10。范围1-10000
	NeedTotal bool            `json:"need_total"` // 是否需要总数，默认false
}

// Concepts 检索的概念类列表
type Concepts struct {
	Entries     []any `json:"entries"`
	TotalCount  int64 `json:"total_count,omitempty"`
	SearchAfter []any `json:"search_after,omitempty"`
	OverallMs   int64 `json:"overall_ms"`
}

// ObjectConcepts 对象类概念列表
type ObjectTypeConcepts struct {
	Entries    []*ObjectType `json:"entries"`               // 对象类数据
	TotalCount int64         `json:"total_count,omitempty"` // 总数量
}

// RelationTypeConcepts 关系类概念列表
type RelationTypeConcepts struct {
	Entries    []*RelationType `json:"entries"`               // 关系类数据
	TotalCount int64           `json:"total_count,omitempty"` // 总数量
}

// ActionTypeConcepts 行动类概念列表
type ActionTypeConcepts struct {
	Entries    []*ActionType `json:"entries"`               // 关系行动类数据
	TotalCount int64         `json:"total_count,omitempty"` // 总数量
}

// OntologyManagerAccess 本体管理接口
type OntologyManagerAccess interface {
	// SearchObjectTypes 搜索对象类
	SearchObjectTypes(ctx context.Context, query *QueryConceptsReq) (objectTypes *ObjectTypeConcepts, err error)
	// GetObjectTypeDetail 获取对象类详情
	GetObjectTypeDetail(ctx context.Context, knId string, otIds []string, includeDetail bool) ([]*ObjectType, error)

	// SearchRelationTypes 搜索关系类
	SearchRelationTypes(ctx context.Context, query *QueryConceptsReq) (releationTypes *RelationTypeConcepts, err error)
	// GetRelationTypeDetail 获取关系类详情
	GetRelationTypeDetail(ctx context.Context, knId string, rtIDs []string, includeDetail bool) ([]*RelationType, error)

	// SearchRelationTypes 搜索行动类
	SearchActionTypes(ctx context.Context, query *QueryConceptsReq) (actionTypes *ActionTypeConcepts, err error)
	// GetActionTypeDetail 获取行动类详情
	GetActionTypeDetail(ctx context.Context, knId string, atIDs []string, includeDetail bool) ([]*ActionType, error)
}
