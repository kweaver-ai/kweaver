package releasesvc

import (
	"context"
	"database/sql"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (svc *releaseSvc) handleCategory(ctx context.Context, categoryIDs []string, releaseID string, tx *sql.Tx) (err error) {
	if len(categoryIDs) > 0 {
		// 1. 先删除现有的分类关联
		err = svc.releaseCategoryRelRepo.DelByReleaseID(ctx, tx, releaseID)
		if err != nil {
			err = errors.Wrapf(err, "delete category relations failed")
			return
		}

		// 2. 添加新的分类关联
		categoryRels := make([]*dapo.ReleaseCategoryRelPO, 0)

		for _, categoryID := range categoryIDs {
			categoryID = strings.TrimSpace(categoryID)
			if categoryID != "" {
				categoryRel := &dapo.ReleaseCategoryRelPO{
					ID:         cutil.UlidMake(),
					ReleaseID:  releaseID,
					CategoryID: categoryID,
				}
				categoryRels = append(categoryRels, categoryRel)
			}
		}

		// 3. 批量创建分类关联
		err = svc.releaseCategoryRelRepo.BatchCreate(ctx, tx, categoryRels)
		if err != nil {
			err = errors.Wrapf(err, "batch create category relations failed")
			return
		}
	}

	return
}
