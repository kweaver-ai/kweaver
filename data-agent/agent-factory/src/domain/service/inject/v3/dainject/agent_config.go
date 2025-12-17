package dainject

import (
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/v3/v3agentconfigsvc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagentdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagenttpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/productdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/pubedagentdbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/releaseacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/spacedb/spaceresourcedbacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/httpaccess/usermanagementacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/common/global"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driver/iv3portdriver"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/chttpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/mqaccess"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/cmpopenai"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/rediscmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
)

var (
	daConfSvcOnce sync.Once
	daConfSvcImpl iv3portdriver.IDataAgentConfigSvc
)

// NewDaConfSvc
func NewDaConfSvc() iv3portdriver.IDataAgentConfigSvc {
	daConfSvcOnce.Do(func() {
		mfConf := global.GConfig.ModelFactory
		baseURL := getModelApiUrlPrefix(mfConf)
		openAICmp := cmpopenai.NewOpenAICmp(mfConf.LLM.APIKey, baseURL, mfConf.LLM.DefaultModelName, true)

		dto := &v3agentconfigsvc.NewDaConfSvcDto{
			RedisCmp:          rediscmp.NewRedisCmp(),
			SvcBase:           service.NewSvcBase(),
			AgentConfRepo:     daconfdbacc.NewDataAgentRepo(),
			AgentTplRepo:      daconftpldbacc.NewDataAgentTplRepo(),
			ReleaseRepo:       releaseacc.NewReleaseRepo(),
			PubedAgentRepo:    pubedagentdbacc.NewPubedAgentRepo(),
			Logger:            logger.GetLogger(),
			OpenAICmp:         openAICmp,
			DsIndexSvc:        NewDsSvc(),
			UmHttp:            usermanagementacc.NewClient(),
			ProductRepo:       productdbacc.NewProductRepo(),
			SpaceResourceRepo: spaceresourcedbacc.NewSpaceResourceRepo(),
			Um2Http:           chttpinject.NewUmHttpAcc(),
			TplSvc:            NewDaTplSvc(),
			ModelApiAcc:       httpinject.NewModelApiAcc(),
			MqAccess:          mqaccess.NewMqAccess(),
			PmsSvc:            NewPermissionSvc(),
			AuthZHttp:         chttpinject.NewAuthZHttpAcc(),
			BizDomainHttp:     chttpinject.NewBizDomainHttpAcc(),
			BdAgentRelRepo:    bdagentdbacc.NewBizDomainAgentRelRepo(),
			BdAgentTplRelRepo: bdagenttpldbacc.NewBizDomainAgentTplRelRepo(),
		}

		daConfSvcImpl = v3agentconfigsvc.NewDataAgentConfigService(dto)
	})

	return daConfSvcImpl
}
