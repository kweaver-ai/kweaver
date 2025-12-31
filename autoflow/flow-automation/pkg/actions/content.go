package actions

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/utils/extractor"
	store "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/store"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
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

		// 先计算 docMD5（用于生成去重标识）
		docMD5 := extractor.GenerateMD5(parseResult.MdContent)

		// 将 contentList 转换为 Element 格式的 content_list
		var elements []*extractor.Element
		if len(contentList) > 0 {
			documentID := input.DocID
			if documentID == "" {
				// 如果 DocID 为空，使用文件名生成一个临时 ID
				documentID = fmt.Sprintf("doc_%s", strings.ReplaceAll(input.Filename, ".", "_"))
			}
			// 获取文档名称（去掉后缀）
			docName := input.Filename
			if docName == "" {
				docName = documentID
			}
			elements = extractor.ConvertContentItemsToElements(ctx.Context(), contentList, documentID, docName, docMD5)
			// 将 Element 数组序列化为 JSON
			bytes, err := json.Marshal(elements)
			if err != nil {
				log.Warnf("[ContentFileParse] Marshal elements err: %v", err)
				// 如果序列化失败，回退到原始 contentList
				bytes, _ := json.Marshal(contentList)
				_ = json.Unmarshal(bytes, &contentSlice)
			} else {
				_ = json.Unmarshal(bytes, &contentSlice)
			}
		}

		// 处理 chunks - 直接使用 contentList
		// 注意：Chunk 的父子关系通过 SegmentID 关联到 Element 层获取
		if input.SliceVector == SliceVectorSlice || input.SliceVector == SliceVectorBoth {
			if len(contentList) > 0 {
				// 传入 elements 列表以建立 Chunk 与 Element 的关联关系
				customChunks := extractor.ProcessCustomChunk(ctx.Context(), input.Filename, contentList, docMD5, input.SliceVector == SliceVectorBoth, input.Model, token.Token, elements)

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
