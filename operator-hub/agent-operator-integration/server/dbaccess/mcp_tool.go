package dbaccess

import (
	"context"
	"database/sql"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common/ormhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
	"github.com/google/uuid"
)

type mcpToolDB struct {
	dbPool *sqlx.DB
	logger interfaces.Logger
	dbName string
	orm    *ormhelper.DB
}

var (
	mtOnce sync.Once
	mt     model.DBMCPTool
)

const (
	// tbMCPTool MCP工具表名
	tbMCPTool = "t_mcp_tool"
)

// NewMCPToolDBSingleton 创建MCP工具数据库访问对象单例
func NewMCPToolDBSingleton() model.DBMCPTool {
	confLoader := config.NewConfigLoader()
	dbPool := db.NewDBPool()
	dbName := confLoader.GetDBName()
	logger := confLoader.GetLogger()

	mtOnce.Do(func() {
		orm := ormhelper.New(dbPool, dbName)

		mt = &mcpToolDB{
			dbPool: dbPool,
			logger: logger,
			dbName: dbName,
			orm:    orm,
		}
	})
	return mt
}

func (mt *mcpToolDB) BatchInsert(ctx context.Context, tx *sql.Tx, tools []*model.MCPToolDB) (err error) {
	orm := mt.orm
	if tx != nil {
		orm = mt.orm.WithTx(tx)
	}
	columns := []string{"f_mcp_tool_id", "f_mcp_id", "f_mcp_version", "f_box_id",
		"f_tool_id", "f_box_name", "f_name", "f_description", "f_use_rule", "f_create_user", "f_create_time",
		"f_update_user", "f_update_time"}
	values := make([][]interface{}, len(tools))
	for i, tool := range tools {
		if tool.MCPToolID == "" {
			tool.MCPToolID = uuid.New().String()
		}
		now := time.Now().UnixNano()
		tool.CreateTime = now
		tool.UpdateTime = now
		values[i] = []interface{}{tool.MCPToolID, tool.MCPID, tool.MCPVersion, tool.BoxID, tool.ToolID,
			tool.BoxName, tool.Name, tool.Description, tool.UseRule, tool.CreateUser, tool.CreateTime,
			tool.UpdateUser, tool.UpdateTime}
	}

	_, err = orm.Insert().Into(tbMCPTool).BatchValues(columns, values).Execute(ctx)
	return err
}

func (mt *mcpToolDB) DeleteByMCPIDAndVersion(ctx context.Context, tx *sql.Tx, mcpID string, mcpVersion int) (err error) {
	orm := mt.orm
	if tx != nil {
		orm = mt.orm.WithTx(tx)
	}

	_, err = orm.Delete().From(tbMCPTool).WhereEq("f_mcp_id", mcpID).WhereEq("f_mcp_version", mcpVersion).Execute(ctx)
	return err
}

func (mt *mcpToolDB) SelectListByMCPIDAndVersion(ctx context.Context, tx *sql.Tx, mcpID string, mcpVersion int) (tools []*model.MCPToolDB, err error) {
	orm := mt.orm
	if tx != nil {
		orm = mt.orm.WithTx(tx)
	}

	tools = []*model.MCPToolDB{}
	err = orm.Select().From(tbMCPTool).WhereEq("f_mcp_id", mcpID).WhereEq("f_mcp_version", mcpVersion).Get(ctx, &tools)
	return tools, err
}

func (mt *mcpToolDB) SelectByMCPToolID(ctx context.Context, tx *sql.Tx, mcpToolID string) (tool *model.MCPToolDB, err error) {
	orm := mt.orm
	if tx != nil {
		orm = mt.orm.WithTx(tx)
	}

	tool = &model.MCPToolDB{}
	err = orm.Select().From(tbMCPTool).WhereEq("f_mcp_tool_id", mcpToolID).First(ctx, tool)
	return tool, err
}

func (mt *mcpToolDB) SelectListByMCPIDS(ctx context.Context, tx *sql.Tx, mcpIDs []string) (tools []*model.MCPToolDB, err error) {
	orm := mt.orm
	if tx != nil {
		orm = mt.orm.WithTx(tx)
	}

	args := []interface{}{}
	for _, v := range mcpIDs {
		args = append(args, v)
	}

	tools = []*model.MCPToolDB{}
	err = orm.Select().From(tbMCPTool).WhereIn("f_mcp_id", args...).Get(ctx, &tools)
	return tools, err
}
