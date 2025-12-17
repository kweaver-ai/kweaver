// Package category 算子分类
package category

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	lcategory "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/category"
	"github.com/gin-gonic/gin"
)

type CategoryHandler interface {
	CategoryList(c *gin.Context)
	CategoryUpdate(c *gin.Context)
	CategoryCreate(c *gin.Context)
	CategoryDelete(c *gin.Context)
}

var (
	once sync.Once
	h    CategoryHandler
)

type categoryHandler struct {
	Logger          interfaces.Logger
	CategoryManager interfaces.CategoryManager
}

func NewCategoryHandler() CategoryHandler {
	once.Do(func() {
		confLoader := config.NewConfigLoader()
		handler := &categoryHandler{
			Logger:          confLoader.GetLogger(),
			CategoryManager: lcategory.NewCategoryManager(),
		}
		handler.initData()
		h = handler
	})
	return h
}
