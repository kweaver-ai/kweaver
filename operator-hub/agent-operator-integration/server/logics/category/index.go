package category

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/dbaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/cache"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/validator"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
)

// categoryManager 分类管理器
type categoryManager struct {
	logger     interfaces.Logger
	DBTx       model.DBTx
	DBCategory model.DBCategory
	Validator  interfaces.Validator
	Cache      interfaces.Cache
}

// NewCategoryManager 创建分类管理器
func NewCategoryManager() interfaces.CategoryManager {
	c := &categoryManager{
		logger:     config.NewConfigLoader().GetLogger(),
		DBTx:       dbaccess.NewBaseTx(),
		DBCategory: dbaccess.NewCategoryDBSingleton(),
		Validator:  validator.NewValidator(),
		Cache:      cache.NewInMemoryCache(),
	}
	// 从数据库中加载分类信息到缓存中
	categoryDBList, err := c.DBCategory.SelectList(context.Background(), nil)
	if err != nil {
		c.logger.Errorf("load category from db failed, err: %v", err)
		return nil
	}
	for _, categoryDB := range categoryDBList {
		c.Cache.Set(categoryDB.CategoryID, categoryDB.CategoryName)
	}
	return c
}
