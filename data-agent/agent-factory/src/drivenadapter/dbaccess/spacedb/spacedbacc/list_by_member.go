package spacedbacc

import (
	"context"
	"database/sql"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/domain/valueobject/spacevo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/space/spacereq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/sqlhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
)

func (repo *SpaceRepo) GetSpacePosByMembers(ctx context.Context, tx *sql.Tx, members []*spacevo.MemberUniq, req *spacereq.ListReq) (pos []*dapo.SpacePo, count int64, err error) {
	// 1. 初始化
	pos = make([]*dapo.SpacePo, 0)

	if len(members) == 0 {
		return
	}

	// 2. 构建select和where
	selectStr, sqlFromPart, whereSql, whereArgs, err := repo.buildSelectAndWhere(members, req)
	if err != nil {
		return
	}

	// 3. 先统计总数
	srCount := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		srCount = dbhelper2.TxSr(tx, repo.logger)
	}

	rawSqlCount := fmt.Sprintf(
		"SELECT COUNT(distinct s.f_id) as count %s where %s",
		sqlFromPart,
		whereSql,
	)

	count, err = srCount.Raw(rawSqlCount, whereArgs...).Count()
	if err != nil {
		return
	}

	if count == 0 {
		return
	}

	// 4. 再分页查询
	poList := make([]dapo.SpacePo, 0)

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	if tx != nil {
		sr = dbhelper2.TxSr(tx, repo.logger)
	}

	limitStr := fmt.Sprintf("LIMIT %d OFFSET %d", req.GetSize(), req.GetOffset())

	orderStr := "ORDER BY s.f_created_at DESC"

	rawSql := fmt.Sprintf(
		"SELECT distinct %s%s where %s %s %s",
		selectStr,
		sqlFromPart,
		whereSql,
		orderStr,
		limitStr,
	)

	err = sr.Raw(rawSql, whereArgs...).
		Find(&poList)

	if err != nil {
		return
	}

	// 5. 转换为值对象
	pos = cutil.SliceToPtrSlice(poList)

	return
}

func (repo *SpaceRepo) buildSelectAndWhere(members []*spacevo.MemberUniq, req *spacereq.ListReq) (selectStr, sqlFromPart, whereSql string, whereArgs []interface{}, err error) {
	// 1. 构建select字段
	spacePo := &dapo.SpacePo{}
	memberPo := &dapo.SpaceMemberPo{}

	selectStr = sqlhelper2.GenSQLSelectFieldsStr(sqlhelper2.AllFieldsByStruct(spacePo), "s")

	sqlFromPart = fmt.Sprintf(
		" FROM %s AS s INNER JOIN %s AS assoc ON s.f_id = assoc.f_space_id",
		spacePo.TableName(),
		memberPo.TableName(),
	)

	// 2. 构造where条件
	wb := sqlhelper2.NewWhereBuilder()

	// 2.1 member条件
	wb2 := sqlhelper2.NewWhereBuilder()

	for _, member := range members {
		wbTmp := sqlhelper2.NewWhereBuilder()
		wbTmp.WhereEqual("assoc.f_obj_type", member.ObjType)
		wbTmp.WhereEqual("assoc.f_obj_id", member.ObjID)

		var (
			tmpWhereSql  string
			tmpWhereArgs []interface{}
		)

		tmpWhereSql, tmpWhereArgs, err = wbTmp.ToWhereSQL()
		if err != nil {
			return
		}

		wb2.WhereOrRaw(tmpWhereSql, tmpWhereArgs...)
	}

	whereSql2, whereArgs2, err := wb2.ToWhereSQL()
	if err != nil {
		return
	}

	wb.WhereRaw(whereSql2, whereArgs2...)

	// 2.2 name条件
	if req.Name != "" {
		wb.Like("s.f_name", req.Name)
	}

	// 2.3 deleted_at条件
	wb.WhereEqual("s.f_deleted_at", 0)

	whereSql, whereArgs, err = wb.ToWhereSQL()
	if err != nil {
		return
	}

	return
}
