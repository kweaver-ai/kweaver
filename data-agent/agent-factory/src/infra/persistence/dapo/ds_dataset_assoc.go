package dapo

type DsDataSetAssocPo struct {
	ID           int64  `json:"id" db:"f_id"`
	AgentID      string `json:"agent_id" db:"f_agent_id"`
	AgentVersion string `json:"agent_version" db:"f_agent_version"`
	DatasetID    string `json:"dataset_id" db:"f_dataset_id"`

	CreateTime int64 `json:"create_time" db:"f_created_at"`
}

func (p *DsDataSetAssocPo) TableName() string {
	return "t_data_agent_datasource_dataset_assoc"
}
