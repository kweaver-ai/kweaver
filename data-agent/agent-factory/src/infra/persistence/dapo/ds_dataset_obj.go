package dapo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/enum/daenum"

type DsDatasetObjPo struct {
	ID int64 `json:"id" db:"f_id"`

	DatasetID  string                   `json:"dataset_id" db:"f_dataset_id"`
	ObjectID   string                   `json:"object_id" db:"f_object_id"`
	ObjectType daenum.DatasetObjectType `json:"object_type" db:"f_object_type"`

	CreateTime int64 `json:"create_time" db:"f_created_at"`
}

func (p *DsDatasetObjPo) TableName() string {
	return "t_data_agent_datasource_dataset_obj"
}
