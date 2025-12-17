package productresp

type CreateRes struct {
	Key string `json:"key"` // 产品Key
	ID  int64  `json:"id"`  // 产品ID
}
