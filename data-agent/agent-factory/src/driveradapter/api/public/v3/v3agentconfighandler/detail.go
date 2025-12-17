package v3agentconfighandler

import (
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *daConfHTTPHandler) Detail(c *gin.Context) {
	// 1. 获取id
	id := c.Param("agent_id")
	if id == "" {
		err := capierr.New400Err(c, "id is empty")
		rest.ReplyError(c, err)

		return
	}

	// 2. 获取详情
	res, err := h.daConfSvc.Detail(c, id, "")
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	// 3. 返回结果
	c.JSON(http.StatusOK, res)
}

func (h *daConfHTTPHandler) DetailByKey(c *gin.Context) {
	// 1. 获取key
	key := c.Param("key")
	if key == "" {
		err := capierr.New400Err(c, "key is empty")
		rest.ReplyError(c, err)

		return
	}

	//---用于某个东西的测试 start---
	//tmp:=agentconfigresp.NewDetailRes()
	//
	//tmp.Key=key
	//c.JSON(http.StatusOK,tmp)
	//return
	//---用于某个东西的测试 end---

	// 2. 获取详情
	res, err := h.daConfSvc.Detail(c, "", key)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	// 3. 返回结果
	c.JSON(http.StatusOK, res)
}
