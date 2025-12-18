// Package rds 统一存放数据库表结构文件
package rds

// AiModel 模型信息
type AiModel struct {
	ID          uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	CreatedAt   int64  `gorm:"column:f_created_at;type:bigint" json:"created_at"`
	UpdatedAt   int64  `gorm:"column:f_updated_at;type:bigint" json:"updated_at"`
	TrainStatus string `gorm:"column:f_train_status;type:varchar(16)" json:"train_status"`
	Status      int    `gorm:"column:f_status;type:tinyint" json:"status"`
	Rule        string `gorm:"column:f_rule;type:text" json:"rule"`
	Name        string `gorm:"column:f_name;type:varchar(255)" json:"name"`
	Description string `gorm:"column:f_description;type:varchar(300)" json:"description"`
	UserID      string `gorm:"column:f_userid;type:varchar(40)" json:"userID"`
	Type        int    `gorm:"column:f_type;type:tinyint" json:"type"`
}

// TrainFileOSSInfo 训练模型上传oss信息
type TrainFileOSSInfo struct {
	ID        uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	TrainID   uint64 `gorm:"column:f_train_id;primary_key:not null" json:"trainID"`
	OSSID     string `gorm:"column:f_oss_id;type:varchar(36)" json:"ossID"`
	Key       string `gorm:"column:f_key;type:varchar(36)" json:"key"`
	CreatedAt int64  `gorm:"column:f_created_at;type:bigint" json:"created_at"`
}

// ContentAdmin 工作流管理员信息
type ContentAdmin struct {
	ID       uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	UserID   string `gorm:"column:f_user_id;type:varchar(40)" json:"userID"`
	UserName string `gorm:"column:f_user_name;type:varchar(128)" json:"userName"`
}

// AlarmRule 告警规则
type AlarmRule struct {
	ID        uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	RuleID    uint64 `gorm:"column:f_rule_id;type:bigint" json:"ruleID"`
	DagID     uint64 `gorm:"column:f_dag_id;type:bigint" json:"dagID"`
	Frequency int    `gorm:"column:f_frequency;type:unsigned smallint" json:"frequency"`
	Threshold int    `gorm:"column:f_threshold;type:unsigned mediumint" json:"threshold"`
	CreatedAt int64  `gorm:"column:f_created_at;type:bigint" json:"created_at"`
}

// AlarmUser 告警用户信息
type AlarmUser struct {
	ID       uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	RuleID   uint64 `gorm:"column:f_rule_id;type:bigint" json:"ruleID"`
	UserID   string `gorm:"column:f_user_id;type:varchar(36)" json:"userID"`
	UserName string `gorm:"column:f_user_name;type:varchar(128)" json:"userName"`
	UserType string `gorm:"column:f_user_type;type:varchar(10)" json:"userType"`
}
