package interfaces

import "context"

// DocumentEngity 文档实体
type DocumentEngity struct {
	DocID        string    `json:"docid" validate:"required"`
	Basename     string    `json:"basename" validate:"required"`
	DoclibID     string    `json:"doclib_id" validate:"required"`
	FolderID     []string  `json:"folder_id,omitempty"`
	ExtType      string    `json:"ext_type,omitempty"`
	Mimetype     string    `json:"mimetype,omitempty"`
	ParentPath   string    `json:"parent_path,omitempty"`
	Size         int64     `json:"size,omitempty"`
	Source       string    `json:"source,omitempty"`
	DoclibType   string    `json:"doclib_type,omitempty"`
	Creator      string    `json:"creator,omitempty"`
	CreatorName  string    `json:"creator_name,omitempty"`
	CreateTime   int64     `json:"create_time,omitempty"`
	Editor       string    `json:"editor,omitempty"`
	EditorName   string    `json:"editor_name,omitempty"`
	ModityTime   int64     `json:"modity_time,omitempty"`
	SegmentID    int       `json:"segment_id,omitempty"`
	SliceContent string    `json:"slice_content,omitempty"`
	Embedding    []float64 `json:"embedding,omitempty"`
	EmbeddingSq  []int64   `json:"embedding_sq,omitempty"`
}

// DocumentIndexItem 文档索引项
type DocumentIndexItem struct {
	DocID         string               `json:"docid" validate:"required"`
	Basename      string               `json:"basename" validate:"required"`
	DoclibID      string               `json:"doclib_id" validate:"required"`
	FolderID      []string             `json:"folder_id,omitempty"`
	ExtType       string               `json:"ext_type,omitempty"`
	Mimetype      string               `json:"mimetype,omitempty"`
	ParentPath    string               `json:"parent_path,omitempty"`
	Size          int64                `json:"size,omitempty"`
	Source        string               `json:"source,omitempty"`
	DoclibType    string               `json:"doclib_type,omitempty"`
	Creator       string               `json:"creator,omitempty"`
	CreatorName   string               `json:"creator_name,omitempty"`
	CreateTime    int64                `json:"create_time,omitempty"`
	Editor        string               `json:"editor,omitempty"`
	EditorName    string               `json:"editor_name,omitempty"`
	ModityTime    int64                `json:"modity_time,omitempty"`
	SliceContents []string             `json:"slice_contents,omitempty"`
	Embeddings    [][]float64          `json:"embeddings,omitempty"`
	EmbeddingInfo []*EmbeddingInfoItem `json:"embedding_info,omitempty"`
}

// EmbeddingInfo 向量信息
type EmbeddingInfoItem struct {
	SegmentID    int       `json:"segment_id"`    // 切片分段ID
	SliceContent string    `json:"slice_content"` // 切片内容
	Embedding    []float64 `json:"embedding"`     // 向量嵌入
}

// BulkDocumentIndexRequest 批量文档索引请求
type BulkDocumentIndexRequest []DocumentIndexItem

// SliceContent 切片内容
type SliceContent struct {
	SegmentID    int    `json:"segment_id"`
	SliceContent string `json:"slice_content"`
}

// DocumentSearchItem 文档搜索结果项
type DocumentSearchItem struct {
	DocID         string         `json:"docid"`
	Basename      string         `json:"basename"`
	DoclibID      string         `json:"doclib_id,omitempty"`
	FolderID      []string       `json:"folder_id,omitempty"`
	ExtType       string         `json:"ext_type,omitempty"`
	Mimetype      string         `json:"mimetype,omitempty"`
	ParentPath    string         `json:"parent_path,omitempty"`
	Size          int64          `json:"size,omitempty"`
	Source        string         `json:"source,omitempty"`
	DoclibType    string         `json:"doclib_type,omitempty"`
	SliceContents []SliceContent `json:"slice_contents,omitempty"`
}

// DocumentSearchResponse 文档搜索响应
type DocumentSearchResponse []DocumentSearchItem

// DocumentSearchRequest 文档搜索请求
type DocumentSearchRequest struct {
	Query          string    `json:"query" validate:"required"`
	QueryEmbedding []float64 `json:"query_embedding,omitempty"`
	Limit          int       `json:"limit,omitempty" validate:"omitempty,gt=0" default:"10"`
}

// DemoOperatorService 定义Demo算子接口
type DemoOperatorService interface {
	// BulkIndex 批量写入文档索引
	BulkIndex(ctx context.Context, req BulkDocumentIndexRequest) error

	// Search 搜索文档索引
	Search(ctx context.Context, req DocumentSearchRequest) (DocumentSearchResponse, error)
}
