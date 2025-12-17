package categorysvc

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/categoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/idbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
)

var (
	categorySvcOnce sync.Once
	categorySvcImpl iv3portdriver.ICategorySvc
)

type categorySvc struct {
	*service.SvcBase
	categoryRepo idbaccess.ICategoryRepo
}

var _ iv3portdriver.ICategorySvc = &categorySvc{}

func NewCategorySvc() iv3portdriver.ICategorySvc {
	categorySvcOnce.Do(func() {
		categorySvcImpl = &categorySvc{
			SvcBase:      service.NewSvcBase(),
			categoryRepo: categoryacc.NewCategoryRepo(),
		}
	})

	return categorySvcImpl
}
