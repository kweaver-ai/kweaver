package squarehandler

import (
	"net/http"
	"strconv"

	"github.com/pkg/errors"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squarereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/square/squareresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

func (h *squareHandler) RecentAgentList(c *gin.Context) {
	// 接收语言标识转换为 context.Context
	ctx := rest.GetLanguageCtx(c)

	rt := map[string]interface{}{
		"entries": []squareresp.ListAgentResp{},
		"total":   0,
	}

	userID, err := chelper.GetUserIDFromGinContext(c)
	// for test
	// userID = "c7dc8cb8-1aa5-11f0-a0af-2e8550b81dc5"
	if err != nil {
		// just log error
		h.logger.Warnf("GetUserIDFromGinContext error: %v", errors.Cause(err))
		rest.ReplyOK(c, http.StatusOK, rt)

		return
	}

	req := squarereq.AgentSquareRecentAgentReq{
		UserID: userID,
	}
	// 默认只返回 20天数据
	// 这里的分页前端实际没有用到，一次性返回20条数据，前端组件基于滑动效果做展示
	pageStr := c.DefaultQuery("page", "1")
	sizeStr := c.DefaultQuery("size", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		h.logger.Errorf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, httpErr)

		return
	}

	req.Page = page

	size, err := strconv.Atoi(sizeStr)
	if err != nil {
		h.logger.Errorf("GetPublishAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)
		httpErr := capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, httpErr)

		return
	}

	req.Size = size

	// 默认只返回最近30天的数据
	if req.StartTime == 0 {
		currentMSTimestamp := cutil.GetCurrentMSTimestamp()
		req.StartTime = currentMSTimestamp - 1000*3600*24*30
		req.EndTime = currentMSTimestamp
	}

	list, err := h.squareSvc.GetRecentAgentList(ctx, req)
	if err != nil {
		h.logger.Errorf("GetRecentAgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)

		httpErr := capierr.New500Err(c, err.Error())
		rest.ReplyError(c, httpErr)
	}

	rt = map[string]interface{}{
		"entries": list,
		// "total":   total,
	}
	// 返回成功
	rest.ReplyOK(c, http.StatusOK, rt)
}
