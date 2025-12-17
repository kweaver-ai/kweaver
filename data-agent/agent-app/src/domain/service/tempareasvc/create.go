package tempareasvc

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/ecoconfigaccess/ecoconfigdto"
	tempareareq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/req"
	temparearesp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/temparea/resp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	"github.com/pkg/errors"
)

func (svc *tempareaSvc) Create(ctx context.Context, req tempareareq.CreateReq) (string, temparearesp.CreateResp, error) {
	if len(req.Source) == 0 {
		return "", temparearesp.CreateResp{}, errors.New("source is required")
	}
	addSource, sourceResp, err := svc.checkSource(ctx, req, "")
	if err != nil {
		return "", temparearesp.CreateResp{}, errors.Wrap(err, "check source failed")
	}
	tempAreaID := cutil.UlidMake()
	poList := make([]*dapo.TempAreaPO, 0)
	createTime := cutil.GetCurrentMSTimestamp() / 1000
	for _, source := range addSource {
		poList = append(poList, &dapo.TempAreaPO{
			ID:         tempAreaID,
			SourceID:   source.ID,
			SourceType: source.Type,
			UserID:     req.UserID,
			CreateAt:   createTime,
		})
	}
	err = svc.tempAreaRepo.Create(ctx, poList)
	if err != nil {
		return "", temparearesp.CreateResp{}, errors.Wrap(err, "create temp area failed")
	}
	createResp := temparearesp.CreateResp{
		ID:      tempAreaID,
		Sources: sourceResp,
	}
	return tempAreaID, createResp, nil
}

func (svc *tempareaSvc) checkSource(ctx context.Context, req tempareareq.CreateReq, tempAreaID string) ([]tempareareq.TempArea,
	[]temparearesp.SourceResp, error) {
	var err error
	var addSource []tempareareq.TempArea
	var resp []temparearesp.SourceResp
	agent, err := svc.agentFactory.GetAgent(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		return addSource, resp, errors.Wrap(err, "get agent failed")
	}

	maxSize, maxSizeUnit, types, maxFileCounts :=
		agent.Config.Input.TempZoneConfig.SingleFileSizeLimit, agent.Config.Input.TempZoneConfig.SingleFileSizeLimitUnit, agent.Config.Input.TempZoneConfig.AllowedFileTypes, agent.Config.Input.TempZoneConfig.MaxFileCount

	// 添加单位换算函数
	sizeWithUnit := func(size int, unit string) int64 {
		switch strings.ToUpper(unit) {
		case "KB":
			return int64(size) * 1024
		case "MB":
			return int64(size) * 1024 * 1024
		case "GB":
			return int64(size) * 1024 * 1024 * 1024
		default:
			return int64(size)
		}
	}

	allSourceCount := len(req.Source)
	bindSourceIDs := make([]string, 0)
	if tempAreaID != "" {
		var poList []*dapo.TempAreaPO
		poList, err = svc.tempAreaRepo.GetByTempAreaID(ctx, tempAreaID)
		if err != nil {
			err = errors.Wrap(err, "get temp area failed")
			return addSource, resp, err
		}
		allSourceCount += len(poList)

		for _, sourceInfo := range poList {
			bindSourceIDs = append(bindSourceIDs, sourceInfo.SourceID)
		}
	}

	// 使用 map 来提高查询效率
	sourceIDMap := make(map[string]struct{})
	for _, sourceInfo := range bindSourceIDs {
		sourceIDMap[sourceInfo] = struct{}{}
	}

	if allSourceCount > *maxFileCounts {
		err = errors.New("upload files over max count")
		return addSource, resp, err
	}

	// 计算包含单位的最大大小
	maxSizeInBytes := sizeWithUnit(maxSize, string(maxSizeUnit))
	docIDs := make([]string, 0)
	sourceMap := make(map[string]*temparearesp.SourceResp)
	reindexDocInfo := make([]ecoconfigdto.ReindexReq, 0)
	for _, item := range req.Source {
		// 查看添加的文档是否已经在临时区
		if _, exists := sourceIDMap[item.ID]; exists {
			err = errors.New(fmt.Sprintf("the source id is already in temp area, the id is %s", item.ID))
			return addSource, resp, err
		}
		if item.Type == "doc" {
			docIDs = append(docIDs, item.ID)
			reindexDocInfo = append(reindexDocInfo, ecoconfigdto.ReindexReq{DocID: item.ID, PartType: "slice_vector"})
		}
	}

	// 创建向量索引
	go func(reindexDocInforequest []ecoconfigdto.ReindexReq) {
		ctx := context.Background()
		svc.EcoConfig.DocReindex(ctx, reindexDocInfo)
	}(reindexDocInfo)

	// 文档去重处理
	docMap, err := svc.Efast.GetObjectFieldByID(ctx, docIDs, "names", "sizes", "status")
	if err != nil {
		err = errors.Wrap(err, "[checkSource] failed: GetObjectFieldByID error")
		return addSource, resp, err
	}
	existIDs := make([]string, 0)
	for k, v := range docMap {
		if v.Status == "recycle_bin" {
			continue
		}
		existIDs = append(existIDs, k)
		sourceMap[k] = &temparearesp.SourceResp{
			ID: k,
		}
		if v.Size > maxSizeInBytes {
			sourceMap[k].Details = temparearesp.Details{
				Status:  "failed",
				Message: "Error.TempArea.SourceSizeLimit",
			}
			resp = append(resp, *sourceMap[k])
			continue
		}

		// 获取文件扩展名
		ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(v.Name)), ".")
		if !Contains(types, ext) {
			sourceMap[k].Details = temparearesp.Details{
				Status:  "failed",
				Message: "Error.TempArea.SourceTypeLimit",
			}
			resp = append(resp, *sourceMap[k])
			continue
		}
		addSource = append(addSource, tempareareq.TempArea{
			ID:   k,
			Type: "doc",
		})
		sourceMap[k].Details = temparearesp.Details{
			Status:  "success",
			Message: "",
		}
		resp = append(resp, *sourceMap[k])
	}

	notExistIDs := DiffSlice(docIDs, existIDs)
	for _, id := range notExistIDs {
		sourceMap[id] = &temparearesp.SourceResp{
			ID: id,
			Details: temparearesp.Details{
				Status:  "failed",
				Message: "Error.TempArea.SourceFileNotFound",
			},
		}
		resp = append(resp, *sourceMap[id])
	}
	return addSource, resp, err
}

// Contains 检查切片中是否包含指定元素
func Contains[T comparable](slice []T, element T) bool {
	for _, v := range slice {
		if v == element {
			return true
		}
	}
	return false
}

func getSliceMap[T comparable](slice []T) (m map[T]struct{}) {
	m = make(map[T]struct{})
	for _, item := range slice {
		m[item] = struct{}{}
	}
	return
}

// 两个slice的差集
func DiffSlice[T comparable](slice1, slice2 []T) (diff []T) {
	m1 := getSliceMap(slice1)
	m2 := getSliceMap(slice2)
	diff = []T{}
	for item := range m1 {
		if _, ok := m2[item]; !ok {
			diff = append(diff, item)
		}
	}
	return
}
