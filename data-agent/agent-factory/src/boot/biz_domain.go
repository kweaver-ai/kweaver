package boot

import (
    "context"

    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/service/inject/v3/dainject"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagentdbacc"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/bddbacc/bdagenttpldbacc"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconfdbacc"
    "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/daconftpldbacc"
)

// initBizDomainRel 初始化业务域关联关系
func initBizDomainRel() (err error) {
    bizDomainSvc := dainject.NewBizDomainSvc()
    ctx := context.Background()

    // 1. 初始化agent的业务域关联
    agentRepo := daconfdbacc.NewDataAgentRepo()
    bdAgentRelRepo := bdagentdbacc.NewBizDomainAgentRelRepo()

    err = bizDomainSvc.InitBizDomainAgentRel(ctx, agentRepo, bdAgentRelRepo)
    if err != nil {
        return
    }

    // 2. 初始化agent模板的业务域关联
    agentTplRepo := daconftpldbacc.NewDataAgentTplRepo()
    bdAgentTplRelRepo := bdagenttpldbacc.NewBizDomainAgentTplRelRepo()

    err = bizDomainSvc.InitBizDomainAgentTplRel(ctx, agentTplRepo, bdAgentTplRelRepo)
    if err != nil {
        return
    }

    return
}
