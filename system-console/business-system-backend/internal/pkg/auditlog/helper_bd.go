package auditlog

const BDObjectType = "business_domain"

type BDMessage struct {
	Operation   TOperation `json:"operation"`
	Description string     `json:"description"`
	Object      Tobject    `json:"object"`
	EXMsg       string     `json:"ex_msg"`
	Level       TLevel     `json:"level"`
}
