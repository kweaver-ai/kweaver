package personalspacedbacc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/drivenadapter/dbaccess/personalspacedbacc/psdbarg"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/sqlhelper2"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (repo *personalSpaceRepo) ListPersonalSpaceAgent(ctx context.Context, arg *psdbarg.AgentListArg) (pos []*dapo.DataAgentPo, err error) {
	req := arg.ListReq

	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)

	pos = make([]*dapo.DataAgentPo, 0)

	publishedAgentList := make([]dapo.DataAgentPo, 0)

	// 1. 构建SQL
	selectFieldsStr, fromClause, whereSql, whereArgs, order, err := repo.buildSql(arg)
	if err != nil {
		return
	}

	// 2. 构建完整的查询SQL
	rawSql := fmt.Sprintf("SELECT %s %s", selectFieldsStr, fromClause)

	if len(whereSql) > 0 {
		rawSql = fmt.Sprintf("%s WHERE %s", rawSql, whereSql)
	}
	// 3. 添加排序
	rawSql = fmt.Sprintf("%s ORDER BY %s", rawSql, order)

	// 4. 添加分页
	rawSql = fmt.Sprintf("%s LIMIT %d", rawSql, req.Size)

	// 5. 执行查询
	err = sr.Raw(rawSql, whereArgs...).Find(&publishedAgentList)
	if err != nil {
		err = errors.Wrapf(err, "[ListPersonalSpaceAgent] find failed")
		return
	}

	// 6. 转换为指针切片
	pos = cutil.SliceToPtrSlice(publishedAgentList)

	return
}

func (repo *personalSpaceRepo) buildSql(arg *psdbarg.AgentListArg) (selectFieldsStr string, fromClause string, whereSql string, whereArgs []interface{}, order string, err error) {
	req := arg.ListReq

	// 1. 构建查询SQL
	agentCfgPO := &dapo.DataAgentPo{}
	releasePO := &dapo.ReleasePO{}

	// 2. 构建SELECT字段
	selectFieldsStr = sqlhelper2.GenSQLSelectFieldsStr(sqlhelper2.AllFieldsByStruct(agentCfgPO), "cfg")

	// 3. 构建FROM和JOIN子句
	fromClause = fmt.Sprintf(
		"FROM %s AS cfg ",
		agentCfgPO.TableName(),
	)

	order = "cfg.f_updated_at DESC,cfg.f_id DESC"

	// 4. 构建WHERE条件
	wb := sqlhelper2.NewWhereBuilder()

	// 4.1. 删除标识过滤
	wb.WhereEqual("cfg.f_deleted_at", 0)

	// 4.2. 名称模糊查询
	if req.Name != "" {
		wb.Like("cfg.f_name", req.Name)
	}

	// 4.3. 按创建人过滤（个人空间只显示当前用户创建的Agent）
	if arg.CreatedBy != "" {
		wb2 := sqlhelper2.NewWhereBuilder()
		wb2.WhereEqual("cfg.f_created_by", arg.CreatedBy)

		// 当有内置Agent管理权限时，包含内置Agent
		if arg.HasBuiltInAgentMgmtPermission {
			wb2.OrEqual("cfg.f_is_built_in", 1)
		}

		var (
			wb2WhereStr  string
			wb2WhereArgs []interface{}
		)

		wb2WhereStr, wb2WhereArgs, err = wb2.ToWhereSQL()
		if err != nil {
			err = errors.Wrapf(err, "[personalSpaceRepo][buildSql] build where sql failed")
			return
		}

		wb.WhereRaw(wb2WhereStr, wb2WhereArgs...)
	} else {
		panic("[personalSpaceRepo][buildSql] CreatedBy is empty")
	}

	// 4.4. 按状态过滤
	if req.PublishStatus != "" {
		wb.WhereEqual("cfg.f_status", req.PublishStatus)
	}

	// 4.5. 按Agent创建类型过滤
	if req.AgentCreatedType != "" {
		wb.WhereEqual("cfg.f_created_type", req.AgentCreatedType)
	}

	// 4.6. 发布标识过滤
	if req.PublishToBe != "" {
		fromClause += fmt.Sprintf(" INNER JOIN %s AS r ON cfg.f_id = r.f_agent_id ", releasePO.TableName())

		order = "r.f_update_time DESC, cfg.f_updated_at DESC"

		switch req.PublishToBe {
		case cdaenum.PublishToBeAPIAgent:
			wb.WhereEqual("r.f_is_api_agent", 1)
		case cdaenum.PublishToBeWebSDKAgent:
			wb.WhereEqual("r.f_is_web_sdk_agent", 1)
		case cdaenum.PublishToBeSkillAgent:
			wb.WhereEqual("r.f_is_skill_agent", 1)
		case cdaenum.PublishToBeDataFlowAgent:
			wb.WhereEqual("r.f_is_data_flow_agent", 1)
		}
	}

	// 4.7 根据业务域ID过滤
	if len(arg.AgentIDsByBizDomain) > 0 {
		wb.In("cfg.f_id", arg.AgentIDsByBizDomain)
	}

	// 4.8. 分页
	if req.Marker != nil {
		err = repo.handleAgentMarker(arg, wb)
		if err != nil {
			err = errors.Wrapf(err, "[personalSpaceRepo][buildSql] handle agent marker failed")
			return
		}
	}

	// 5. 构建WHERE SQL
	whereSql, whereArgs, err = wb.ToWhereSQL()
	if err != nil {
		err = errors.Wrapf(err, "[personalSpaceRepo][buildSql] build where sql failed")
		return
	}

	return
}

// 根据marker过滤
func (repo *personalSpaceRepo) handleAgentMarker(arg *psdbarg.AgentListArg, wb *sqlhelper2.WhereBuilder) (err error) {
	reqMarker := arg.ListReq.Marker
	// 1. 构建wb2
	wb2 := sqlhelper2.NewWhereBuilder()
	wb2.WhereEqual("f_updated_at", reqMarker.UpdatedAt)
	wb2.Where("f_id", sqlhelper2.OperatorLt, reqMarker.LastAgentID)

	var (
		wb2Str  string
		wb2Args []interface{}
	)

	wb2Str, wb2Args, err = wb2.ToWhereSQL()
	if err != nil {
		return
	}

	// 2. 构建wb3
	wb3 := sqlhelper2.NewWhereBuilder()

	wb3.Where("f_updated_at", sqlhelper2.OperatorLt, reqMarker.UpdatedAt)
	wb3.WhereOrRaw(wb2Str, wb2Args...)

	var (
		wb3Str  string
		wb3Args []interface{}
	)

	wb3Str, wb3Args, err = wb3.ToWhereSQL()
	if err != nil {
		return
	}

	// 3. 添加到sr
	wb.WhereRaw(wb3Str, wb3Args...)

	return
}
