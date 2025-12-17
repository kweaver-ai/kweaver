package demo

import (
	"context"
	"net/http"
	"sort"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/drivenadapters/opensearch"
	myErr "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	opensearch_infra "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/opensearch"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/utils"
	"github.com/olivere/elastic/v7"
)

type documentOperatorServiceImpl struct {
	Logger        interfaces.Logger
	IDocumentDemo opensearch.IDocumentDemo
}

var (
	once sync.Once
	om   interfaces.DemoOperatorService
)

const (
	DefaultK = 20
	MaxK     = 200
)

func NewDocumentOperatorService(logger interfaces.Logger) interfaces.DemoOperatorService {
	once.Do(func() {
		om = &documentOperatorServiceImpl{
			Logger:        logger,
			IDocumentDemo: opensearch.NewDocumentDemoImpl(),
		}
	})
	return om
}

func (o *documentOperatorServiceImpl) BulkIndex(ctx context.Context, req interfaces.BulkDocumentIndexRequest) error {
	// todo:入参校验
	// 校验批量索引请求
	if err := o.validateBulkIndexRequest(ctx, req); err != nil {
		return err
	}
	// 构建批量文档索引实体
	docs := make([]*interfaces.DocumentEngity, 0)
	for _, item := range req {
		docs = append(docs, o.createDocumentEngity(&item)...)
	}
	// 批量索引
	if err := o.IDocumentDemo.BulkIndex(ctx, docs); err != nil {
		return err
	}
	return nil
}

func (o *documentOperatorServiceImpl) Search(ctx context.Context, req interfaces.DocumentSearchRequest) (interfaces.DocumentSearchResponse, error) {
	var err error
	// 1. 入参校验
	if err = o.validateSearchRequest(ctx, req); err != nil {
		return nil, err
	}
	// 2. 并发调用searchQuery和searchQueryEmbedding
	var (
		queryRes     []*interfaces.DocumentEngity
		embeddingRes []*interfaces.DocumentEngity
		queryErr     error
		embeddingErr error
		wg           sync.WaitGroup
	)

	// 并发执行两个搜索
	wg.Add(2)
	go func() {
		defer wg.Done()
		queryRes, queryErr = o.searchByQuery(ctx, req)
	}()
	go func() {
		defer wg.Done()
		embeddingRes, embeddingErr = o.searchByQueryEmbedding(ctx, req)
	}()
	wg.Wait()

	// 检查错误
	if queryErr != nil {
		return nil, queryErr
	}
	if embeddingErr != nil {
		return nil, embeddingErr
	}

	// 3. 合并结果
	result := o.mergeSearchResults(queryRes, embeddingRes)

	// 根据req.Limit截取结果
	if req.Limit > 0 && req.Limit < len(result) {
		result = result[:req.Limit]
	}

	return result, nil
}

func (o *documentOperatorServiceImpl) searchByQuery(ctx context.Context, req interfaces.DocumentSearchRequest) ([]*interfaces.DocumentEngity, error) {
	if req.Query == "" {
		return nil, nil
	}
	// 构建查询条件
	source := elastic.NewSearchSource()
	query := elastic.NewMultiMatchQuery(
		req.Query,
		"basename",
		"slice_content",
	).
		Type("best_fields").            // 查询类型: best_fields, most_fields, cross_fields 等
		TieBreaker(0.3).                // 设置 tie_breaker 参数
		Operator("OR").                 // 设置操作符: OR 或 AND
		Fuzziness("AUTO").              // 启用模糊匹配
		PrefixLength(2).                // 设置前缀长度
		MaxExpansions(10).              // 设置最大扩展数
		Boost(1.0).                     // 设置整体权重
		FieldWithBoost("basename", 2.0) // 为特定字段设置权重
	source.Query(query).Size(1000).FetchSourceIncludeExclude(nil, []string{"embedding_sq", "embedding"})
	// 查询
	return o.IDocumentDemo.Search(ctx, source)
}

func (o *documentOperatorServiceImpl) searchByQueryEmbedding(ctx context.Context, req interfaces.DocumentSearchRequest) ([]*interfaces.DocumentEngity, error) {
	if len(req.QueryEmbedding) == 0 {
		return nil, nil
	}

	// 构建查询条件
	source := elastic.NewSearchSource()
	vectorInterface := make([]interface{}, len(req.QueryEmbedding))
	queryEmbedding := utils.GetSQEmbeddingVector(req.QueryEmbedding)
	for i, v := range queryEmbedding {
		vectorInterface[i] = v
	}

	// 设置K值并考虑文档切片的影响
	k := req.Limit
	if k <= 0 {
		k = DefaultK
	} else {
		// 放大k值以补偿同一文档多个切片被命中的情况
		// 估计每个文档平均有5个切片，实际应根据数据特性调整
		k = k * 5
	}

	// 设置一个最大值防止k过大导致性能问题
	if k > MaxK {
		k = MaxK
	}

	boolQuery := elastic.NewBoolQuery()
	boolQuery.Must(opensearch_infra.NewKnnQuery("embedding_sq", vectorInterface, k))

	// 增加size值，确保能获取足够的结果
	size := k * 2

	source.Query(boolQuery).Size(size).FetchSourceIncludeExclude(nil, []string{"embedding_sq", "embedding"})

	// 查询
	return o.IDocumentDemo.Search(ctx, source)
}

func (o *documentOperatorServiceImpl) validateSearchRequest(ctx context.Context, req interfaces.DocumentSearchRequest) error {
	if req.Query == "" && len(req.QueryEmbedding) == 0 {
		return myErr.DefaultHTTPError(ctx, http.StatusBadRequest, "query or query_embedding is empty")
	}
	return nil
}

func (o *documentOperatorServiceImpl) validateBulkIndexRequest(ctx context.Context, req interfaces.BulkDocumentIndexRequest) error {
	if len(req) == 0 {
		return myErr.DefaultHTTPError(ctx, http.StatusBadRequest, "data is empty")

	}

	for _, item := range req {
		if item.DocID == "" {
			return myErr.DefaultHTTPError(ctx, http.StatusBadRequest, "docid is empty")
		}

		if len(item.SliceContents) != len(item.Embeddings) && len(item.SliceContents) > 0 {
			return myErr.DefaultHTTPError(ctx, http.StatusBadRequest, "slice_contents and embeddings length mismatch")
		}
	}
	return nil
}

func (o *documentOperatorServiceImpl) createDocumentEngity(req *interfaces.DocumentIndexItem) []*interfaces.DocumentEngity {
	docs := make([]*interfaces.DocumentEngity, 0)
	if len(req.SliceContents) > 0 {
		for index, sliceContent := range req.SliceContents {
			doc := o.buildBaseDocumentEngity(req)
			doc.SliceContent = sliceContent
			doc.SegmentID = index
			doc.Embedding = req.Embeddings[index]
			doc.EmbeddingSq = utils.GetSQEmbeddingVector(req.Embeddings[index])
			docs = append(docs, doc)
		}
		return docs
	}

	if len(req.EmbeddingInfo) > 0 {
		for _, item := range req.EmbeddingInfo {
			doc := o.buildBaseDocumentEngity(req)
			doc.SegmentID = item.SegmentID
			doc.SliceContent = item.SliceContent
			doc.Embedding = item.Embedding
			doc.EmbeddingSq = utils.GetSQEmbeddingVector(item.Embedding)
			docs = append(docs, doc)
		}
		return docs
	}

	docs = append(docs, o.buildBaseDocumentEngity(req))
	return docs
}

func (o *documentOperatorServiceImpl) buildBaseDocumentEngity(req *interfaces.DocumentIndexItem) *interfaces.DocumentEngity {
	doc := &interfaces.DocumentEngity{}

	// 基本信息
	doc.DocID = req.DocID
	doc.Basename = req.Basename
	doc.DoclibID = req.DoclibID
	doc.FolderID = req.FolderID
	doc.ExtType = req.ExtType
	doc.Mimetype = req.Mimetype
	doc.ParentPath = req.ParentPath
	doc.Size = req.Size
	doc.Source = req.Source
	doc.DoclibType = req.DoclibType
	doc.Creator = req.Creator
	doc.CreatorName = req.CreatorName
	doc.CreateTime = req.CreateTime
	doc.Editor = req.Editor
	doc.EditorName = req.EditorName
	doc.ModityTime = req.ModityTime
	return doc
}

// mergeSearchResults 合并查询结果
func (o *documentOperatorServiceImpl) mergeSearchResults(queryRes, embeddingRes []*interfaces.DocumentEngity) interfaces.DocumentSearchResponse {
	// 处理两个结果集都为空的情况
	if len(queryRes) == 0 && len(embeddingRes) == 0 {
		return interfaces.DocumentSearchResponse{}
	}

	// 预估结果集大小，减少内存再分配
	totalSize := len(queryRes) + len(embeddingRes)

	// 创建一个map用于按DocID聚合结果
	docMap := make(map[string]*interfaces.DocumentSearchItem, totalSize)

	// 处理查询结果
	if len(queryRes) > 0 {
		o.processDocuments(docMap, queryRes)
	}

	// 处理嵌入向量查询结果
	if len(embeddingRes) > 0 {
		o.processDocuments(docMap, embeddingRes)
	}

	// 将map转换回切片，预分配容量
	result := make(interfaces.DocumentSearchResponse, 0, len(docMap))

	// 转换为结果集，并统一对所有项的SliceContents进行排序
	for _, item := range docMap {
		// 对每个文档的SliceContents按SegmentID排序
		if len(item.SliceContents) > 0 {
			sort.Slice(item.SliceContents, func(i, j int) bool {
				return item.SliceContents[i].SegmentID < item.SliceContents[j].SegmentID
			})
		}
		result = append(result, *item)
	}

	return result
}

// processDocuments 处理文档实体，添加到结果映射中
func (o *documentOperatorServiceImpl) processDocuments(docMap map[string]*interfaces.DocumentSearchItem, docs []*interfaces.DocumentEngity) {
	for _, doc := range docs {
		if doc == nil {
			continue
		}

		if existingItem, ok := docMap[doc.DocID]; ok {
			// 已存在相同DocID的文档，添加SliceContent
			if doc.SliceContent != "" {
				// 检查是否已经存在相同SegmentID的SliceContent
				segmentExists := false
				for _, sc := range existingItem.SliceContents {
					if sc.SegmentID == doc.SegmentID {
						segmentExists = true
						break
					}
				}

				// 只有当不存在相同SegmentID时才添加
				if !segmentExists {
					existingItem.SliceContents = append(existingItem.SliceContents, interfaces.SliceContent{
						SegmentID:    doc.SegmentID,
						SliceContent: doc.SliceContent,
					})
				}
			}
		} else {
			// 不存在，创建新条目
			searchItem := o.convertDocToSearchItem(doc)
			docMap[doc.DocID] = &searchItem
		}
	}
}

// convertDocToSearchItem 将文档实体转换为搜索结果项
func (o *documentOperatorServiceImpl) convertDocToSearchItem(doc *interfaces.DocumentEngity) interfaces.DocumentSearchItem {
	item := interfaces.DocumentSearchItem{
		DocID:      doc.DocID,
		Basename:   doc.Basename,
		DoclibID:   doc.DoclibID,
		FolderID:   doc.FolderID,
		ExtType:    doc.ExtType,
		Mimetype:   doc.Mimetype,
		ParentPath: doc.ParentPath,
		Size:       doc.Size,
		Source:     doc.Source,
		DoclibType: doc.DoclibType,
	}

	// 添加SliceContent
	if doc.SliceContent != "" {
		item.SliceContents = []interfaces.SliceContent{
			{
				SegmentID:    doc.SegmentID,
				SliceContent: doc.SliceContent,
			},
		}
	}

	return item
}
