package spacedbacc

import (
	"context"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper/dbhelper2"
)

// ExistsByID 检查空间是否存在
func (repo *SpaceRepo) ExistsByID(ctx context.Context, id string) (exists bool, err error) {
	po := &dapo.SpacePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	exists, err = sr.WhereEqual("f_id", id).
		WhereEqual("f_deleted_at", 0).
		Exists()

	return
}

// ExistsByKey 检查空间key是否存在
func (repo *SpaceRepo) ExistsByKey(ctx context.Context, key string) (exists bool, err error) {
	po := &dapo.SpacePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	exists, err = sr.WhereEqual("f_key", key).
		WhereEqual("f_deleted_at", 0).
		Exists()

	return
}

// ExistsByName 检查空间名称是否存在
func (repo *SpaceRepo) ExistsByName(ctx context.Context, name string) (exists bool, err error) {
	po := &dapo.SpacePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	exists, err = sr.WhereEqual("f_name", name).
		WhereEqual("f_deleted_at", 0).
		Exists()

	return
}

// ExistsByNameExcludeID 检查空间名称是否存在（排除指定ID）
func (repo *SpaceRepo) ExistsByNameExcludeID(ctx context.Context, name, excludeID string) (exists bool, err error) {
	po := &dapo.SpacePo{}
	sr := dbhelper2.NewSQLRunner(repo.db, repo.logger)
	sr.FromPo(po)

	exists, err = sr.WhereEqual("f_name", name).
		WhereNotEqual("f_id", excludeID).
		WhereEqual("f_deleted_at", 0).
		Exists()

	return
}
