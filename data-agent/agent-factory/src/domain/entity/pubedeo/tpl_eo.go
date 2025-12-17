package pubedeo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj"
)

// DataAgentTpl 数据智能体模板实体对象
type PublishedTpl struct {
	dapo.PublishedTplPo

	Config *daconfvalobj.Config `json:"config"` // Agent 配置（用于创建、更新时使用）

	ProductName string `json:"product_name"` // 产品名称
}
