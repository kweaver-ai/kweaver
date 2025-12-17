package toolbox

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	infracommon "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common/ormhelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces/model"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/logics/auth"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/utils"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
)

// 排序字段与数据库字段映射
var sortFieldMap = map[string]string{
	"create_time": "f_create_time",
	"update_time": "f_update_time",
	"name":        "f_name",
}

// GetMarketToolList 获取市场工具列表
/*
权限校验：公共访问权限
查询条件：
1. 根据工具name、status查询状态
2. 根据工具箱id，查询全部工具箱信息（已发布的）
3. 组装信息
*/
func (s *ToolServiceImpl) GetMarketToolList(ctx context.Context, req *interfaces.QueryMarketToolListReq) (resp *interfaces.QueryMarketToolListResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 权限校验
	accessor, err := s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	// 构造查询条件
	filter := make(map[string]interface{})
	filter["all"] = true
	if req.ToolName != "" {
		filter["name"] = req.ToolName
	}
	if req.Status != "" {
		filter["status"] = req.Status
	}
	filter["sort_by"] = req.SortBy
	filter["sort_order"] = req.SortOrder
	// 查询工具列表
	tools, err := s.ToolDB.SelectToolList(ctx, filter)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool list failed, err: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, err.Error())
		return
	}
	if len(tools) == 0 {
		resp = &interfaces.QueryMarketToolListResp{
			CommonPageResult: interfaces.CommonPageResult{
				Page:     req.Page,
				PageSize: req.PageSize,
			},
			Data: []*interfaces.ToolBoxToolInfo{},
		}
		return
	}
	// 组装响应数据
	var boxIDs []string
	toolBoxToolInfo := map[string][]*model.ToolDB{}
	for _, tool := range tools {
		boxIDs = append(boxIDs, tool.BoxID)
		toolBoxToolInfo[tool.BoxID] = append(toolBoxToolInfo[tool.BoxID], tool)
	}

	// 获取业务域下有权限的资源Id
	businessDomainStr, _ := infracommon.GetBusinessDomainFromCtx(ctx)
	businessDomainIds := strings.Split(businessDomainStr, ",")
	resourceToBdMap, err := s.BusinessDomainService.BatchResourceList(ctx, businessDomainIds, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}

	// 获取工具箱信息
	authResp, err := auth.SelectListWithAuth(ctx, req.Page, req.PageSize, req.All, func() ([]*model.ToolboxDB, error) {
		var boxList []*model.ToolboxDB
		// 分页查询工具箱信息
		for i := 0; i < len(boxIDs); i += interfaces.DefaultBatchSize {
			end := i + interfaces.DefaultBatchSize
			if end > len(boxIDs) {
				end = len(boxIDs)
			}
			var boxDBs []*model.ToolboxDB
			boxDBs, err = s.ToolBoxDB.SelectListByBoxIDsFilter(ctx, boxIDs[i:end], interfaces.BizStatusPublished.String(), filter)
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("select toolbox list error: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select toolbox list error")
				return nil, err
			}
			boxList = append(boxList, boxDBs...)
		}
		return boxList, nil
	},
		func() ([]string, error) {
			resourceIDs := make([]string, 0, len(resourceToBdMap))
			for resourceID := range resourceToBdMap {
				resourceIDs = append(resourceIDs, resourceID)
			}
			if len(resourceIDs) == 0 {
				return []string{}, nil
			}

			var authResourceIds []string
			authResourceIds, err = s.AuthService.ResourceListIDs(ctx, accessor, interfaces.AuthResourceTypeToolBox, interfaces.AuthOperationTypePublicAccess)
			if err != nil {
				return nil, err
			}

			var hasFullAccess bool
			for _, authResourceId := range authResourceIds {
				if authResourceId == interfaces.ResourceIDAll {
					hasFullAccess = true
					break
				}
			}
			if hasFullAccess {
				return resourceIDs, nil
			}

			return utils.CalculateIntersection(resourceIDs, authResourceIds), nil
		})
	if err != nil {
		return
	}
	toolboxDBs := authResp.Data
	resp = &interfaces.QueryMarketToolListResp{
		CommonPageResult: authResp.CommonPageResult,
		Data:             []*interfaces.ToolBoxToolInfo{},
	}
	if len(toolboxDBs) == 0 {
		return
	}
	var userIDs []string
	toolIDSourceMap := make(map[string]string)
	var metadataIDs []string
	for _, toolBox := range toolboxDBs {
		toolBoxInfo := &interfaces.ToolBoxToolInfo{
			BusinessDomainID: resourceToBdMap[toolBox.BoxID],
			BoxID:            toolBox.BoxID,
			BoxName:          toolBox.Name,
			BoxDesc:          toolBox.Description,
			Status:           interfaces.BizStatus(toolBox.Status),
			BoxSvcURL:        toolBox.ServerURL,
			CategoryType:     toolBox.Category,
			CategoryName:     s.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(toolBox.Category)),
			IsInternal:       toolBox.IsInternal,
			Source:           toolBox.Source,
			Tools:            []*interfaces.ToolInfo{},
			CreateTime:       toolBox.CreateTime,
			UpdateTime:       toolBox.UpdateTime,
			CreateUser:       toolBox.CreateUser,
			UpdateUser:       toolBox.UpdateUser,
			ReleaseTime:      toolBox.ReleaseTime,
			ReleaseUser:      toolBox.ReleaseUser,
		}
		userIDs = append(userIDs, toolBox.CreateUser, toolBox.UpdateUser, toolBox.ReleaseUser)
		var toolInfos []*interfaces.ToolInfo
		var toolUserIDs, mids []string
		var toolIDMetadataMap map[string]string
		toolInfos, toolUserIDs, toolIDMetadataMap, mids, err = s.batchGetToolInfo(ctx, toolBoxToolInfo[toolBox.BoxID])
		if err != nil {
			return
		}
		toolBoxInfo.Tools = append(toolBoxInfo.Tools, toolInfos...)
		userIDs = append(userIDs, toolUserIDs...)
		resp.Data = append(resp.Data, toolBoxInfo)
		metadataIDs = append(metadataIDs, mids...)
		for toolID, source := range toolIDMetadataMap {
			toolIDSourceMap[toolID] = source
		}
	}
	metadataMap, err := s.batchGetMetadata(ctx, metadataIDs)
	if err != nil {
		return
	}
	for _, toolBox := range resp.Data {
		for _, tool := range toolBox.Tools {
			metadataDB, ok := metadataMap[toolIDSourceMap[tool.ToolID]]
			if !ok {
				s.Logger.WithContext(ctx).Errorf("metadata not found, toolID: %s", tool.ToolID)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "metadata not found")
				return
			}
			metadataDB.ServerURL = toolBox.BoxSvcURL
			tool.Metadata = metadataDB
		}
	}

	// 获取用户名称
	userMap, err := s.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		return
	}
	for _, toolBox := range resp.Data {
		toolBox.CreateUser = userMap[toolBox.CreateUser]
		toolBox.UpdateUser = userMap[toolBox.UpdateUser]
		toolBox.ReleaseUser = userMap[toolBox.ReleaseUser]
		for _, tool := range toolBox.Tools {
			tool.CreateUser = userMap[tool.CreateUser]
			tool.UpdateUser = userMap[tool.UpdateUser]
		}
	}
	return
}

// GetReleaseToolBoxInfo 获取发布工具信息
func (s *ToolServiceImpl) GetReleaseToolBoxInfo(ctx context.Context, req *interfaces.GetReleaseToolBoxInfoReq) (
	resp []*interfaces.GetReleaseToolBoxInfoResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 参数校验
	boxIDs := strings.Split(req.BoxIDs, ",")
	if len(boxIDs) == 0 {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "box_id is nil")
		return
	}
	fields := strings.Split(req.Fields, ",")
	if len(fields) == 0 {
		err = errors.DefaultHTTPError(ctx, http.StatusBadRequest, "fields is nil")
		return
	}
	resp = []*interfaces.GetReleaseToolBoxInfoResp{}
	// 权限过滤
	var accessor *interfaces.AuthAccessor
	accessor, err = s.AuthService.GetAccessor(ctx, req.UserID)
	if err != nil {
		return
	}
	var page, pageSize int
	authResp, err := auth.SelectListWithAuth(
		ctx, page, pageSize, true,
		func() ([]*model.ToolboxDB, error) {
			var boxList []*model.ToolboxDB
			boxList, err = s.ToolBoxDB.SelectListByBoxIDs(ctx, boxIDs, interfaces.BizStatusPublished.String())
			if err != nil {
				s.Logger.WithContext(ctx).Errorf("select toolbox list error: %v", err)
				err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select toolbox list error")
				return nil, err
			}
			return boxList, nil
		},
		func() ([]string, error) {
			return s.AuthService.ResourceListIDs(ctx, accessor, interfaces.AuthResourceTypeToolBox, interfaces.AuthOperationTypePublicAccess)
		},
	)
	if err != nil {
		return nil, err
	}
	toolBoxList := authResp.Data
	if len(toolBoxList) == 0 {
		return
	}
	fieldMap := map[string]bool{}
	for _, field := range fields {
		fieldMap[field] = true
	}
	var userIDs []string
	// 组织数据
	for _, toolBox := range toolBoxList {
		info := &interfaces.GetReleaseToolBoxInfoResp{
			BoxID: toolBox.BoxID,
		}
		if fieldMap["box_name"] {
			info.BoxName = toolBox.Name
		}
		if fieldMap["box_desc"] {
			info.BoxDesc = toolBox.Description
		}
		if fieldMap["box_svc_url"] {
			info.BoxSvcURL = toolBox.ServerURL
		}
		if fieldMap["status"] {
			info.Status = toolBox.Status
		}
		if fieldMap["category_type"] {
			info.Category = interfaces.BizCategory(toolBox.Category)
		}
		if fieldMap["category_name"] {
			info.CategoryName = s.CategoryManager.GetCategoryName(ctx, interfaces.BizCategory(toolBox.Category))
		}
		if fieldMap["is_internal"] {
			info.IsInternal = &toolBox.IsInternal
		}
		if fieldMap["source"] {
			info.Source = toolBox.Source
		}
		if fieldMap["create_user"] {
			info.CreateUser = toolBox.CreateUser
			userIDs = append(userIDs, toolBox.CreateUser)
		}
		if fieldMap["update_user"] {
			info.UpdateUser = toolBox.UpdateUser
			userIDs = append(userIDs, toolBox.UpdateUser)
		}
		if fieldMap["release_user"] {
			info.ReleaseUser = toolBox.ReleaseUser
			userIDs = append(userIDs, toolBox.ReleaseUser)
		}
		if fieldMap["tools"] {
			info.Tools, err = s.getToolBoxAllToolInfo(ctx, toolBox)
			if err != nil {
				return
			}
		}
		resp = append(resp, info)
	}
	if len(userIDs) == 0 {
		return
	}
	userMap, err := s.UserMgnt.GetUsersName(ctx, userIDs)
	if err != nil {
		return
	}
	for _, info := range resp {
		if info.CreateUser != "" {
			info.CreateUser = utils.GetValueOrDefault(userMap, info.CreateUser, "")
		}
		if info.UpdateUser != "" {
			info.UpdateUser = utils.GetValueOrDefault(userMap, info.UpdateUser, "")
		}
		if info.ReleaseUser != "" {
			info.ReleaseUser = utils.GetValueOrDefault(userMap, info.ReleaseUser, "")
		}
	}
	return
}

func (s *ToolServiceImpl) getToolBoxAllToolInfo(ctx context.Context, boxDB *model.ToolboxDB) (tools []*interfaces.ToolInfo, err error) {
	tools = []*interfaces.ToolInfo{}
	toolList, err := s.ToolDB.SelectToolByBoxID(ctx, boxDB.BoxID)
	if err != nil {
		s.Logger.WithContext(ctx).Errorf("select tool list error: %v", err)
		err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "select tool list error")
		return
	}
	tools, _, toolIDSourceMap, metadataIDs, err := s.batchGetToolInfo(ctx, toolList)
	if err != nil {
		return
	}
	// 收集元数据信息
	metadataMap, err := s.batchGetMetadata(ctx, metadataIDs)
	if err != nil {
		return
	}
	for _, tool := range tools {
		metadataDB, ok := metadataMap[toolIDSourceMap[tool.ToolID]]
		if !ok {
			s.Logger.WithContext(ctx).Errorf("metadata not found, toolID: %s", tool.ToolID)
			err = errors.DefaultHTTPError(ctx, http.StatusInternalServerError, "metadata not found")
			return
		}
		metadataDB.ServerURL = boxDB.ServerURL
		tool.Metadata = metadataDB
	}
	return
}

// QueryMarketToolBoxList 获取市场工具列表
func (s *ToolServiceImpl) QueryMarketToolBoxList(ctx context.Context, req *interfaces.QueryMarketToolBoxListReq) (
	resp *interfaces.QueryToolBoxListResp, err error) {
	// 记录可观测
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	// 构造查询条件
	filter := make(map[string]interface{})
	filter["all"] = req.All
	if req.BoxName != "" {
		filter["name"] = req.BoxName
	}
	if req.BoxCategory != "" {
		// 检查分类是否合法
		if !s.CategoryManager.CheckCategory(req.BoxCategory) {
			err = errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtToolBoxCategoryTypeInvalid,
				fmt.Sprintf(" %s category not found", req.BoxCategory))
			return
		}
		filter["category"] = req.BoxCategory
	}
	if req.CreateUser != "" {
		filter["create_user"] = req.CreateUser
	}
	if req.ReleaseUser != "" {
		filter["release_user"] = req.ReleaseUser
	}
	filter["status"] = interfaces.BizStatusPublished
	operations := interfaces.AuthOperationTypePublicAccess
	resp = &interfaces.QueryToolBoxListResp{
		Data: []*interfaces.ToolBoxInfo{},
	}
	authResp, resourceToBdMap, err := s.getToolBoxListPage(ctx, filter, req.CommonPageParams, req.UserID, operations)
	if err != nil {
		return
	}
	resp.CommonPageResult = authResp.CommonPageResult
	toolBoxList := authResp.Data
	if len(toolBoxList) == 0 {
		return
	}
	// 组装工具箱信息结果
	toolBoxInfoList, err := s.getToolBoxList(ctx, toolBoxList, resourceToBdMap)
	if err != nil {
		return
	}
	resp.Data = toolBoxInfoList
	return
}

func (s *ToolServiceImpl) getToolBoxListPage(ctx context.Context, filter map[string]interface{}, pageParamsReq interfaces.CommonPageParams,
	userID string, operations ...interfaces.AuthOperationType) (authResp *interfaces.QueryResponse[model.ToolboxDB], resourceToBdMap map[string]string, err error) {
	sortField := sortFieldMap[pageParamsReq.SortBy]
	sort := &ormhelper.SortParams{
		Fields: []ormhelper.SortField{
			{
				Field: sortField,
				Order: ormhelper.SortOrder(pageParamsReq.SortOrder),
			},
		},
	}
	// 构建查询执行器
	queryTotal := func(newCtx context.Context) (int64, error) {
		var count int64
		count, err = s.ToolBoxDB.CountToolBox(newCtx, filter)
		if err != nil {
			s.Logger.WithContext(newCtx).Errorf("count toolbox failed, err: %v", err)
			err = errors.DefaultHTTPError(newCtx, http.StatusInternalServerError, err.Error())
			return 0, err
		}
		return count, err
	}
	queryBatch := func(newCtx context.Context, pageSize, offset int, cursorValue *model.ToolboxDB) ([]*model.ToolboxDB, error) {
		var boxList []*model.ToolboxDB
		var cursor *ormhelper.CursorParams
		if cursorValue != nil {
			cursor = &ormhelper.CursorParams{
				Field:     sortField,
				Direction: ormhelper.SortOrder(pageParamsReq.SortOrder),
			}
			switch sortField {
			case "f_update_time":
				cursor.Value = cursorValue.UpdateTime
			case "f_create_time":
				cursor.Value = cursorValue.CreateTime
			case "f_name":
				cursor.Value = cursorValue.Name
			}
			offset = 0
		}
		filter["limit"] = pageSize
		filter["offset"] = offset
		boxList, err = s.ToolBoxDB.SelectToolBoxList(newCtx, filter, sort, cursor)
		if err != nil {
			s.Logger.WithContext(newCtx).Errorf("select toolbox list failed, err: %v",
				err)
			err = errors.DefaultHTTPError(newCtx, http.StatusInternalServerError, err.Error())
			return nil, err
		}
		return boxList, err
	}

	businessDomainStr, _ := infracommon.GetBusinessDomainFromCtx(ctx)
	businessDomainIds := strings.Split(businessDomainStr, ",")
	resourceToBdMap, err = s.BusinessDomainService.BatchResourceList(ctx, businessDomainIds, interfaces.AuthResourceTypeToolBox)
	if err != nil {
		return
	}

	queryBuilder := auth.NewQueryBuilder[model.ToolboxDB]().
		SetPage(pageParamsReq.Page, pageParamsReq.PageSize).
		SetAll(pageParamsReq.All).SetQueryFunctions(queryTotal, queryBatch).
		SetFilteredQueryFunctions(func(newCtx context.Context, ids []string) (int64, error) {
			filter["in"] = ids
			return queryTotal(newCtx)
		}, func(newCtx context.Context, pageSize, offset int, ids []string, cursorValue *model.ToolboxDB) ([]*model.ToolboxDB, error) {
			filter["in"] = ids
			return queryBatch(newCtx, pageSize, offset, cursorValue)
		}).
		SetBusinessDomainFilter(func(newCtx context.Context) ([]string, error) {
			resourceIDs := make([]string, 0, len(resourceToBdMap))
			for resourceID := range resourceToBdMap {
				resourceIDs = append(resourceIDs, resourceID)
			}
			return resourceIDs, nil
		})
	// 判断是否是外部接口
	if infracommon.IsPublicAPIFromCtx(ctx) {
		queryBuilder.SetAuthFilter(func(newCtx context.Context) ([]string, error) {
			var accessor *interfaces.AuthAccessor
			accessor, err = s.AuthService.GetAccessor(newCtx, userID)
			if err != nil {
				return nil, err
			}
			return s.AuthService.ResourceListIDs(newCtx, accessor, interfaces.AuthResourceTypeToolBox, operations...)
		})
	}
	authResp, err = queryBuilder.Execute(ctx)
	return
}
