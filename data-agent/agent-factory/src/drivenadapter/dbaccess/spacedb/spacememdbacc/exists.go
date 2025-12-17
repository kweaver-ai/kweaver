package spacememdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
)

func (repo *SpaceMemberRepo) ExistsBySpaceIDAndObjTypeAndObjIDs(ctx context.Context, spaceID string, members []*spacevo.MemberUniq) (exists []*spacevo.MemberUniq, err error) {
	exists = make([]*spacevo.MemberUniq, 0)

	if len(members) == 0 {
		return
	}

	assocs, err := repo.GetBySpaceIDAndObjTypeAndObjIDs(ctx, nil, spaceID, members)
	if err != nil {
		return
	}

	exists = make([]*spacevo.MemberUniq, 0)
	for _, member := range assocs {
		exists = append(exists, &member.MemberUniq)
	}

	return
}

func (repo *SpaceMemberRepo) IsMemberExist(ctx context.Context, spaceID string, members []*spacevo.MemberUniq) (exists bool, err error) {
	exists = false

	assocs, err := repo.GetBySpaceIDAndObjTypeAndObjIDs(ctx, nil, spaceID, members)
	if err != nil {
		return
	}

	if len(assocs) > 0 {
		exists = true
	}

	return
}
