package v3agentconfighandler

import (
    "net/http"

    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
    "github.com/gin-gonic/gin"
    "github.com/pkg/errors"
)

func (h *daConfHTTPHandler) AgentListListForBenchmark(c *gin.Context) {
    // 接收语言标识转换为 context.Context
    ctx := rest.GetLanguageCtx(c)
    req := &agentconfigreq.ListForBenchmarkReq{}

    if err := c.ShouldBindQuery(req); err != nil {
        httpErr := capierr.New400Err(c, chelper.ErrMsg(err, req))
        _ = c.Error(httpErr)

        return
    }

    resp, err := h.daConfSvc.ListForBenchmark(ctx, req)
    if err != nil {
        h.logger.Errorf("AgentList error cause: %v, err trace: %+v\n", errors.Cause(err), err)

        _ = c.Error(err)

        return
    }

    // 返回成功
    rest.ReplyOK(c, http.StatusOK, resp)
}
