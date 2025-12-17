package categorysvc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/category/categoryresp"
	"github.com/pkg/errors"
)

// List implements iv3portdriver.ICategorySvc.
func (svc *categorySvc) List(ctx context.Context) (categoryresp.ListResp, error) {
	list := make(categoryresp.ListResp, 0)

	rt, err := svc.categoryRepo.List(ctx, nil)
	if err != nil {
		return list, errors.Wrapf(err, "svc.categoryRepo.List")
	}

	for _, v := range rt {
		list = append(list, categoryresp.CategoryResp{
			ID:          v.ID,
			Name:        v.Name,
			Description: v.Description,
		})
	}

	return list, nil
}
