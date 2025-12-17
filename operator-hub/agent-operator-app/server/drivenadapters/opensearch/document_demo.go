package opensearch

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/opensearch"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"
	jsoniter "github.com/json-iterator/go"
	"github.com/olivere/elastic/v7"
)

type IDocumentDemo interface {
	BulkIndex(ctx context.Context, docs []*interfaces.DocumentEngity) error
	Search(ctx context.Context, source *elastic.SearchSource) ([]*interfaces.DocumentEngity, error)
}

var (
	once sync.Once
	om   IDocumentDemo
)

const (
	IndexName = "dip-agent-operator-document-demo"
)

type documentDemoImpl struct {
	Logger    interfaces.Logger
	rawClient *elastic.Client
}

func NewDocumentDemoImpl() IDocumentDemo {
	once.Do(func() {
		logger := config.NewConfigLoader().GetLogger()
		rawClient := opensearch.NewRawEsClient()

		om = &documentDemoImpl{
			rawClient: rawClient,
			Logger:    logger,
		}
	})
	return om
}

func (d *documentDemoImpl) BulkIndex(ctx context.Context, docs []*interfaces.DocumentEngity) error {
	// 检查输入参数
	if len(docs) == 0 {
		return nil // 如果没有文档需要索引，直接返回成功
	}

	// 批量大小设置
	const batchSize = 1000 // 每批处理的文档数量

	// 如果文档数量少于批量大小，直接处理
	if len(docs) <= batchSize {
		return d.processBulkBatch(ctx, docs)
	}

	// 分批处理大量文档
	for i := 0; i < len(docs); i += batchSize {
		end := i + batchSize
		if end > len(docs) {
			end = len(docs)
		}

		batch := docs[i:end]
		if err := d.processBulkBatch(ctx, batch); err != nil {
			return fmt.Errorf("failed processing batch %d-%d: %w", i, end, err)
		}
	}

	return nil
}

func (d *documentDemoImpl) Search(ctx context.Context, source *elastic.SearchSource) ([]*interfaces.DocumentEngity, error) {
	searchResult, err := d.rawClient.Search().
		Index(IndexName).
		SearchSource(source).
		Do(ctx)
	if err != nil {
		return nil, err
	}

	docs := make([]*interfaces.DocumentEngity, 0, len(searchResult.Hits.Hits))
	if searchResult.TotalHits() == 0 {
		return docs, nil
	}

	for _, hit := range searchResult.Hits.Hits {
		doc := &interfaces.DocumentEngity{}
		if jsonErr := jsoniter.Unmarshal(hit.Source, doc); jsonErr != nil {
			return nil, jsonErr
		}
		docs = append(docs, doc)
	}

	return docs, nil
}

// processBulkBatch 处理单个批次的文档索引
func (d *documentDemoImpl) processBulkBatch(ctx context.Context, docs []*interfaces.DocumentEngity) error {
	// 创建批量请求
	bulk := d.rawClient.Bulk()

	// 设置批量操作的一些参数
	bulk.Timeout("5m")       // 设置超时时间
	bulk.Refresh("wait_for") // 等待刷新，确保索引后可立即搜索到

	// 添加文档到批量请求
	for _, doc := range docs {
		if doc == nil || doc.DocID == "" {
			continue // 跳过无效文档
		}
		req := elastic.NewBulkIndexRequest().
			Index(IndexName).
			Id(d.generateIndexID(doc)).
			Doc(doc)
		bulk.Add(req)
	}

	// 如果没有有效的文档添加到批量请求中
	if bulk.NumberOfActions() == 0 {
		return nil
	}

	// 执行批量请求
	resp, err := bulk.Do(ctx)
	if err != nil {
		return err
	}

	// 检查响应中是否有错误
	if resp.Errors {
		// 收集所有失败的项目
		var failedItems []string
		for _, item := range resp.Failed() {
			failedItems = append(failedItems, fmt.Sprintf("ID: %s, Error: %s", item.Id, item.Error.Reason))
		}

		if len(failedItems) > 0 {
			return fmt.Errorf("bulk index partially failed: %s", strings.Join(failedItems, "; "))
		}
	}

	return nil
}

func (d *documentDemoImpl) generateIndexID(doc *interfaces.DocumentEngity) string {
	// 1. 对doc.DocID根据“/”进行分割，取最后一个元素
	parts := strings.Split(doc.DocID, "/")
	lastPart := parts[len(parts)-1]

	// 2. 对doc.SegmentID + 1
	segmentID := doc.SegmentID + 1

	// 3. 将lastPart和segmentID拼接
	return fmt.Sprintf("%s_%d", lastPart, segmentID)
}
