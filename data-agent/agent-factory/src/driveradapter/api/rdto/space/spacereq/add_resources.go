package spacereq

import (
	"errors"
	"strconv"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/constant/csconstant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/entity/spaceeo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

// AddResourcesReq 添加空间资源请求
type AddResourcesReq struct {
	Resources []*SpaceResourceReq `json:"resources" binding:"required,min=1" label:"空间资源列表"`
}

// GetErrMsgMap 返回错误信息映射
func (r *AddResourcesReq) GetErrMsgMap() map[string]string {
	return map[string]string{
		"Resources.required": `"resources"不能为空`,
		"Resources.min":      `"resources"至少需要一个资源`,
	}
}

// todo 临时兼容处理，等前端调整后去除
func (r *AddResourcesReq) TmpHandleResourceType() {
	for _, resource := range r.Resources {
		if resource.ResourceType.String() == "data_agent" {
			resource.ResourceType = cdaenum.ResourceTypeDataAgent
		}
	}
}

func (r *AddResourcesReq) CustomCheck() error {
	// 1. 检查资源列表的长度
	if len(r.Resources) == 0 {
		return errors.New("[AddResourcesReq][CustomCheck]: 资源列表不能为空")
	}

	// 2. 去重
	r.Resources = cutil.DeduplPtrGeneric(r.Resources)

	// 3. 检查资源类型
	for _, resource := range r.Resources {
		if resource.ResourceType.EnumCheck() != nil {
			return errors.New("[AddResourcesReq][CustomCheck]: 无效的资源类型")
		}
	}

	// 4. 检查资源数量
	if len(r.Resources) > csconstant.MaxResourceNumInOneSpace {
		return errors.New("[AddResourcesReq][CustomCheck]: 资源数量超过最大限制（" + strconv.Itoa(csconstant.MaxResourceNumInOneSpace) + "）")
	}

	return nil
}

func (r *AddResourcesReq) ToResourceEos(leftAddResources []*SpaceResourceReq, spaceID string, spaceKey string) (eos []*spaceeo.SpaceResource, err error) {
	for _, resource := range leftAddResources {
		eo := &spaceeo.SpaceResource{}

		err = cutil.CopyStructUseJSON(eo, resource)
		if err != nil {
			return
		}

		eo.SpaceID = spaceID
		eo.SpaceKey = spaceKey
		eos = append(eos, eo)
	}

	return
}
