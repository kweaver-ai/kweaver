package categoryacc

import (
	"context"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

var (
	categoryRepoOnce sync.Once
	categoryRepoImpl idbaccess.ICategoryRepo
)

type categoryRepo struct {
	*drivenadapter.RepoBase

	db     *sqlx.DB
	logger icmp.Logger
}

// GetByReleaseId implements idbaccess.ICategoryRepo.
func (repo *categoryRepo) GetByReleaseId(ctx context.Context, releaaseId string) (rt []*dapo.CategoryPO, err error) {
	return nil, nil
}

// DeleteByAgentId implements idbaccess.CategoryRepo.

// List implements idbaccess.CategoryRepo.
func (repo *categoryRepo) List(ctx context.Context, req interface{}) (rt []*dapo.CategoryPO, err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	po := &dapo.CategoryPO{}
	sr.FromPo(po)

	list := make([]dapo.CategoryPO, 0)

	err = sr.Find(&list)
	if err != nil {
		// todo
	}

	rt = cutil.SliceToPtrSlice(list)

	return rt, err
}

var _ idbaccess.ICategoryRepo = &categoryRepo{}

func NewCategoryRepo() idbaccess.ICategoryRepo {
	categoryRepoOnce.Do(func() {
		categoryRepoImpl = &categoryRepo{
			db:       global.GDB,
			logger:   logger.GetLogger(),
			RepoBase: drivenadapter.NewRepoBase(),
		}
	})

	return categoryRepoImpl
}
