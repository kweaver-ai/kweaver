package spacememdbacc

import (
	"context"
	"database/sql"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/sqlhelper2"
)

// GetByID 根据ID获取空间成员
func (repo *SpaceMemberRepo) GetByID(ctx context.Context, id int64) (po *dapo.SpaceMemberPo, err error) {
	po = &dapo.SpaceMemberPo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)
	err = sr.WhereEqual("f_id", id).FindOne(po)

	return
}

// GetBySpaceIDAndObjTypeAndObjIDs 根据空间ID和成员唯一标识获取空间成员关联信息
func (repo *SpaceMemberRepo) GetBySpaceIDAndObjTypeAndObjIDs(ctx context.Context, tx *sql.Tx, spaceID string, members []*spacevo.MemberUniq) (assocs []*spacevo.MemberAssoc, err error) {
	assocs = make([]*spacevo.MemberAssoc, 0)

	if len(members) == 0 {
		return
	}

	// 1. 构造where条件
	wb := sqlhelper2.NewWhereBuilder()

	for _, member := range members {
		wbTmp := sqlhelper2.NewWhereBuilder()
		wbTmp.WhereEqual("f_obj_type", member.ObjType)
		wbTmp.WhereEqual("f_obj_id", member.ObjID)

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
	poList := make([]dapo.SpaceMemberPo, 0)

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	sr.FromPo(&dapo.SpaceMemberPo{})

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
	assocs = make([]*spacevo.MemberAssoc, 0)
	for _, po := range poList {
		assocs = append(assocs, &spacevo.MemberAssoc{
			MemberUniq: spacevo.MemberUniq{
				ObjType: po.ObjType,
				ObjID:   po.ObjID,
			},
			AssocID: po.ID,
		})
	}

	return
}
