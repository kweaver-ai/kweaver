package toolbox

import (
	"context"
	"net/http"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
)

// 优化查询
func (s *ToolServiceImpl) batchGetToolInfo(ctx context.Context, toolDBs []*model.ToolDB) (toolInfos []*interfaces.ToolInfo,
	userIDs []string, toolIDSourceMap map[string]string, metadataIDs []string, err error) {
	toolInfos = []*interfaces.ToolInfo{}
	// 收集信息
	var operatorIDs []string
	// tooID 和Source映射
	toolIDSourceMap = make(map[string]string)
	operatorToToolMap := make(map[string]string)
	for _, toolDB := range toolDBs {
		globalParameters := &interfaces.ParametersStruct{}
		if toolDB.Parameters != "" {
			err = utils.StringToObject(toolDB.Parameters, globalParameters)
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("parse global parameters failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
				return
			}
		}
		extendInfo := map[string]interface{}{}
		_ = utils.StringToObject(toolDB.ExtendInfo, &extendInfo)
		toolInfo := &interfaces.ToolInfo{
			ToolID:           toolDB.ToolID,
			Name:             toolDB.Name,
			Description:      toolDB.Description,
			Status:           interfaces.ToolStatusType(toolDB.Status),
			UseRule:          toolDB.UseRule,
			GlobalParameters: globalParameters,
			MetadataType:     interfaces.MetadataTypeAPI,
			ExtendInfo:       extendInfo,
			UpdateTime:       toolDB.UpdateTime,
			CreateTime:       toolDB.CreateTime,
			UpdateUser:       toolDB.UpdateUser,
			CreateUser:       toolDB.CreateUser,
		}
		toolInfos = append(toolInfos, toolInfo)
		toolIDSourceMap[toolDB.ToolID] = toolDB.SourceID
		switch toolDB.SourceType {
		case model.SourceTypeOperator:
			operatorToToolMap[toolDB.SourceID] = toolDB.ToolID
			operatorIDs = append(operatorIDs, toolDB.SourceID)
		case model.SourceTypeOpenAPI:
			metadataIDs = append(metadataIDs, toolDB.SourceID)
		}
		userIDs = append(userIDs, toolDB.CreateUser, toolDB.UpdateUser)
	}
	if len(operatorIDs) > 0 {
		operatorIDs = utils.UniqueStrings(operatorIDs)
		var metadataMap map[string]string
		metadataMap, err = s.OperatorMgnt.GetOperatorMetadataVersionByIDs(ctx, operatorIDs)
		if err != nil {
			return
		}
		for _, operatorID := range operatorIDs {
			metadataID := metadataMap[operatorID]
			toolID := operatorToToolMap[operatorID]
			toolIDSourceMap[toolID] = metadataID
			metadataIDs = append(metadataIDs, metadataID)
		}
	}
	return
}

// 批量并发收集元数据
func (s *ToolServiceImpl) batchGetMetadata(ctx context.Context, metadataIDs []string) (metadataMap map[string]*interfaces.APIMetadata, err error) {
	metadataMap = make(map[string]*interfaces.APIMetadata)
	// 分批查询元数据
	metadataDBs, err := func() ([]*model.APIMetadataDB, error) {
		// 分批查询元数据
		metadataDBs := []*model.APIMetadataDB{}
		var metadataList []*model.APIMetadataDB
		metadataIDs = utils.UniqueStrings(metadataIDs)
		if len(metadataIDs) == 0 {
			return []*model.APIMetadataDB{}, nil
		}
		for i := 0; i < len(metadataIDs); i += interfaces.DefaultBatchSize {
			end := i + interfaces.DefaultBatchSize
			if end > len(metadataIDs) {
				end = len(metadataIDs)
			}
			metadataList, err = s.MetadataDB.SelectListByVersion(ctx, metadataIDs[i:end])
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("select metadata failed, err: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select metadata failed")
				return nil, err
			}
			metadataDBs = append(metadataDBs, metadataList...)
		}
		return metadataDBs, nil
	}()
	// 收集元数据信息
	for _, metadataDB := range metadataDBs {
		apiSpec := &interfaces.APISpec{}
		err = utils.StringToObject(metadataDB.APISpec, apiSpec)
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("parse api spec failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			continue
		}
		metadataMap[metadataDB.Version] = &interfaces.APIMetadata{
			Summary:     metadataDB.Summary,
			Version:     metadataDB.Version,
			Description: metadataDB.Description,
			Path:        metadataDB.Path,
			ServerURL:   metadataDB.ServerURL,
			Method:      metadataDB.Method,
			CreateTime:  metadataDB.CreateTime,
			UpdateTime:  metadataDB.UpdateTime,
			UpdateUser:  metadataDB.UpdateUser,
			CreateUser:  metadataDB.CreateUser,
			APISpec:     apiSpec,
		}
	}
	return
}

func (s *ToolServiceImpl) getToolBoxList(ctx context.Context, toolBoxDBList []*model.ToolboxDB, resourceToBdMap map[string]string) (toolBoxInfoList []*interfaces.ToolBoxInfo, err error) {
	// 组装工具箱信息结果
	toolBoxInfoList = []*interfaces.ToolBoxInfo{}
	var userIDs, boxIDs []string
	for _, toolBox := range toolBoxDBList {
		toolBoxInfoList = append(toolBoxInfoList, &interfaces.ToolBoxInfo{
			BusinessDomainID: resourceToBdMap[toolBox.BoxID],
			BoxID:            toolBox.BoxID,
			BoxName:          toolBox.Name,
			BoxDesc:          toolBox.Description,
			BoxSvcURL:        toolBox.ServerURL,
			Status:           interfaces.BizStatus(toolBox.Status),
			CategoryType:     toolBox.Category,
			CategoryName:     s.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(toolBox.Category)),
			IsInternal:       toolBox.IsInternal,
			Source:           toolBox.Source,
			CreateTime:       toolBox.CreateTime,
			UpdateTime:       toolBox.UpdateTime,
			CreateUser:       toolBox.CreateUser,
			UpdateUser:       toolBox.UpdateUser,
			ReleaseUser:      toolBox.ReleaseUser,
			ReleaseTime:      toolBox.ReleaseTime,
		})
		userIDs = append(userIDs, toolBox.CreateUser, toolBox.UpdateUser, toolBox.ReleaseUser)
		boxIDs = append(boxIDs, toolBox.BoxID)
	}
	toolNameMap := make(map[string][]string)
	for i := 0; i < len(boxIDs); i += interfaces.DefaultBatchSize {
		end := i + interfaces.DefaultBatchSize
		if end > len(boxIDs) {
			end = len(boxIDs)
		}
		// 查询工具箱下的工具
		var toolNameList map[string][]string
		toolNameList, err = s.ToolDB.SelectToolNameListByBoxID(ctx, boxIDs[i:end])
		if err != nil {
			s.Logger.WithContext(ctx).Errorf("select toolbox tools failed, err: %v", err)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
			return
		}
		for boxID, toolNames := range toolNameList {
			toolNameMap[boxID] = toolNames
		}
	}
	// 获取用户名称
	userMap, err := s.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		return
	}
	for i, toolBox := range toolBoxInfoList {
		toolBoxInfoList[i].Tools = toolNameMap[toolBox.BoxID]
		toolBoxInfoList[i].CreateUser = userMap[toolBox.CreateUser]
		toolBoxInfoList[i].UpdateUser = userMap[toolBox.UpdateUser]
		toolBoxInfoList[i].ReleaseUser = userMap[toolBox.ReleaseUser]
	}
	return
}
