package docsetaccess

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/conf"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/port/driven/ihttpaccess/idocsethttp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
)

type docsetHttpAcc struct {
	logger         icmp.Logger
	client         rest.HTTPClient
	docsetConf     *conf.DocsetConf
	privateAddress string
}

var _ idocsethttp.IDocset = &docsetHttpAcc{}

func NewDocsetHttpAcc(logger icmp.Logger, docsetConf *conf.DocsetConf, httpClient rest.HTTPClient) idocsethttp.IDocset {
	impl := &docsetHttpAcc{
		logger:         logger,
		client:         httpClient,
		docsetConf:     docsetConf,
		privateAddress: cutil.GetHTTPAccess(docsetConf.PrivateSvc.Host, docsetConf.PrivateSvc.Port, docsetConf.PrivateSvc.Protocol),
	}

	return impl
}
