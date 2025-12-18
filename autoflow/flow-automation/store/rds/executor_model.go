package rds

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/utils"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/db"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"go.opentelemetry.io/otel/attribute"
	"gorm.io/gorm"
)

const (
	EXECUTOR_TABLENAME          = "t_automation_executor"
	EXECUTOR_ACCESSOR_TABLENAME = "t_automation_executor_accessor"
	EXECUTOR_ACTION_TABLENAME   = "t_automation_executor_action"
)

type ExecutorModel struct {
	ID          *uint64                  `gorm:"column:f_id;primary_key:not null" json:"id"`
	Name        *string                  `gorm:"column:f_name;type:varchar(64)" json:"name"`
	Description *string                  `gorm:"column:f_description;type:varchar(256)" json:"description"`
	CreatorID   *string                  `gorm:"column:f_creator_id;type:varchar(40)" json:"creator_id"`
	Status      *int                     `gorm:"column:f_status;type:tinyint" json:"status"`
	CreatedAt   *int64                   `gorm:"column:f_created_at;type:bigint" json:"created_at"`
	UpdatedAt   *int64                   `gorm:"column:f_updated_at;type:bigint" json:"updated_at"`
	Accessors   []*ExecutorAccessorModel `gorm:"-" json:"accessors"`
	Actions     []*ExecutorActionModel   `gorm:"-" json:"actions"`
}

type ExecutorAccessorModel struct {
	ID           *uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	ExecutorID   *uint64 `gorm:"column:f_executor_id;primary_key:not null" json:"executor_id"`
	AccessorID   *string `gorm:"column:f_accessor_id;type:varchar(40)" json:"accessor_id"`
	AccessorType *string `gorm:"column:f_accessor_type;type:varchar(20)" json:"accessor_type"`
}

type ExecutorActionModel struct {
	ID          *uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	ExecutorID  *uint64 `gorm:"column:f_executor_id;primary_key:not null" json:"executor_id"`
	Operator    *string `gorm:"column:f_operator;type:varchar(64)" json:"operator"`
	Name        *string `gorm:"column:f_name;type:varchar(64)" json:"name"`
	Description *string `gorm:"column:f_description;type:varchar(64)" json:"description"`
	Group       *string `gorm:"column:f_group;type:varchar(64)" json:"group"`
	Type        *string `gorm:"column:f_type;type:varchar(16)" json:"type"`
	Inputs      *string `gorm:"column:f_inputs;type:text" json:"inputs"`
	Outputs     *string `gorm:"column:f_outputs;type:text" json:"outputs"`
	Config      *string `gorm:"column:f_config;type:text" json:"config"`
	CreatedAt   *int64  `gorm:"column:f_created_at;type:bigint" json:"created_at"`
	UpdatedAt   *int64  `gorm:"column:f_updated_at;type:bigint" json:"updated_at"`
}

type ExecutorWithActionModel struct {
	// executor fields
	ID          *uint64 `gorm:"column:f_id;primary_key:not null" json:"id"`
	Name        *string `gorm:"column:f_name;type:varchar(64)" json:"name"`
	Description *string `gorm:"column:f_description;type:varchar(256)" json:"description"`
	CreatorID   *string `gorm:"column:f_creator_id;type:varchar(40)" json:"creator_id"`
	Status      *int    `gorm:"column:f_status;type:tinyint" json:"status"`
	CreatedAt   *int64  `gorm:"column:f_created_at;type:bigint" json:"created_at"`
	UpdatedAt   *int64  `gorm:"column:f_updated_at;type:bigint" json:"updated_at"`

	// action fields
	ActionID          *uint64 `gorm:"column:f_action_id;type:bigint" json:"action_id"`
	ActionOperator    *string `gorm:"column:f_action_operator;type:varchar(64)" json:"action_operator"`
	ActionName        *string `gorm:"column:f_action_name;type:varchar(64)" json:"action_name"`
	ActionDescription *string `gorm:"column:f_action_description;type:varchar(256)" json:"action_description"`
	ActionGroup       *string `gorm:"column:f_action_group;type:varchar(64)" json:"action_group"`
	ActionType        *string `gorm:"column:f_action_type;type:varchar(64)" json:"action_type"`
	ActionInputs      *string `gorm:"column:f_action_inputs;type:varchar(256)" json:"action_inputs"`
	ActionOutputs     *string `gorm:"column:f_action_outputs;type:varchar(256)" json:"action_outputs"`
	ActionConfig      *string `gorm:"column:f_action_config;type:varchar(256)" json:"action_config"`
	ActionCreatedAt   *int64  `gorm:"column:f_action_created_at;type:bigint" json:"action_created_at"`
	ActionUpdatedAt   *int64  `gorm:"column:f_action_updated_at;type:bigint" json:"action_updated_at"`
}

type ExecutorDao interface {
	CreateExecutor(ctx context.Context, executor *ExecutorModel) error
	UpdateExecutor(ctx context.Context, executor *ExecutorModel) error
	GetExecutors(ctx context.Context, creatorID string) ([]*ExecutorModel, error)
	GetExecutor(ctx context.Context, id uint64) (*ExecutorModel, error)
	GetExecutorAccessors(ctx context.Context, executorID uint64) ([]*ExecutorAccessorModel, error)
	GetExecutorActions(ctx context.Context, executorID uint64) ([]*ExecutorActionModel, error)
	HasAccessor(ctx context.Context, executorID uint64, accessorIDs []string) (bool, error)
	DeleteExecutor(ctx context.Context, executorID uint64) error
	CreateExecutorAction(ctx context.Context, action *ExecutorActionModel) error
	UpdateExecutorAction(ctx context.Context, action *ExecutorActionModel) error
	DeleteExecutorAction(ctx context.Context, action *ExecutorActionModel) error
	GetAccessableExecutors(ctx context.Context, userID string, accessorIDs []string) ([]*ExecutorModel, error)
	GetAccessableAction(ctx context.Context, actionID uint64, executorID uint64, userID string, accessorIDs []string) (*ExecutorActionModel, error)
	CheckExecutor(ctx context.Context, executor *ExecutorModel) (bool, error)
	CheckExecutorAction(ctx context.Context, action *ExecutorActionModel) (bool, error)
	GetExecutorByName(ctx context.Context, userID string, name string) (executor *ExecutorModel, err error)
}

type ExecutorDaoImpl struct {
	inner *gorm.DB
}

var (
	executor     ExecutorDao
	executorOnce sync.Once
)

func NewExecutor() ExecutorDao {

	executorOnce.Do(func() {
		executor = &ExecutorDaoImpl{
			inner: db.NewDB(),
		}
	})

	return executor
}

func (db *ExecutorDaoImpl) CreateExecutor(ctx context.Context, executor *ExecutorModel) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
		sql := "insert into t_automation_executor (f_id, f_name, f_description, f_creator_id, f_status, f_created_at, f_updated_at) values (?, ?, ?, ?, ?, ?, ?)"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

		result := tx.Exec(sql, executor.ID, executor.Name, executor.Description, executor.CreatorID, executor.Status, executor.CreatedAt, executor.UpdatedAt)
		if result.Error != nil {
			return result.Error
		}

		if len(executor.Accessors) > 0 {
			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACCESSOR_TABLENAME))
			sql = "insert into t_automation_executor_accessor (f_id, f_executor_id, f_accessor_id, f_accessor_type) values (?, ?, ?, ?)"
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

			for _, accessor := range executor.Accessors {
				result = tx.Exec(sql, accessor.ID, accessor.ExecutorID, accessor.AccessorID, accessor.AccessorType)
				if result.Error != nil {
					return result.Error
				}
			}
		}

		if len(executor.Actions) > 0 {
			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))
			sql = "insert into t_automation_executor_action (f_id, f_executor_id, f_operator, f_name, f_description, f_group, f_type, f_inputs, f_outputs, f_config, f_created_at, f_updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

			for _, action := range executor.Actions {
				result = tx.Exec(sql, action.ID, action.ExecutorID, action.Operator, action.Name, action.Description,
					action.Group, action.Type, action.Inputs, action.Outputs, action.Config, action.CreatedAt, action.UpdatedAt)
				if result.Error != nil {
					return result.Error
				}
			}
		}

		return nil
	})

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.CreateExecutor] create executor failed: %s", err.Error())
		return err
	}

	return nil
}

func (db *ExecutorDaoImpl) UpdateExecutor(ctx context.Context, executor *ExecutorModel) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {

		var fields []string
		var args []interface{}
		if executor.Name != nil {
			fields = append(fields, "f_name = ?")
			args = append(args, executor.Name)
		}

		if executor.Description != nil {
			fields = append(fields, "f_description = ?")
			args = append(args, executor.Description)
		}

		if executor.Status != nil {
			fields = append(fields, "f_status = ?")
			args = append(args, executor.Status)
		}

		if len(fields) > 0 {
			fields = append(fields, "f_updated_at = ?")
			args = append(args, executor.UpdatedAt, executor.ID)

			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
			sql := fmt.Sprintf("update t_automation_executor set %s where f_id = ?", strings.Join(fields, ","))
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

			if err = tx.Exec(sql, args...).Error; err != nil {
				return err
			}
		}

		if len(executor.Accessors) > 0 {
			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACCESSOR_TABLENAME))

			var accessorMap = make(map[string]bool, 0)

			for _, accessor := range executor.Accessors {
				key := fmt.Sprintf("%s:%s", *accessor.AccessorType, *accessor.AccessorID)
				accessorMap[key] = true
			}

			var currentAccessors []*ExecutorAccessorModel

			sql := "select f_id, f_executor_id, f_accessor_id, f_accessor_type from t_automation_executor_accessor where f_executor_id = ?"
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

			if err = tx.Raw(sql, *executor.ID).Scan(&currentAccessors).Error; err != nil {
				return err
			}

			if len(currentAccessors) > 0 {
				var deleteAccessorIDs = make([]interface{}, 0)

				for _, accessor := range currentAccessors {
					key := fmt.Sprintf("%s:%s", *accessor.AccessorType, *accessor.AccessorID)
					if _, ok := accessorMap[key]; !ok {
						deleteAccessorIDs = append(deleteAccessorIDs, *accessor.ID)
					} else {
						accessorMap[key] = false
					}
				}

				if l := len(deleteAccessorIDs); l > 0 {
					sql = fmt.Sprintf(
						"delete from t_automation_executor_accessor where f_id in (%s)",
						utils.StringRepeat("?", l, ","),
					)
					trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

					if err = tx.Exec(sql, deleteAccessorIDs...).Error; err != nil {
						return err
					}
				}
			}

			var fields []string
			var args []interface{}

			for _, accessor := range executor.Accessors {
				if flag := accessorMap[fmt.Sprintf("%s:%s", *accessor.AccessorType, *accessor.AccessorID)]; !flag {
					continue
				}
				fields = append(fields, "(?, ?, ?, ?)")
				args = append(args, accessor.ID, accessor.ExecutorID, accessor.AccessorID, accessor.AccessorType)
			}

			if len(fields) > 0 {
				sql = fmt.Sprintf("insert into t_automation_executor_accessor (f_id, f_executor_id, f_accessor_id, f_accessor_type) values %s", strings.Join(fields, ","))
				trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

				if err = tx.Exec(sql, args...).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.UpdateExecutor] update executor failed: %s", err.Error())
		return err
	}

	return nil
}

func (db *ExecutorDaoImpl) GetExecutors(ctx context.Context, userID string) ([]*ExecutorModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)
	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))

	var executors = make([]*ExecutorModel, 0)

	sql := "select" +
		" f_id, f_name, f_description, f_creator_id, f_status, f_created_at, f_updated_at" +
		" from t_automation_executor" +
		" where f_creator_id = ?" +
		" order by f_updated_at desc"

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	err = db.inner.Raw(sql, userID).Scan(&executors).Error
	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetExecutors] get executors failed: %s", err.Error())
		return nil, err
	}

	return executors, nil
}

func (db *ExecutorDaoImpl) GetExecutor(ctx context.Context, id uint64) (*ExecutorModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
	sql := "select f_id, f_name, f_description, f_creator_id, f_status, f_created_at, f_updated_at from t_automation_executor where f_id = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var executors = make([]*ExecutorModel, 0)
	err = db.inner.Raw(sql, id).Scan(&executors).Error
	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetExecutor] get executor failed: %s", err.Error())
		return nil, err
	}

	if len(executors) > 0 {
		return executors[0], nil
	}

	return nil, nil
}

func (db *ExecutorDaoImpl) GetExecutorAccessors(ctx context.Context, executorID uint64) ([]*ExecutorAccessorModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACCESSOR_TABLENAME))
	sql := "select f_id, f_executor_id, f_accessor_id, f_accessor_type from t_automation_executor_accessor where f_executor_id = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var accessors = make([]*ExecutorAccessorModel, 0)
	err = db.inner.Raw(sql, executorID).Scan(&accessors).Error
	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetExecutorAccessors] get executor accessors failed: %s", err.Error())
		return nil, err
	}
	return accessors, nil
}

func (db *ExecutorDaoImpl) GetExecutorActions(ctx context.Context, executorID uint64) ([]*ExecutorActionModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))
	sql := "select f_id, f_executor_id, f_operator, f_name, f_description, f_group, f_type, f_inputs, f_outputs, f_config, f_created_at, f_updated_at from t_automation_executor_action where f_executor_id = ?"
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var actions = make([]*ExecutorActionModel, 0)
	err = db.inner.Raw(sql, executorID).Scan(&actions).Error
	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetExecutorActions] get executor actions failed: %s", err.Error())
		return nil, err
	}
	return actions, nil
}

func (db *ExecutorDaoImpl) HasAccessor(ctx context.Context, executorID uint64, accessorIDs []string) (bool, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACCESSOR_TABLENAME))

	var count int64

	sql := fmt.Sprintf("select count(1) from t_automation_executor_accessor where f_executor_id = ? and f_accessor_id in (%s)",
		utils.StringRepeat("?", len(accessorIDs), ","))

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	args := []interface{}{executorID}
	for i := 0; i < len(accessorIDs); i++ {
		args = append(args, accessorIDs[i])
	}

	err = db.inner.Raw(sql, args...).Scan(&count).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.HasAccessor] check executor accessors failed: %s", err.Error())
		return false, err
	}

	return count > 0, nil
}

func (db *ExecutorDaoImpl) DeleteExecutor(ctx context.Context, executorID uint64) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {

		var txErr error

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
		sql := "delete from t_automation_executor where f_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		txErr = tx.Exec(sql, executorID).Error

		if txErr != nil {
			log.Warnf("[ExecutorDaoImpl.DeleteExecutor] delete executor failed: %s", err.Error())
			return txErr
		}

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))
		sql = "delete from t_automation_executor_action where f_executor_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		txErr = tx.Exec(sql, executorID).Error

		if txErr != nil {
			log.Warnf("[ExecutorDaoImpl.DeleteExecutor] delete executor actions failed: %s", err.Error())
			return txErr
		}

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACCESSOR_TABLENAME))
		sql = "delete from t_automation_executor_accessor where f_executor_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		txErr = tx.Exec(sql, executorID).Error

		if txErr != nil {
			log.Warnf("[ExecutorDaoImpl.DeleteExecutor] delete executor accessors failed: %s", err.Error())
			return txErr
		}

		return nil
	})

	return err
}

func (db *ExecutorDaoImpl) CreateExecutorAction(ctx context.Context, action *ExecutorActionModel) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {
		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))
		sql := "insert into t_automation_executor_action (f_id, f_executor_id, f_operator, f_name, f_description, f_group, f_type, f_inputs, f_outputs, f_config, f_created_at, f_updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		result := tx.Exec(sql, action.ID, action.ExecutorID, action.Operator, action.Name, action.Description, action.Group,
			action.Type, action.Inputs, action.Outputs, action.Config, action.CreatedAt, action.UpdatedAt)

		if result.Error != nil {
			log.Warnf("[ExecutorDaoImpl.CreateExecutorAction] create executor action failed: %s", err.Error())
			return result.Error
		}

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
		sql = "update t_automation_executor set f_updated_at = ? where f_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		result = tx.Exec(sql, action.UpdatedAt, action.ExecutorID)
		if result.Error != nil {
			log.Warnf("[ExecutorDaoImpl.CreateExecutorAction] update executor failed: %s", err.Error())
			return result.Error
		}

		return nil
	})

	return err
}

func (db *ExecutorDaoImpl) UpdateExecutorAction(ctx context.Context, action *ExecutorActionModel) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {

		var fields []string
		var args []interface{}

		if action.Name != nil {
			fields = append(fields, "f_name = ?")
			args = append(args, action.Name)
		}

		if action.Description != nil {
			fields = append(fields, "f_description = ?")
			args = append(args, action.Description)
		}

		if action.Group != nil {
			fields = append(fields, "f_group = ?")
			args = append(args, action.Group)
		}

		if action.Inputs != nil {
			fields = append(fields, "f_inputs = ?")
			args = append(args, action.Inputs)
		}

		if action.Outputs != nil {
			fields = append(fields, "f_outputs = ?")
			args = append(args, action.Outputs)
		}

		if action.Config != nil {
			fields = append(fields, "f_config = ?")
			args = append(args, action.Config)
		}

		if len(fields) > 0 {
			fields = append(fields, "f_updated_at = ?")
			args = append(args, action.UpdatedAt, action.ID, action.ExecutorID)

			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
			sql := fmt.Sprintf("update t_automation_executor_action set %s where f_id = ? and f_executor_id = ?", strings.Join(fields, ","))
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

			result := tx.Exec(sql, args...)

			if result.Error != nil {
				log.Warnf("[ExecutorDaoImpl.UpdateExecutorAction] update executor action failed: %s", err.Error())
				return result.Error
			}

			if result.RowsAffected == 0 {
				return nil
			}

			trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
			sql = "update t_automation_executor set f_updated_at = ? where f_id = ?"
			trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
			if result = tx.Exec(sql, action.UpdatedAt, action.ExecutorID); result.Error != nil {
				log.Warnf("[ExecutorDaoImpl.UpdateExecutorAction] update executor failed: %s", err.Error())
				return result.Error
			}
		}

		return nil
	})

	return err
}

func (db *ExecutorDaoImpl) DeleteExecutorAction(ctx context.Context, action *ExecutorActionModel) error {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	err = db.inner.Transaction(func(tx *gorm.DB) error {
		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))
		sql := "delete from t_automation_executor_action where f_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		result := tx.Exec(sql, action.ID)
		if result.Error != nil {
			log.Warnf("[ExecutorDaoImpl.DeleteExecutorAction] delete executor action failed: %s", err.Error())
			return result.Error
		}

		if result.RowsAffected == 0 {
			return nil
		}

		trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
		sql = "update t_automation_executor set f_updated_at = ? where f_id = ?"
		trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))
		result = tx.Exec(sql, action.UpdatedAt, action.ExecutorID)
		if result.Error != nil {
			log.Warnf("[ExecutorDaoImpl.DeleteExecutorAction] update executor failed: %s", err.Error())
			return result.Error
		}

		return nil
	})

	return err
}

func (db *ExecutorDaoImpl) GetAccessableExecutors(ctx context.Context, userID string, accessorIDs []string) ([]*ExecutorModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))

	var results = make([]*ExecutorWithActionModel, 0)

	sql := fmt.Sprintf(
		"select"+
			" distinct t2.f_id as f_action_id, t2.f_operator as f_action_operator, t2.f_name as f_action_name"+
			", t2.f_description as f_action_description, t2.f_group as f_action_group, t2.f_type as f_action_type"+
			", t2.f_inputs as f_action_inputs, t2.f_outputs as f_action_outputs, t2.f_config as f_action_config"+
			", t2.f_created_at as f_action_created_at, t2.f_updated_at as f_action_updated_at"+
			", t1.f_id, t1.f_name, t1.f_description, t1.f_creator_id, t1.f_status, t1.f_created_at, t1.f_updated_at"+
			" from t_automation_executor t1"+
			" left join t_automation_executor_action t2 on t1.f_id = t2.f_executor_id"+
			" left join t_automation_executor_accessor t3 on t1.f_id = t3.f_executor_id"+
			" where t1.f_status = 1 and (t1.f_creator_id = ? or t3.f_accessor_id in (%s))"+
			" order by t1.f_name asc, t2.f_name asc",
		utils.StringRepeat("?", len(accessorIDs), ","),
	)

	args := []interface{}{userID}

	for _, accessorID := range accessorIDs {
		args = append(args, accessorID)
	}

	err = db.inner.Raw(sql, args...).Scan(&results).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetAccessableExecutors] get executors failed: %s", err.Error())
		return nil, err
	}

	var executors = make([]*ExecutorModel, 0)

	if len(results) > 0 {
		var executorMap = make(map[uint64]*ExecutorModel, 0)
		for _, item := range results {
			executor, exist := executorMap[*item.ID]
			if !exist {
				executor = &ExecutorModel{
					ID:          item.ID,
					Name:        item.Name,
					Description: item.Description,
					CreatorID:   item.CreatorID,
					Status:      item.Status,
					CreatedAt:   item.CreatedAt,
					UpdatedAt:   item.UpdatedAt,
				}
				executorMap[*item.ID] = executor
				executors = append(executors, executor)
			}

			if item.ActionID != nil {
				executor.Actions = append(executor.Actions, &ExecutorActionModel{
					ID:          item.ActionID,
					ExecutorID:  item.ID,
					Operator:    item.ActionOperator,
					Name:        item.ActionName,
					Description: item.ActionDescription,
					Group:       item.ActionGroup,
					Type:        item.ActionType,
					Inputs:      item.ActionInputs,
					Outputs:     item.ActionOutputs,
					Config:      item.ActionConfig,
					CreatedAt:   item.ActionCreatedAt,
					UpdatedAt:   item.ActionUpdatedAt,
				})
			}
		}
	}

	return executors, nil
}

func (db *ExecutorDaoImpl) GetAccessableAction(ctx context.Context, actionID uint64, executorID uint64, userID string, accessorIDs []string) (*ExecutorActionModel, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))

	var results = make([]*ExecutorActionModel, 0)

	sql := fmt.Sprintf(
		"select"+
			" distinct t2.f_id, t2.f_executor_id, t2.f_operator, t2.f_name, t2.f_description"+
			", t2.f_group, t2.f_type, t2.f_inputs, t2.f_outputs, t2.f_config, t2.f_created_at, t2.f_updated_at"+
			" from t_automation_executor t1"+
			" left join t_automation_executor_action t2 on t1.f_id = t2.f_executor_id"+
			" left join t_automation_executor_accessor t3 on t1.f_id = t3.f_executor_id"+
			" where t2.f_executor_id = ? and t2.f_id = ? and t1.f_status = 1 and (t1.f_creator_id = ? or t3.f_accessor_id in (%s))"+
			" order by t1.f_name asc, t2.f_name asc",
		utils.StringRepeat("?", len(accessorIDs), ","),
	)

	args := []interface{}{executorID, actionID, userID}

	for _, accessorID := range accessorIDs {
		args = append(args, accessorID)
	}

	err = db.inner.Raw(sql, args...).Scan(&results).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetAccessableAction] get action failed: %s", err.Error())
		return nil, err
	}

	if len(results) == 0 {
		log.Warnf("action not found: executorID %d, actionID %d", executorID, actionID)
		return nil, fmt.Errorf("action not found: executorID %d, actionID %d", executorID, actionID)
	}

	return results[0], nil
}

func (db *ExecutorDaoImpl) CheckExecutor(ctx context.Context, executor *ExecutorModel) (bool, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
	sql := "select count(1) from t_automation_executor where f_creator_id = ? and f_name = ?"
	args := []interface{}{executor.CreatorID, executor.Name}
	if executor.ID != nil {
		sql += " and f_id != ?"
		args = append(args, executor.ID)
	}

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var count uint64
	err = db.inner.Raw(sql, args...).Scan(&count).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.CheckExecutor] get count failed: %s", err.Error())
		return false, err
	}

	return count == 0, nil
}

func (db *ExecutorDaoImpl) CheckExecutorAction(ctx context.Context, action *ExecutorActionModel) (bool, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_ACTION_TABLENAME))

	sql := "select count(1) from t_automation_executor_action where f_executor_id = ? and f_name = ?"
	args := []interface{}{action.ExecutorID, action.Name}

	if action.ID != nil {
		sql += " and f_id != ?"
		args = append(args, action.ID)
	}

	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	var count uint64
	err = db.inner.Raw(sql, args...).Scan(&count).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.CheckExecutorAction] get count failed: %s", err.Error())
		return false, err
	}

	return count == 0, nil
}

func (db *ExecutorDaoImpl) GetExecutorByName(ctx context.Context, userID string, name string) (executor *ExecutorModel, err error) {

	newCtx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	log := traceLog.WithContext(newCtx)

	trace.SetAttributes(newCtx, attribute.String(trace.TABLE_NAME, EXECUTOR_TABLENAME))
	sql := "select * from t_automation_executor where f_creator_id = ? and f_name = ?"
	args := []interface{}{userID, name}
	trace.SetAttributes(newCtx, attribute.String(trace.DB_SQL, sql))

	executor = &ExecutorModel{}
	err = db.inner.Raw(sql, args...).Scan(executor).Error

	if err != nil {
		log.Warnf("[ExecutorDaoImpl.GetExecutorByName] get executor failed: %s", err.Error())
		return nil, err
	}

	if executor.ID == nil {
		return nil, nil
	}

	return
}
