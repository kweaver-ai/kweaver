package dbaccess

import (
	"context"
	"database/sql"
	"strconv"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/db"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/operator-go-lib/ormhelper"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-rds-sdk-go/sqlx"
)

type resourceDeployDB struct {
	dbPool *sqlx.DB
	logger interfaces.Logger
	dbName string
	orm    *ormhelper.DB
}

var (
	rcOnce     sync.Once
	rcInstance *resourceDeployDB
)

const (
	tbResourceDeploy = "t_resource_deploy"
)

func NewResourceDeployDB() model.DBResourceDeploy {
	configLoader := config.NewConfigLoader()
	dbPool := db.NewDBPool()
	dbName := configLoader.GetDBName()
	logger := configLoader.GetLogger()
	rcOnce.Do(func() {
		rcInstance = &resourceDeployDB{
			dbPool: dbPool,
			logger: logger,
			dbName: dbName,
			orm:    ormhelper.New(dbPool, dbName),
		}
	})
	return rcInstance
}

func (r *resourceDeployDB) Insert(ctx context.Context, tx *sql.Tx, resourceDeploy *model.ResourceDeployDB) (ID string, err error) {
	orm := r.orm
	if tx != nil {
		orm = r.orm.WithTx(tx)
	}

	now := time.Now().UnixNano()
	resourceDeploy.CreateTime = now
	resourceDeploy.UpdateTime = now

	var id int64
	id, err = orm.Insert().Into(tbResourceDeploy).Values(map[string]interface{}{
		"f_resource_id": resourceDeploy.ResourceID,
		"f_type":        resourceDeploy.Type,
		"f_version":     resourceDeploy.Version,
		"f_name":        resourceDeploy.Name,
		"f_description": resourceDeploy.Description,
		"f_config":      resourceDeploy.Config,
		"f_status":      resourceDeploy.Status,
		"f_create_user": resourceDeploy.CreateUser,
		"f_create_time": now,
		"f_update_user": resourceDeploy.UpdateUser,
		"f_update_time": now,
	}).ExecuteAndReturnID(ctx)
	if err != nil {
		return "", err
	}
	return strconv.FormatInt(id, 10), nil
}

func (r *resourceDeployDB) Update(ctx context.Context, tx *sql.Tx, resourceDeploy *model.ResourceDeployDB) error {
	orm := r.orm
	if tx != nil {
		orm = r.orm.WithTx(tx)
	}

	now := time.Now().UnixNano()
	resourceDeploy.UpdateTime = now

	_, err := orm.Update(tbResourceDeploy).SetData(map[string]interface{}{
		"f_name":        resourceDeploy.Name,
		"f_description": resourceDeploy.Description,
		"f_config":      resourceDeploy.Config,
		"f_status":      resourceDeploy.Status,
		"f_update_user": resourceDeploy.UpdateUser,
		"f_update_time": now,
	}).WhereEq("f_resource_id", resourceDeploy.ResourceID).
		WhereEq("f_type", resourceDeploy.Type).
		WhereEq("f_version", resourceDeploy.Version).
		Execute(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (r *resourceDeployDB) Delete(ctx context.Context, tx *sql.Tx, resourceVersion int, resourceType, resourceID string) error {
	orm := r.orm
	if tx != nil {
		orm = r.orm.WithTx(tx)
	}

	_, err := orm.Delete().
		From(tbResourceDeploy).
		WhereEq("f_resource_id", resourceID).
		WhereEq("f_type", resourceType).
		WhereEq("f_version", resourceVersion).
		Execute(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (r *resourceDeployDB) SelectList(ctx context.Context, tx *sql.Tx, resourceDeploy *model.ResourceDeployDB) (list []*model.ResourceDeployDB, err error) {
	orm := r.orm
	if tx != nil {
		orm = r.orm.WithTx(tx)
	}

	query := orm.Select().From(tbResourceDeploy)
	// 执行查询
	list = []*model.ResourceDeployDB{}
	err = query.Get(ctx, &list)
	return list, err
}
