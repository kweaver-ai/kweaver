package otherhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj/skillvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"github.com/gin-gonic/gin"
)

// 内置策略列表,key为category,value为策略列表
var strategyMap = map[string][]skillvalobj.Strategy{
	// "llm": {
	// 	{
	// 		ID:          "summary",
	// 		Name:        "summary",
	// 		Description: "摘要",
	// 	},
	// },
	// "frontend": {
	// 	{
	// 		ID:          "default",
	// 		Name:        "default",
	// 		Description: "默认",
	// 	},
	// },
}

func (o *otherHTTPHandler) StrategyList(c *gin.Context) {
	category := c.Param("category_id")
	if category == "" {
		err := capierr.New400Err(c, "category_id is required")
		_ = c.Error(err)

		return
	}

	if _, ok := strategyMap[category]; !ok {
		err := capierr.New400Err(c, "category_id is invalid")
		_ = c.Error(err)

		return
	}

	response := map[string]interface{}{
		"entries": strategyMap[category],
		"total":   len(strategyMap[category]),
	}
	c.JSON(http.StatusOK, response)
}
