package operator

import (
	"context"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
)

func checkIsDataSource(ctx context.Context, mode interfaces.ExecutionMode, isDataSourceReq *bool) (isDataSource bool, err error) {
	// 检查是否为数据源,如果是异步执行,则不支持数据源
	if isDataSourceReq == nil || !*isDataSourceReq {
		return
	}
	switch mode {
	case interfaces.ExecutionModeAsync:
		err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtOperatorAsyncDataSource,
			"async operator not support data source")
	case interfaces.ExecutionModeSync:
		isDataSource = true
	case interfaces.ExecutionModeStream:
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "stream operator not support data source")
	}
	return
}
