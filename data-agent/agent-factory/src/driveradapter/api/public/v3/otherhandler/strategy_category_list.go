package otherhandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/valueobject/daconfvalobj/skillvalobj"
	"github.com/gin-gonic/gin"
)

var categoryList = []skillvalobj.Category{
	// {
	// 	ID:          "llm",
	// 	Name:        "llm",
	// 	Description: "传递给大模型的结果",
	// },
	// {
	// 	ID:          "frontend",
	// 	Name:        "前端",
	// 	Description: "传递给前端的结果",
	// },
}

func (o *otherHTTPHandler) CategoryList(c *gin.Context) {
	response := map[string]interface{}{
		"entries": categoryList,
		"total":   len(categoryList),
	}
	c.JSON(http.StatusOK, response)
}
