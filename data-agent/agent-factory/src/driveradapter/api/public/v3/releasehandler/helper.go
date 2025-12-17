package releasehandler

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/release/releasereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"github.com/gin-gonic/gin"
)

func setIsPrivate2Req(c *gin.Context, req *releasereq.PublishReq) {
	isPrivate := chelper.IsInternalAPIFromCtx(c)

	req.IsInternalAPI = isPrivate
}
