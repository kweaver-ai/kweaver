package actions

import (
	"encoding/json"
	"fmt"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

type OpenSearchBulkUpsert struct {
	BaseType  string                 `json:"base_type"`
	DataType  string                 `json:"data_type"`
	Category  string                 `json:"category"`
	Documents any                    `json:"documents"`
	Template  string                 `json:"template"`
	Settings  map[string]interface{} `json:"settings,omitempty"`
	Mappings  map[string]interface{} `json:"mappings,omitempty"`
}

func (b *OpenSearchBulkUpsert) Name() string {
	return common.OpOpenSearchBulkUpsert
}

func (b *OpenSearchBulkUpsert) ParameterNew() any {
	return &OpenSearchBulkUpsert{}
}

// getDefaultIndexTemplate 获取默认的索引配置模板
func getDefaultIndexTemplate() (map[string]interface{}, map[string]interface{}) {
	settings := map[string]interface{}{
		"number_of_shards":         1,
		"number_of_replicas":       0,
		"knn":                      true,
		"knn.algo_param.ef_search": 100,
		"refresh_interval":         "30s",
	}

	mappings := map[string]interface{}{
		"dynamic": false,
		"properties": map[string]interface{}{
			"doc_name": map[string]interface{}{
				"type": "text",
				"fields": map[string]interface{}{
					"keyword": map[string]interface{}{
						"type":         "keyword",
						"ignore_above": 256,
					},
				},
			},
			"doc_md5": map[string]interface{}{
				"type": "keyword",
			},
			"slice_md5": map[string]interface{}{
				"type": "keyword",
			},
			"id": map[string]interface{}{
				"type": "keyword",
			},
			"deduplication_id": map[string]interface{}{
				"type": "keyword",
			},
			"document_id": map[string]interface{}{
				"type": "keyword",
			},
			"slice_type": map[string]interface{}{
				"type": "integer",
			},
			"pages": map[string]interface{}{
				"type": "integer",
			},
			"segment_id": map[string]interface{}{
				"type": "integer",
			},
			"slice_content": map[string]interface{}{
				"type":     "text",
				"analyzer": "standard",
			},
			"text_vector": map[string]interface{}{
				"type":      "knn_vector",
				"dimension": 768,
			},
			"img_path": map[string]interface{}{
				"type":  "keyword",
				"index": false,
			},
			"image_vector": map[string]interface{}{
				"type":      "knn_vector",
				"dimension": 512,
			},
			"created_at": map[string]interface{}{
				"type": "date",
			},
			"updated_at": map[string]interface{}{
				"type": "date",
			},
		},
	}

	return settings, mappings
}

func normalizeDocuments(documents any, baseType, dataType, category string) (results []map[string]any) {
	switch v := documents.(type) {
	case string:
		var parsed any
		if err := json.Unmarshal([]byte(v), &parsed); err != nil {
			return nil
		}
		return normalizeDocuments(parsed, baseType, dataType, category)
	case map[string]any:
		v["__base_type"] = baseType
		v["__data_type"] = dataType
		v["__catetory"] = category

		writeTime := time.Now().UnixMilli()
		v["__write_time"] = writeTime
		if _, ok := v["@timestamp"]; !ok {
			v["@timestamp"] = writeTime
		}
		return []map[string]any{v}
	case []any:
		for _, item := range v {
			switch elem := item.(type) {
			case map[string]any:
				elem["__base_type"] = baseType
				elem["__data_type"] = dataType
				elem["__catetory"] = category

				writeTime := time.Now().UnixMilli()
				elem["__write_time"] = writeTime
				if _, ok := elem["@timestamp"]; !ok {
					elem["@timestamp"] = writeTime
				}
				results = append(results, elem)
			case string:
				var parsed any
				if err := json.Unmarshal([]byte(elem), &parsed); err == nil {
					if nestedResults := normalizeDocuments(parsed, baseType, dataType, category); nestedResults != nil {
						results = append(results, nestedResults...)
					}
				}
			}
		}
		return results
	default:
		return nil
	}
}

func (b *OpenSearchBulkUpsert) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	log := traceLog.WithContext(ctx.Context())
	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)

	taskIns := ctx.GetTaskInstance()
	input := params.(*OpenSearchBulkUpsert)
	openSearch := drivenadapters.NewOpenSearch()
	documents := normalizeDocuments(input.Documents, input.BaseType, input.DataType, input.Category)

	index := "mdl-" + input.BaseType

	// 确定使用的 settings 和 mappings
	settings := input.Settings
	mappings := input.Mappings

	// 如果用户没有提供 settings 和 mappings，但指定了 template，使用内置模板
	if settings == nil && mappings == nil && input.Template != "" {
		if input.Template == "default" {
			settings, mappings = getDefaultIndexTemplate()
			log.Infof("[OpenSearchBulkUpsert] taskInsID %s, using default index template", taskIns.TaskID)
		}
	}

	result := map[string]any{}
	success, failed := 0, 0
	reasons := []string{}
	batchSize := 1000
	for i := 0; i < len(documents); i += batchSize {
		end := min(i+batchSize, len(documents))
		batch := documents[i:end]
		err = openSearch.BulkUpsert(ctx.Context(), index, batch, settings, mappings)

		if err != nil {
			log.Warnf("[OpenSearchBulkUpsert] taskInsID %s, total %d, range %d-%d, err: %s", taskIns.TaskID, len(documents), i, end, err.Error())
			reasons = append(reasons, fmt.Sprintf("[%d-%d] %s", i, end, err.Error()))
			failed += len(batch)
		} else {
			success += len(batch)
		}

		for j := range batch {
			batch[j] = nil
		}
	}

	result["total"] = len(documents)
	result["success"] = success
	result["failed"] = failed

	if len(reasons) > 0 {
		result["reasons"] = reasons
	}

	ctx.ShareData().Set(ctx.GetTaskID(), result)
	return result, nil
}

var _ entity.Action = (*OpenSearchBulkUpsert)(nil)
