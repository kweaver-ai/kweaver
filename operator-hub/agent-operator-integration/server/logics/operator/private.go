package operator

import (
	"context"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// 该文件方法为内部逻辑接口
// GetOperatorInfoByOperatorID 获取指定OperatorID的Operator信息(内部接口)
func (m *operatorManager) GetOperatorInfoByOperatorIDPrivate(ctx context.Context, operatorID string) (result *interfaces.OperatorDataInfo, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	var operator *model.OperatorRegisterDB
	operator, metadata, err := m.getOperatorRegisterInfo(ctx, operatorID)
	if err != nil {
		return
	}
	_, result, err = m.assembleOperatorResult(ctx, operator, metadata)
	if err != nil {
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
	}
	return
}

// GetOperatorMetadataVersionByIDs 根据算子ID列表获取算子元数据版本列表
func (m *operatorManager) GetOperatorMetadataVersionByIDs(ctx context.Context, operatorIDs []string) (metadataMap map[string]string, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	metadataMap = map[string]string{}
	DBOperatorManager, err := m.DBOperatorManager.SelectByOperatorIDs(ctx, operatorIDs)
	if err != nil {
		m.Logger.WithContext(ctx).Errorf("GetOperatorMetadataVersionByIDs SelectByOperatorIDs failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	for _, operator := range DBOperatorManager {
		metadataMap[operator.OperatorID] = operator.MetadataVersion
	}
	return
}
