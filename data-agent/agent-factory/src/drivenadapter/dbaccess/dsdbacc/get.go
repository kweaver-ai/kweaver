package dsdbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

func (r *DsRepo) GetByAgentIDAgentVersion(ctx context.Context, agentID, agentVersion string) (po *dapo.DsDataSetAssocPo, err error) {
	po = &dapo.DsDataSetAssocPo{}
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)
	sr.FromPo(po)
	err = sr.WhereEqual("f_agent_id", agentID).
		WhereEqual("f_agent_version", agentVersion).
		FindOne(po)

	return
}

func (r *DsRepo) GetOneByIndexKey(ctx context.Context, indexKey string) (po *dapo.DsDataSetAssocPo, err error) {
	po = &dapo.DsDataSetAssocPo{}
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)
	sr.FromPo(po)
	err = sr.WhereEqual("f_index_key", indexKey).
		FindOne(po)

	return
}

func (r *DsRepo) GetListByAgentID(ctx context.Context, agentID string) (list []*dapo.DsDataSetAssocPo, err error) {
	list = []*dapo.DsDataSetAssocPo{}
	sr := dbhelper2.NewSQLRunner(r.db, r.logger)
	sr.FromPo(&dapo.DsDataSetAssocPo{})
	err = sr.WhereEqual("f_agent_id", agentID).
		Find(&list)

	return
}
