package dependency

import (
	"context"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/store/rds"
)

type CustomExecutor interface {
	GetAccessableAction(ctx context.Context, actionID uint64, executorID uint64, userID string) (*rds.ExecutorActionModel, error)
}

type CustomExecutorImpl struct {
	executorDao    rds.ExecutorDao
	userManagement drivenadapters.UserManagement
}

var (
	customExecutorOnce sync.Once
	customExecutor     CustomExecutor
)

func NewCustomExecutor() CustomExecutor {
	customExecutorOnce.Do(func() {
		customExecutor = &CustomExecutorImpl{
			executorDao:    rds.NewExecutor(),
			userManagement: drivenadapters.NewUserManagement(),
		}
	})

	return customExecutor
}

func (e *CustomExecutorImpl) GetAccessableAction(ctx context.Context, actionID uint64, executorID uint64, userID string) (*rds.ExecutorActionModel, error) {
	accessorIDs, err := e.userManagement.GetUserAccessorIDs(userID)
	if err != nil {
		return nil, err
	}

	return e.executorDao.GetAccessableAction(ctx, actionID, executorID, userID, accessorIDs)
}
