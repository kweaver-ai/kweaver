package spaceresourcedbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

// Delete 删除空间资源
func (repo *SpaceResourceRepo) Delete(ctx context.Context, tx *sql.Tx, id int64) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.SpaceResourcePo{}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_id", id).Delete()

	return
}

// DeleteBySpaceID 根据空间ID删除所有资源
func (repo *SpaceResourceRepo) DeleteBySpaceID(ctx context.Context, tx *sql.Tx, spaceID string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.SpaceResourcePo{}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_space_id", spaceID).Delete()

	return
}

func (repo *SpaceResourceRepo) DeleteByAgentID(ctx context.Context, tx *sql.Tx, agentID string) (err error) {
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	po := &dapo.SpaceResourcePo{}
	sr.FromPo(po)

	_, err = sr.WhereEqual("f_resource_id", agentID).
		WhereEqual("f_resource_type", cdaenum.ResourceTypeDataAgent).
		Delete()

	return
}
