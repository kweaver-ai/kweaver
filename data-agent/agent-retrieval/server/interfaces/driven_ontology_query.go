package interfaces

import "context"

// 业务知识网络概念类型
type KnConceptType string

const (
	KnConceptTypeObject   KnConceptType = "object_type"   // 对象类
	KnConceptTypeRelation KnConceptType = "relation_type" // 关系类
	KnConceptTypeAction   KnConceptType = "action_type"   // 行动类
)

// QueryObjectInstancesReq 检索对象详细数据请求对象
type QueryObjectInstancesReq struct {
	KnID               string       `json:"kn_id"`                // 知识网络ID
	OtID               string       `json:"ot_id"`                // 对象类ID
	IncludeTypeInfo    bool         `json:"include_type_info"`    //是否包含对象类信息
	IncludeLogicParams bool         `json:"include_logic_params"` // 包含逻辑属性的计算参数，默认false，不包含。
	Cond               *KnCondition `json:"cond"`                 // 检索条件
	Limit              int          `json:"limit"`                //返回的数量，默认值 10。范围 1-10000
}

type QueryObjectInstancesResp struct {
	Data          []any          `json:"datas"`       // 对象实例列表
	ObjectConcept map[string]any `json:"object_type"` // 对象类型
}

// DrivenOntologyQuery 本体查询接口
type DrivenOntologyQuery interface {
	// QueryObjectInstances 检索指定对象类的对象的详细数据
	QueryObjectInstances(ctx context.Context, req *QueryObjectInstancesReq) (resp *QueryObjectInstancesResp, err error)
}
