package publishvo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"

type ListPublishInfo struct {
	dapo.PublishedToBeStruct
}

func NewListPublishInfo() *ListPublishInfo {
	return &ListPublishInfo{}
}
