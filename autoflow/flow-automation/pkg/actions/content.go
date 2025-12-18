package actions

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	store "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/store"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
	"github.com/google/uuid"
)

type ContentAbstract struct {
	DocID   string `json:"docid"`
	Version string `json:"version"`
}

func (a *ContentAbstract) Name() string {
	return common.OpContentAbstract
}

func (a *ContentAbstract) ParameterNew() interface{} {
	return &ContentAbstract{}
}

func (a *ContentAbstract) Run(ctx entity.ExecuteContext, input interface{}, _ *entity.Token) (interface{}, error) {
	var err error
	var result map[string]interface{}
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	ctx.Trace(newCtx, "run start", entity.TraceOpPersistAfterAction)

	params := input.(*ContentAbstract)

	asdoc := ctx.NewASDoc()
	res, err := asdoc.DocSetSubdocAbstract(newCtx, params.DocID, params.Version)

	if err != nil {
		ctx.Trace(newCtx, fmt.Sprintf("DocSetSubdocAbstract error: %v", err))
		result = map[string]interface{}{
			"doc_id":  params.DocID,
			"version": params.Version,
			"status":  "error",
			"url":     "",
			"data":    "",
			"err_msg": err.Error(),
		}
	} else {
		result = map[string]interface{}{
			"doc_id":  res.DocID,
			"version": res.Version,
			"status":  res.Status,
			"url":     res.Url,
			"data":    res.Data,
			"err_msg": "",
		}
	}

	taskID := ctx.GetTaskID()
	ctx.ShareData().Set(taskID, result)
	ctx.Trace(newCtx, "run end")
	return result, nil
}

type ContentFullText struct {
	DocID   string `json:"docid"`
	Version string `json:"version"`
}

func (a *ContentFullText) Name() string {
	return common.OpContentFullText
}

func (a *ContentFullText) ParameterNew() interface{} {
	return &ContentFullText{}
}

func (a *ContentFullText) Run(ctx entity.ExecuteContext, input interface{}, _ *entity.Token) (interface{}, error) {
	var err error
	var result map[string]interface{}
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)

	params := input.(*ContentFullText)

	asdoc := ctx.NewASDoc()
	res, err := asdoc.DocSetSubdocFulltext(newCtx, params.DocID, params.Version)

	if err != nil {
		ctx.Trace(newCtx, fmt.Sprintf("DocSetSubdocFulltext error: %v", err))
		result = map[string]interface{}{
			"doc_id":  params.DocID,
			"version": params.Version,
			"status":  "error",
			"url":     "",
			"err_msg": err.Error(),
		}
	} else {
		result = map[string]interface{}{
			"doc_id":  res.DocID,
			"version": res.Version,
			"status":  res.Status,
			"url":     res.Url,
			"err_msg": res.ErrMsg,
		}
	}

	taskID := ctx.GetTaskID()
	ctx.ShareData().Set(taskID, result)
	ctx.Trace(newCtx, "run end")
	return result, nil
}

type EntityTemp struct {
	Name  string   `json:"name" yaml:"name"`
	Attrs []string `json:"attrs" yaml:"attrs"`
}

// RelationTemp 图谱关系模板
type RelationTemp struct {
	Start string   `json:"start" yaml:"start"`
	End   string   `json:"end" yaml:"end"`
	Name  string   `json:"name" yaml:"name"`
	Attrs []string `json:"attrs"  yaml:"attrs"`
}

type ContentEntity struct {
	DocID     string   `json:"docid"`
	Version   string   `json:"version"`
	GraphID   uint64   `json:"graph_id"`
	MinFraq   int      `json:"min_fraq"`
	Priority  int      `json:"priority"`
	EntityIds []string `json:"entity_ids"`
	EdgeIds   []string `json:"edge_ids"`
}

type Relationship struct {
	Start RelationStart `json:"start"`
	End   RelationEnd   `json:"end"`
	Name  string        `json:"name,omitempty"`
}

type RelationStart struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type RelationEnd struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

func (a *ContentEntity) Name() string {
	return common.OpContentEntity
}

func (a *ContentEntity) ParameterNew() interface{} {
	return &ContentEntity{}
}

func (a *ContentEntity) Run(ctx entity.ExecuteContext, input interface{}, token *entity.Token) (interface{}, error) {
	var err error
	var result map[string]interface{}
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.Trace(newCtx, "run start", entity.TraceOpPersistAfterAction)

	taskIns := ctx.GetTaskInstance()
	taskID := ctx.GetTaskID()

	params := input.(*ContentEntity)
	asdoc := ctx.NewASDoc()

	docID := params.DocID

	if len(docID) >= 32 {
		docID = docID[len(docID)-32:]
	}

	statusKey := fmt.Sprintf("__status_%s", taskIns.ID)
	ad := drivenadapters.NewAnyData()
	graphInfo, err := ad.GetGraphInfo(newCtx, params.GraphID, token.Token)

	if err != nil {
		result = map[string]interface{}{
			"doc_id":  params.DocID,
			"rev":     params.Version,
			"status":  "error",
			"err_msg": err.Error(),
			"data":    "{}",
			"url":     "",
		}
		ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
		ctx.ShareData().Set(taskID, result)
		ctx.Trace(newCtx, fmt.Sprintf("run error: %v", err))
		return result, nil
	}

	entityIdMap := make(map[string]interface{})
	for _, id := range params.EntityIds {
		entityIdMap[id] = true
	}

	edgeIdMap := make(map[string]interface{})
	for _, id := range params.EdgeIds {
		edgeIdMap[id] = true
	}

	entities := make([]*EntityTemp, 0)
	relationships := make([]*RelationTemp, 0)

	for _, entity := range graphInfo.Entity {
		if _, ok := entityIdMap[entity.EntityID]; ok {
			attrs := make([]string, 0)
			for _, property := range entity.Properties {
				attrs = append(attrs, property.Name)
			}
			entities = append(entities, &EntityTemp{
				Name:  entity.Name,
				Attrs: attrs,
			})
		}
	}

	for _, edge := range graphInfo.Edge {
		if _, ok := edgeIdMap[edge.EdgeID]; ok {

			if len(edge.Relation) != 3 {
				continue
			}

			start := edge.Relation[0]
			end := edge.Relation[2]
			name := strings.TrimPrefix(edge.Relation[1], start+"_2_"+end+"_")

			if start == "document" {
				start = "$this"
			}

			if end == "document" {
				end = "$this"
			}

			attrs := make([]string, 0)
			for _, property := range edge.Properties {
				attrs = append(attrs, property.Name)
			}
			relationships = append(relationships, &RelationTemp{
				Name:  name,
				Start: start,
				End:   end,
				Attrs: attrs,
			})
		}
	}

	var res drivenadapters.DocSetSubdocRes

	subdocParams := drivenadapters.DocSetSubdocParams{
		DocID:    docID,
		Version:  params.Version,
		Type:     "graph_info",
		Format:   drivenadapters.DocSetSubdocFormatRaw,
		Priority: 1,
		Custom: map[string]interface{}{
			"graph_id":      params.GraphID,
			"doc_id":        docID,
			"version":       params.Version,
			"min_freq":      3,
			"entities":      entities,
			"relationships": relationships,
			"priority":      1,
		},
	}

	res, err = asdoc.DocSetSubdoc(newCtx, subdocParams, -1)

	if err != nil {
		ctx.Trace(newCtx, fmt.Sprintf("run error: %v", err))
		ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
		result = map[string]interface{}{
			"doc_id":  params.DocID,
			"rev":     params.Version,
			"status":  "error",
			"err_msg": err.Error(),
			"data":    "{}",
			"url":     "",
		}
	} else {

		data := res.Data

		if data == nil || data == "" {
			data = "{}"
		}

		result = map[string]interface{}{
			"doc_id":  res.DocID,
			"rev":     res.Rev,
			"status":  res.Status,
			"err_msg": res.ErrMsg,
			"data":    data,
			"url":     res.Url,
		}

		relationshipMap, dok := data.(map[string]interface{})
		if dok {
			relations := []*Relationship{}
			resultMap := make(map[string]interface{}, 0)

			relationsBytes, _ := json.Marshal(relationshipMap["relationships"])
			_ = json.Unmarshal(relationsBytes, &relations)

			for _, val := range relations {
				if v, ok := resultMap[val.End.Name]; ok {
					vMap := v.(map[string]interface{})
					switch vv := vMap["_vid"].(type) {
					case []interface{}:
						vv = append(vv, val.End.ID)
						vMap["_vid"] = vv
					case string:
						vInterface := []interface{}{vv, val.End.ID}
						vMap["_vid"] = vInterface
					default:
						continue
					}
					resultMap[val.End.Name] = vMap
				} else {
					resultMap[val.End.Name] = map[string]interface{}{"_vid": val.End.ID}
				}
			}
			result["relation_map"] = resultMap
		}

		if res.Status == "processing" {
			taskBlockKey := fmt.Sprintf("%s%s", entity.ContentEntityKeyPrefix, docID)

			redis := store.NewRedis()
			client := redis.GetClient()
			err = client.HSet(ctx.Context(), taskBlockKey, taskIns.ID, "").Err()
			bytes, _ := json.Marshal(subdocParams)
			result["__subdocParams"] = string(bytes)
			if err != nil {
				ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
			} else {
				_ = client.Expire(ctx.Context(), taskBlockKey, time.Hour*24).Err()
				ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusBlocked)
			}
		} else {
			ctx.ShareData().Set(statusKey, entity.TaskInstanceStatusSuccess)
		}
	}
	ctx.ShareData().Set(taskID, result)
	ctx.Trace(newCtx, "run end")

	return result, nil
}

func (a *ContentEntity) RunAfter(ctx entity.ExecuteContext, _ interface{}) (entity.TaskInstanceStatus, error) {
	taskIns := ctx.GetTaskInstance()
	statusKey := fmt.Sprintf("__status_%s", taskIns.ID)
	status, ok := ctx.ShareData().Get(statusKey)
	if ok && status == entity.TaskInstanceStatusBlocked {
		return entity.TaskInstanceStatusBlocked, nil
	}

	return entity.TaskInstanceStatusSuccess, nil
}

type SliceVector string

const (
	SliceVectorNone  = "none"
	SliceVectorSlice = "slice"
	SliceVectorBoth  = "slice_vector"
)

type ContentFileParse struct {
	SourceType  SourceType  `json:"source_type"`
	DocID       string      `json:"docid"`
	Version     string      `json:"version"`
	Filename    string      `json:"filename"`
	Url         string      `json:"url"`
	SliceVector SliceVector `json:"slice_vector"`
	Model       string      `json:"model"`
}

func (a *ContentFileParse) Name() string {
	return common.OpContentFileParse
}

func (a *ContentFileParse) ParameterNew() interface{} {
	return &ContentFileParse{}
}

func (a *ContentFileParse) Validate(ctx context.Context) error {
	switch a.SourceType {
	case SourceTypeUrl:
		if a.Filename == "" {
			return fmt.Errorf("filename is required")
		}
		return nil
	default:
		if a.DocID == "" {
			return fmt.Errorf("docid is required")
		}

		efast := drivenadapters.NewEfast()
		downloadInfo, err := efast.InnerOSDownload(ctx, a.DocID, a.Version)

		if err != nil {
			return err
		}

		a.Url = downloadInfo.URL
		a.Filename = downloadInfo.Name

		return nil
	}
}

func (a *ContentFileParse) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	ctx.Trace(newCtx, "run start", entity.TraceOpPersistAfterAction)
	log := traceLog.WithContext(ctx.Context())

	input := params.(*ContentFileParse)

	err = input.Validate(ctx.Context())

	if err != nil {
		log.Warnf("[ContentFileParse] validate err: %s")
		return nil, err
	}

	structureExtractor := drivenadapters.NewStructureExtractor()
	result := make(map[string]any)

	parseResult, contentList, err := structureExtractor.FileParse(ctx.Context(), input.Url, input.Filename)

	if err != nil {
		log.Warnf("[ContentFileParse] FileParse err: %s, url %s, docid %s", input.Url, input.DocID)
		return nil, err
	}

	if parseResult != nil {

		contentSlice := make([]any, 0)
		chunks := make([]any, 0)

		if len(contentList) > 0 {
			bytes, _ := json.Marshal(contentList)
			_ = json.Unmarshal(bytes, &contentSlice)

			if input.SliceVector == SliceVectorSlice || input.SliceVector == SliceVectorBoth {
				customChunks := processCustomChunk(ctx.Context(), input.Filename, contentList, "", input.SliceVector == SliceVectorBoth, input.Model, token.Token)

				bytes, _ := json.Marshal(customChunks)
				_ = json.Unmarshal(bytes, &chunks)
			}
		}

		result["md_content"] = parseResult.MdContent
		result["content_list"] = contentSlice
		result["chunks"] = chunks
	}

	ctx.ShareData().Set(ctx.GetTaskID(), result)

	return result, nil
}

// CustomChunk 返回的块结构
type CustomChunk struct {
	DocName        string    `json:"doc_name"`
	DocMD5         string    `json:"doc_md5"`
	SliceMD5       string    `json:"slice_md5"`
	ID             string    `json:"id"`
	SliceType      int       `json:"slice_type"`
	Pages          []int     `json:"pages"`
	SegmentID      int       `json:"segment_id"`
	Location       [][4]int  `json:"location"`
	SuperiorID     *string   `json:"superior_id"`
	SubordinateIDs []string  `json:"subordinate_ids"`
	SliceContent   string    `json:"slice_content"`
	Embedding      []float64 `json:"embedding"`
}

// ProcessingItem 处理过程中的中间结构
type ProcessingItem struct {
	Type          string
	PageIdx       interface{} // 可以是 int 或 []int
	Bbox          interface{} // 可以是 [4]int 或 [][4]int
	Text          string
	TextLevel     *int
	ImgPath       string
	ImageCaption  []string
	ImageFootnote []string
	TextFormat    string
	TableCaption  []string
	TableFootnote []string
	TableBody     string
	SubType       string
	CodeCaption   []string
	CodeBody      string
	GuessLang     string
	ListItems     []string

	OriginalIndex         int
	MergedOriginalIndices []int // 用于跟踪合并的原始索引
}

// generateMD5 生成文本的 MD5 哈希
func generateMD5(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

// determineSliceType 根据项目类型确定切片类型
func determineSliceType(item *ProcessingItem) int {
	// 优先处理文本级别为标题的情况
	if item.TextLevel != nil && *item.TextLevel == 1 {
		return 0 // 标题标识符
	}

	// 根据类型字段确定
	typeMap := map[string]int{
		"text":     1, // 文本标识符
		"table":    2, // 表格标识符
		"image":    3, // 图片标识符
		"equation": 4, // 其他内容标识符
	}

	// 如果类型缺失但有文本，默认为文本
	if item.Type == "" && item.Text != "" {
		return 1
	}

	// 使用映射，默认为4（其他）
	if sliceType, exists := typeMap[item.Type]; exists {
		return sliceType
	}
	return 4
}

// convertToProcessingItems 将 ContentItem 转换为 ProcessingItem
func convertToProcessingItems(contentList []*drivenadapters.ContentItem) []*ProcessingItem {
	processed := make([]*ProcessingItem, len(contentList))
	for i, item := range contentList {
		processed[i] = &ProcessingItem{
			Type:          item.Type,
			PageIdx:       item.PageIdx,
			Bbox:          item.Bbox,
			Text:          item.Text,
			TextLevel:     item.TextLevel,
			ImgPath:       item.ImgPath,
			ImageCaption:  item.ImageCaption,
			ImageFootnote: item.ImageFootnote,
			TextFormat:    item.TextFormat,
			TableCaption:  item.TableCaption,
			TableFootnote: item.TableFootnote,
			TableBody:     item.TableBody,
			SubType:       item.SubType,
			CodeCaption:   item.CodeCaption,
			CodeBody:      item.CodeBody,
			GuessLang:     item.GuessLang,
			ListItems:     item.ListItems,
			OriginalIndex: i,
		}
	}
	return processed
}

// ensureBasicFields 确保基本字段存在并分配原始索引
func ensureBasicFields(processedList []*ProcessingItem) {
	for i, item := range processedList {
		item.OriginalIndex = i

		// 确保文本字段存在
		if item.Text == "" {
			item.Text = ""
		}

		// 推断类型
		if item.Type == "" {
			if item.ImgPath != "" && item.TableBody == "" {
				item.Type = "image"
			} else if item.TableBody != "" {
				item.Type = "table"
			} else if item.TextFormat == "latex" {
				item.Type = "equation"
			} else {
				item.Type = "text"
			}
		}

		// 确保页面索引存在
		if item.PageIdx == nil {
			item.PageIdx = -1
		}

		// 确保边界框存在
		if item.Bbox == nil {
			item.Bbox = [][4]int{}
		}
	}
}

// preprocessItems 预处理图片和表格项目以合并文本
func preprocessItems(processedList []*ProcessingItem) {
	for _, item := range processedList {
		textParts := []string{}
		currentText := strings.TrimSpace(item.Text)
		if currentText != "" {
			textParts = append(textParts, currentText)
		}

		switch item.Type {
		case "image":
			caption := strings.Join(item.ImageCaption, "\n")
			footnote := strings.Join(item.ImageFootnote, "\n")
			if caption != "" {
				textParts = append(textParts, caption)
			}
			if footnote != "" {
				textParts = append(textParts, footnote)
			}
		case "table":
			caption := strings.Join(item.TableCaption, "\n")
			body := strings.TrimSpace(item.TableBody)
			footnote := strings.Join(item.TableFootnote, "\n")
			if caption != "" {
				textParts = append(textParts, caption)
			}
			if body != "" {
				textParts = append(textParts, body)
			}
			if footnote != "" {
				textParts = append(textParts, footnote)
			}
		}

		// 去重
		uniqueParts := []string{}
		seen := make(map[string]bool)
		for _, part := range textParts {
			strippedPart := strings.TrimSpace(part)
			if strippedPart != "" && !seen[strippedPart] {
				uniqueParts = append(uniqueParts, strippedPart)
				seen[strippedPart] = true
			}
		}
		item.Text = strings.Join(uniqueParts, "\n")
	}
}

// identifySplitPoints 识别分割点
func identifySplitPoints(processedList []*ProcessingItem) (map[int]bool, []int) {
	splitIndices := make(map[int]bool)
	var level1HeadingIndices []int

	if len(processedList) > 0 {
		splitIndices[0] = true // 文档开始
	}

	// 页面断点分割
	lastProcessedPage := -2
	for i, item := range processedList {
		var pageIdx int
		switch p := item.PageIdx.(type) {
		case int:
			pageIdx = p
		case []int:
			if len(p) > 0 {
				pageIdx = p[0]
			} else {
				pageIdx = -1
			}
		default:
			pageIdx = -1
		}

		if pageIdx != -1 && pageIdx != lastProcessedPage && i > 0 {
			splitIndices[i] = true
		}
		if pageIdx != -1 {
			lastProcessedPage = pageIdx
		}

		// 一级标题分割点
		if item.TextLevel != nil && *item.TextLevel == 1 {
			splitIndices[i] = true
			level1HeadingIndices = append(level1HeadingIndices, i)
		}
	}

	return splitIndices, level1HeadingIndices
}

// mergeAdjacentHeadings 合并相邻的一级标题
func mergeAdjacentHeadings(processedList []*ProcessingItem, level1HeadingIndices []int, splitIndices map[int]bool) (map[int]bool, map[int]*ProcessingItem) {
	mergedIndicesToRemove := make(map[int]bool)
	mergedHeadingMap := make(map[int]*ProcessingItem)

	if len(level1HeadingIndices) == 0 {
		return mergedIndicesToRemove, mergedHeadingMap
	}

	sort.Ints(level1HeadingIndices)
	currentMergeGroup := []int{}
	lastHeadingIdx := -2

	processMergeGroup := func(group []int) {
		if len(group) == 0 {
			return
		}

		if len(group) > 1 {
			firstIdx := group[0]
			mergedItem := &ProcessingItem{
				Type:      "text",
				TextLevel: intPtr(1),
			}

			mergedTexts := []string{}
			mergedPagesSet := make(map[int]bool)
			mergedBboxes := [][4]int{}
			originalIndices := []int{}

			for _, idx := range group {
				item := processedList[idx]
				originalIndices = append(originalIndices, item.OriginalIndex)

				textToAppend := strings.TrimSpace(item.Text)
				if textToAppend != "" {
					mergedTexts = append(mergedTexts, textToAppend)
				}

				// 处理页面
				switch p := item.PageIdx.(type) {
				case int:
					if p != -1 {
						mergedPagesSet[p] = true
					}
				case []int:
					for _, page := range p {
						if page != -1 {
							mergedPagesSet[page] = true
						}
					}
				}

				// 处理边界框
				switch b := item.Bbox.(type) {
				case [4]int:
					mergedBboxes = append(mergedBboxes, b)
				case [][4]int:
					mergedBboxes = append(mergedBboxes, b...)
				}

				if idx != firstIdx {
					mergedIndicesToRemove[idx] = true
				}
			}

			mergedItem.Text = strings.Join(mergedTexts, "\n")

			// 转换页面集合为排序后的切片
			mergedPages := make([]int, 0, len(mergedPagesSet))
			for page := range mergedPagesSet {
				mergedPages = append(mergedPages, page)
			}
			sort.Ints(mergedPages)
			mergedItem.PageIdx = mergedPages

			mergedItem.Bbox = mergedBboxes
			mergedItem.OriginalIndex = originalIndices[0]
			mergedItem.MergedOriginalIndices = originalIndices

			mergedHeadingMap[firstIdx] = mergedItem

			// 移除冗余分割点
			for _, idx := range group[1:] {
				delete(splitIndices, idx)
			}
		} else if len(group) == 1 {
			// 确保单个标题的格式一致性
			idx := group[0]
			item := processedList[idx]

			// 确保页面索引是切片格式
			switch p := item.PageIdx.(type) {
			case int:
				if p != -1 {
					item.PageIdx = []int{p}
				} else {
					item.PageIdx = []int{}
				}
			case []int:
				// 已经是切片，不需要处理
			default:
				item.PageIdx = []int{}
			}

			// 确保边界框是切片格式
			switch b := item.Bbox.(type) {
			case [4]int:
				item.Bbox = [][4]int{b}
			case [][4]int:
				// 已经是切片，不需要处理
			default:
				item.Bbox = [][4]int{}
			}
		}
	}

	for _, idx := range level1HeadingIndices {
		isAdjacent := (idx == lastHeadingIdx+1)
		if isAdjacent {
			currentMergeGroup = append(currentMergeGroup, idx)
		} else {
			processMergeGroup(currentMergeGroup)
			currentMergeGroup = []int{idx}
		}
		lastHeadingIdx = idx
	}
	processMergeGroup(currentMergeGroup)

	return mergedIndicesToRemove, mergedHeadingMap
}

// createChunks 创建自定义块
func createChunks(processedList []*ProcessingItem, splitIndices map[int]bool, mergedIndicesToRemove map[int]bool, mergedHeadingMap map[int]*ProcessingItem, docName, docMD5 string) []*CustomChunk {
	// 获取最终分割点
	finalSplitPoints := make([]int, 0, len(splitIndices))
	for idx := range splitIndices {
		if idx < len(processedList) {
			finalSplitPoints = append(finalSplitPoints, idx)
		}
	}
	sort.Ints(finalSplitPoints)
	customChunks := []*CustomChunk{}

	for i, startIndex := range finalSplitPoints {
		endIndex := len(processedList)
		if i+1 < len(finalSplitPoints) {
			endIndex = finalSplitPoints[i+1]
		}

		chunkContentParts := []string{}
		chunkPagesSet := make(map[int]bool)
		chunkLocations := [][4]int{}
		var firstItemForChunkMetadata *ProcessingItem
		firstItemSegmentID := -1

		currentIndex := startIndex
		for currentIndex < endIndex {
			if mergedIndicesToRemove[currentIndex] {
				currentIndex++
				continue
			}

			var itemToProcess *ProcessingItem
			if currentIndex == startIndex {
				if mergedItem, exists := mergedHeadingMap[startIndex]; exists {
					itemToProcess = mergedItem
				} else {
					itemToProcess = processedList[currentIndex]
				}
			} else {
				itemToProcess = processedList[currentIndex]
			}

			// 确保格式一致性
			ensureConsistentFormat(itemToProcess)

			if firstItemForChunkMetadata == nil {
				firstItemForChunkMetadata = itemToProcess
				firstItemSegmentID = itemToProcess.OriginalIndex
			}

			text := strings.TrimSpace(itemToProcess.Text)
			if text != "" {
				chunkContentParts = append(chunkContentParts, text)
			}

			// 处理页面
			switch p := itemToProcess.PageIdx.(type) {
			case []int:
				for _, page := range p {
					if page != -1 {
						chunkPagesSet[page] = true
					}
				}
			case int:
				if p != -1 {
					chunkPagesSet[p] = true
				}
			}

			// 处理位置
			switch b := itemToProcess.Bbox.(type) {
			case [][4]int:
				chunkLocations = append(chunkLocations, b...)
			case [4]int:
				chunkLocations = append(chunkLocations, b)
			}

			currentIndex++
		}

		if firstItemForChunkMetadata != nil {
			sliceContent := strings.Join(chunkContentParts, "\n")

			chunkID := uuid.New().String()
			sliceMD5 := generateMD5(sliceContent)
			sliceType := determineSliceType(firstItemForChunkMetadata)

			// 转换页面集合为排序后的切片
			finalPages := make([]int, 0, len(chunkPagesSet))
			for page := range chunkPagesSet {
				finalPages = append(finalPages, page)
			}
			sort.Ints(finalPages)

			customChunk := &CustomChunk{
				DocName:        docName,
				SliceMD5:       sliceMD5,
				ID:             chunkID,
				SliceType:      sliceType,
				Pages:          finalPages,
				SegmentID:      firstItemSegmentID,
				Location:       chunkLocations,
				SuperiorID:     nil,
				SubordinateIDs: nil,
				SliceContent:   sliceContent,
			}
			customChunks = append(customChunks, customChunk)
		}
	}

	// 链接块并添加文档MD5
	numChunks := len(customChunks)
	for i, chunk := range customChunks {
		chunk.DocMD5 = docMD5

		// 链接上级
		if i > 0 {
			superiorID := customChunks[i-1].ID
			chunk.SuperiorID = &superiorID
		}

		// 链接下级
		if i < numChunks-1 {
			chunk.SubordinateIDs = []string{customChunks[i+1].ID}
		}
	}

	return customChunks
}

// ensureConsistentFormat 确保处理项格式一致性
func ensureConsistentFormat(item *ProcessingItem) {
	// 确保页面索引是切片格式
	switch p := item.PageIdx.(type) {
	case int:
		if p != -1 {
			item.PageIdx = []int{p}
		} else {
			item.PageIdx = []int{}
		}
	case []int:
		// 已经是切片，不需要处理
	default:
		item.PageIdx = []int{}
	}

	// 确保边界框是切片格式
	switch b := item.Bbox.(type) {
	case [4]int:
		item.Bbox = [][4]int{b}
	case [][4]int:
		// 已经是切片，不需要处理
	default:
		item.Bbox = [][4]int{}
	}
}

// intPtr 返回整数的指针
func intPtr(i int) *int {
	return &i
}

// CustomChunk 主函数
func processCustomChunk(ctx context.Context,
	fileName string,
	contentList []*drivenadapters.ContentItem,
	docMD5 string,
	embedding bool,
	model string,
	token string) []*CustomChunk {
	if len(contentList) == 0 {
		return []*CustomChunk{}
	}

	// 步骤0: 转换为处理项并确保基本字段
	processedList := convertToProcessingItems(contentList)
	ensureBasicFields(processedList)

	// 步骤1: 预处理图片和表格项
	preprocessItems(processedList)

	// 步骤2 & 3: 识别分割点
	splitIndices, level1HeadingIndices := identifySplitPoints(processedList)

	// 步骤4: 合并相邻的一级标题
	mergedIndicesToRemove, mergedHeadingMap := mergeAdjacentHeadings(processedList, level1HeadingIndices, splitIndices)

	// 步骤5: 创建自定义块
	customChunks := createChunks(processedList, splitIndices, mergedIndicesToRemove, mergedHeadingMap, fileName, docMD5)

	if embedding && model != "" {
		ad := drivenadapters.NewAnyData()

		input := []string{}

		for _, chunk := range customChunks {
			input = append(input, chunk.SliceContent)
		}

		res, err := ad.Embedding(ctx, model, input, token)

		if err == nil {
			for i := range len(res.Data) {
				customChunks[i].Embedding = res.Data[i].Embedding
			}
		}
	}

	return customChunks
}
