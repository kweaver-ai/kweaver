package spacevo

import "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cenum"

type MemberUniq struct {
	ObjType cenum.OrgObjType `json:"obj_type"`
	ObjID   string           `json:"obj_id"`
}

type MemberAssoc struct {
	MemberUniq
	AssocID int64 `json:"assoc_id"`
}
