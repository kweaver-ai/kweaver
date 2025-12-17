package spaceresourcedbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
)

func (repo *SpaceResourceRepo) ExistsBySpaceIDAndResourceTypeAndResourceIDs(ctx context.Context, spaceID string, resources []*spacevo.ResourceUniq) (exists []*spacevo.ResourceUniq, err error) {
	exists = make([]*spacevo.ResourceUniq, 0)

	if len(resources) == 0 {
		return
	}

	assocs, err := repo.GetBySpaceIDAndResourceTypeAndResourceIDs(ctx, nil, spaceID, resources)
	if err != nil {
		return
	}

	exists = make([]*spacevo.ResourceUniq, 0, len(assocs))
	for _, assoc := range assocs {
		exists = append(exists, &assoc.ResourceUniq)
	}

	return
}
