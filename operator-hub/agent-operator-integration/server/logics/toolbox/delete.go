package toolbox

import (
	"context"
	"database/sql"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
)

func (s *ToolServiceImpl) deleteTools(ctx context.Context, tx *sql.Tx, boxID string, tools []*model.ToolDB) (err error) {
	var toolIDs, metadatas []string
	for _, tool := range tools {
		toolIDs = append(toolIDs, tool.ToolID)
		switch tool.SourceType {
		case model.SourceTypeOpenAPI:
			metadatas = append(metadatas, tool.SourceID)
		case model.SourceTypeOperator:
		}
	}
	// 删除元数据
	if len(metadatas) > 0 {
		err = s.MetadataDB.DeleteByVersions(ctx, tx, metadatas)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("delete metadata failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	// 删除工具
	if len(toolIDs) > 0 {
		err = s.ToolDB.DeleteBoxByIDAndTools(ctx, tx, boxID, toolIDs)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("delete tool failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
	}
	return
}

func (s *ToolServiceImpl) deleteToolBox(ctx context.Context, tx *sql.Tx, boxID string) (err error) {
	tools, err := s.ToolDB.SelectToolByBoxID(ctx, boxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	err = s.deleteTools(ctx, tx, boxID, tools)
	if err != nil {
		return
	}
	// 删除工具箱
	err = s.ToolBoxDB.DeleteToolBox(ctx, tx, boxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("delete toolbox failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	// 删除配置
	err = s.IntCompConfigSvc.DeleteConfig(ctx, tx, interfaces.ComponentTypeToolBox.String(), boxID)
	return
}
