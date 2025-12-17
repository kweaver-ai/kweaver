package pubedeo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
)

type PublishedTplListEo struct {
	dapo.PublishedTplPo

	CreatedByName   string `json:"created_by_name"`
	UpdatedByName   string `json:"updated_by_name"`
	PublishedByName string `json:"published_by_name"`
}
