package dapo

// DsDatasetPo 数据源数据集
type DsDatasetPo struct {
	ID         string `json:"id" db:"f_id"`
	HashSha256 string `json:"hash_sha256" db:"f_hash_sha256"`
	CreateTime int64  `json:"create_time" db:"f_created_at"`
}

func (p *DsDatasetPo) TableName() string {
	return "t_data_agent_datasource_dataset"
}
