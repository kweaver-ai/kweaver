package dainject

import (
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/cconf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

func getModelApiUrlPrefix(_conf *cconf.ModelFactoryConf) (urlPrefix string) {
	apiSvc := _conf.ModelApiSvc
	host := cutil.ParseHost(apiSvc.Host)

	urlPrefix = fmt.Sprintf("%s://%s:%d/api/private/mf-model-api/v1", apiSvc.Protocol, host, apiSvc.Port)

	return
}
