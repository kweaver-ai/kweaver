package efastdto

type CreatedModifiedBy struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

// ObjectInfo 对象元数据
type DocumentMetaData struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Path       string            `json:"path"`
	Size       int64             `json:"size"`
	Type       string            `json:"type"`
	DocLibType string            `json:"doc_lib_type"`
	CreatedAt  int64             `json:"created_at"`
	ModifiedAt int64             `json:"modified_at"`
	Csflevel   int               `json:"csflevel"`
	Status     string            `json:"status"`
	CreatedBy  CreatedModifiedBy `json:"created_by"`
	ModifiedBy CreatedModifiedBy `json:"modified_by"`
}
