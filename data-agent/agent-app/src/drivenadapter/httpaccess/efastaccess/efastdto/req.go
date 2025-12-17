package efastdto

type GetObjectFieldByIDReq struct {
	Method string   `json:"method"`
	ObjIDs []string `json:"obj_ids"`
}
