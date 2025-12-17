package spaceresourcedbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/sqlhelper2"
)

// GetByID 根据ID获取空间资源
func (repo *SpaceResourceRepo) GetByID(ctx context.Context, id int64) (po *dapo.SpaceResourcePo, err error) {
	po = &dapo.SpaceResourcePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)
	err = sr.WhereEqual("f_id", id).FindOne(po)

	return
}

func (repo *SpaceResourceRepo) GetBySpaceIDAndResourceTypeAndResourceID(ctx context.Context, tx *sql.Tx, spaceID string, resourceType cdaenum.ResourceType, resourceID string) (po *dapo.SpaceResourcePo, err error) {
	po = &dapo.SpaceResourcePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)
	err = sr.WhereEqual("f_space_id", spaceID).
		WhereEqual("f_resource_type", resourceType).
		WhereEqual("f_resource_id", resourceID).
		FindOne(po)

	return
}

// GetBySpaceIDAndResourceTypeAndResourceIDs 根据空间ID和资源唯一标识获取空间资源关联信息
func (repo *SpaceResourceRepo) GetBySpaceIDAndResourceTypeAndResourceIDs(ctx context.Context, tx *sql.Tx, spaceID string, resources []*spacevo.ResourceUniq) (assocs []*spacevo.ResourceAssoc, err error) {
	assocs = make([]*spacevo.ResourceAssoc, 0)

	if len(resources) == 0 {
		return
	}

	// 1. 构造where条件
	wb := sqlhelper2.NewWhereBuilder()

	for _, resource := range resources {
		wbTmp := sqlhelper2.NewWhereBuilder()
		wbTmp.WhereEqual("f_resource_type", resource.ResourceType)
		wbTmp.WhereEqual("f_resource_id", resource.ResourceID)

		var (
			whereSql  string
			whereArgs []interface{}
		)

		whereSql, whereArgs, err = wbTmp.ToWhereSQL()
		if err != nil {
			return
		}

		wb.WhereOrRaw(whereSql, whereArgs...)
	}

	// 2. 查询持久化对象
	poList := make([]dapo.SpaceResourcePo, 0)

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(&dapo.SpaceResourcePo{})

	err = sr.WhereByWhereBuilder(wb)
	if err != nil {
		return
	}

	err = sr.WhereEqual("f_space_id", spaceID).
		Find(&poList)
	if err != nil {
		return
	}

	// 3. 转换为值对象
	assocs = make([]*spacevo.ResourceAssoc, 0, len(poList))

	for _, po := range poList {
		assoc := &spacevo.ResourceAssoc{}
		assoc.ResourceType = po.ResourceType
		assoc.ResourceID = po.ResourceID
		assoc.AssocID = po.ID

		assocs = append(assocs, assoc)
	}

	return
}
