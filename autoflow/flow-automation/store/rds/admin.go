package rds

import (
	"context"
	"strings"
	"sync"

	cdb "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/db"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	jsoniter "github.com/json-iterator/go"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

const (
	CONTENT_ADMIN_TABLENAME = "t_content_admin"
)

// ContentAmdinDao 接口
type ContentAmdinDao interface {
	CreateAdmin(ctx context.Context, datas []*ContentAdmin) error
	CheckAdminExistByUSerID(ctx context.Context, userID string) (bool, error)
	ListAdmins(ctx context.Context) ([]ContentAdmin, error)
	ListAdminsByUserID(ctx context.Context, userIDs []string) ([]ContentAdmin, error)
	DeleteAdminByID(ctx context.Context, ID string) error
	UpdateAdminByUserID(ctx context.Context, userID, userName string) error
}

var (
	caOnce sync.Once
	ca     ContentAmdinDao
)

type caDB struct {
	db *gorm.DB
}

// NewContentAmdin 实例化
func NewContentAmdin() ContentAmdinDao {
	caOnce.Do(func() {
		ca = &caDB{
			db: cdb.NewDB(),
		}
	})

	return ca
}

// CreateAdmin 创建流程管理员
func (ca *caDB) CreateAdmin(ctx context.Context, datas []*ContentAdmin) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	msgStr, _ := jsoniter.MarshalToString(datas)

	var queryBuilder strings.Builder
	queryBuilder.WriteString("INSERT INTO t_content_admin (f_id, f_user_id, f_user_name) VALUES ")
	values := make([]interface{}, 0, len(datas)*3)
	for i, data := range datas {
		if i > 0 {
			queryBuilder.WriteString(",")
		}
		queryBuilder.WriteString("(?, ?, ?)")
		values = append(values, data.ID, data.UserID, data.UserName)
	}
	sql := queryBuilder.String()
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_Values, msgStr))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Exec(sql, values...).Error
	if err != nil {
		traceLog.WithContext(ctx).Warnf("[caDB.CreateAdmin] create content admin failed, detail: %s", err.Error())
	}
	return err
}

// CheckAdminExistByUSerID 检查管理员是否存在
func (ca *caDB) CheckAdminExistByUSerID(ctx context.Context, userID string) (bool, error) {
	var (
		err   error
		count int64
	)
	newCtx, span := trace.StartInternalSpan(ctx)

	sql := "SELECT COUNT(f_id) FROM t_content_admin WHERE f_user_id = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_QUERY, userID))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Raw(sql, userID).Scan(&count).Error
	if err != nil {
		traceLog.WithContext(newCtx).Warnf("[caDB.CheckAdminExistByUSerID] check admin exist by userid failed, detail: %s", err.Error())
		return false, err
	}
	if count <= 0 {
		return false, nil
	}
	return true, nil
}

func (ca *caDB) ListAdmins(ctx context.Context) ([]ContentAdmin, error) {
	var (
		err    error
		admins []ContentAdmin
	)
	newCtx, span := trace.StartInternalSpan(ctx)

	sql := "SELECT f_id, f_user_id, f_user_name FROM t_content_admin"
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Raw(sql).Scan(&admins).Error
	if err != nil {
		traceLog.WithContext(newCtx).Warnf("[caDB.ListAdmin] list admin failed, detail: %s", err.Error())
		return admins, err
	}

	return admins, nil
}

func (ca *caDB) ListAdminsByUserID(ctx context.Context, userIDs []string) ([]ContentAdmin, error) {
	var (
		err    error
		admins []ContentAdmin
	)
	newCtx, span := trace.StartInternalSpan(ctx)

	sql := "SELECT f_id, f_user_id, f_user_name FROM t_content_admin WHERE f_user_id IN ?"
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Raw(sql, userIDs).Scan(&admins).Error
	if err != nil {
		traceLog.WithContext(newCtx).Warnf("[caDB.ListAdmin] list admin failed, detail: %s", err.Error())
		return admins, err
	}

	return admins, nil
}

// DeleteAdminByID 删除管理员
func (ca *caDB) DeleteAdminByID(ctx context.Context, ID string) error {
	var err error

	newCtx, span := trace.StartInternalSpan(ctx)

	sql := "DELETE FROM t_content_admin WHERE f_id= ?"
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_QUERY, ID))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Exec(sql, ID).Error
	if err != nil {
		traceLog.WithContext(ctx).Warnf("[caDB.DeleteAdminByID] delete admin by id failed, detail: %s", err.Error())
	}
	return err
}

// UpdateAdminByUserID 更新管理员
func (ca *caDB) UpdateAdminByUserID(ctx context.Context, userID, userName string) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)

	sql := "UPDATE t_content_admin SET f_user_name = ? WHERE f_user_id = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, CONTENT_ADMIN_TABLENAME), attribute.String(trace.DB_SQL, sql), attribute.String(trace.DB_QUERY, userID))
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	err = ca.db.Exec(sql, userName, userID).Error
	if err != nil {
		traceLog.WithContext(ctx).Warnf("[caDB.UpdateAdminByUserID] update admin by userid failed, detail: %s", err.Error())
	}
	return err
}
