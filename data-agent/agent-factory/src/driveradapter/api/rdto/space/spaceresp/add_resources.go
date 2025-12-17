package spaceresp

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spacereq"
)

// AddResourcesResp 添加空间资源响应
type AddResourcesResp struct {
	Success []*spacevo.ResourceAssoc `json:"success"` // 添加成功的资源
	Failed  *AddResourcesFailed      `json:"failed"`  // 添加失败的资源
}

func NewAddResourcesResp() *AddResourcesResp {
	return &AddResourcesResp{
		Success: make([]*spacevo.ResourceAssoc, 0),
		Failed:  NewAddResourcesFailed(),
	}
}

type AddResourcesFailed struct {
	ResourceAlreadyExists []*spacereq.SpaceResourceReq `json:"resource_already_exists"` // 已存在的资源
}

func NewAddResourcesFailed() *AddResourcesFailed {
	return &AddResourcesFailed{
		ResourceAlreadyExists: make([]*spacereq.SpaceResourceReq, 0),
	}
}
