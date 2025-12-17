package iv3portdriver

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/docindexobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/auditlogdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigresp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_tpl/agenttplreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_tpl/agenttplresp"
	"github.com/gin-gonic/gin"
)

//go:generate mockgen -source=./da_config_svc.go -destination ./v3portdrivermock/da_config_svc.go -package v3portdrivermock
type IDataAgentConfigSvc interface {
	Create(ctx context.Context, req *agentconfigreq.CreateReq) (res string, err error)
	Update(ctx context.Context, req *agentconfigreq.UpdateReq, id string) (auditLogInfo auditlogdto.AgentUpdateAuditLogInfo, err error)
	Detail(ctx context.Context, id, key string) (res *agentconfigresp.DetailRes, err error)
	Delete(ctx context.Context, id, ownerUid string, isPrivate bool) (auditLogInfo auditlogdto.AgentDeleteAuditLogInfo, err error)

	ListForBenchmark(ctx context.Context, req *agentconfigreq.ListForBenchmarkReq) (agentList *agentconfigresp.ListForBenchmarkResp, err error)

	// AiAutogen AI自动生成内容
	AIAutogenV3(ctx *gin.Context, req *agentconfigreq.AiAutogenReq) (messageChan chan string, errorChan chan error, err error)

	AIAutogenNotStream(ctx *gin.Context, req *agentconfigreq.AiAutogenReq) (questions agentconfigresp.PreSetQuestions, err error)

	BatchCheckIndexStatus(ctx *gin.Context, req *agentconfigreq.BatchCheckIndexStatusReq) (res []*docindexobj.AgentDocIndexStatusInfo, err error)

	TmpTest(ctx context.Context, req *agentconfigreq.TestTmpReq) (err error)

	// BatchFields 批量获取agent指定字段
	BatchFields(ctx context.Context, req *agentconfigreq.BatchFieldsReq) (resp *agentconfigresp.BatchFieldsResp, err error)

	// Copy 复制Agent
	Copy(ctx context.Context, agentID string, req *agentconfigreq.CopyReq) (res *agentconfigresp.CopyResp, auditLogInfo auditlogdto.AgentCopyAuditLogInfo, err error)

	// Copy2Tpl 复制Agent为模板
	Copy2Tpl(ctx context.Context, agentID string, req *agentconfigreq.Copy2TplReq, tx *sql.Tx) (res *agentconfigresp.Copy2TplResp, auditLogInfo auditlogdto.AgentCopy2TplAuditLogInfo, err error)

	// Copy2TplAndPublish 复制Agent为模板并发布
	Copy2TplAndPublish(ctx context.Context, agentID string, req *agenttplreq.PublishReq) (res *agenttplresp.PublishUpsertResp, auditLogInfo auditlogdto.AgentCopy2TplAndPublishAuditLogInfo, err error)
}
