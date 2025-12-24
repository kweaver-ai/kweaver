package auditlog

const (
	LevelWARN       TLevel     = "WARN"
	LevelINFO       TLevel     = "INFO"
	OperationCreate TOperation = "create"
	OperationDelete TOperation = "delete"
	OperationAdd    TOperation = "add"
	OperationUpdate TOperation = "update"
)

type (
	TLevel     string
	TOperation string
	Message    struct {
		Operation   TOperation `json:"operation"`
		Description string     `json:"description"`
		OPTime      int64      `json:"op_time"`
		Operator    Toperator  `json:"operator"`
		Object      Tobject    `json:"object,omitempty"`
		LogFrom     TlogFrom   `json:"log_from"`
		Detail      any        `json:"detail,omitempty"`
		EXMsg       string     `json:"ex_msg,omitempty"`
		Level       TLevel     `json:"level"`
		OutBizID    string     `json:"out_biz_id"`
		Type        string     `json:"type"`
	}

	Toperator struct {
		ID    string         `json:"id"`
		Name  string         `json:"name"`
		Type  string         `json:"type"`
		Agent ToperatorAgent `json:"agent"`
	}
	ToperatorAgent struct {
		Type string `json:"type"`
		IP   string `json:"ip"`
		Mac  string `json:"mac"`
	}
	TlogFrom struct {
		Package string          `json:"package"`
		Service TlogFromService `json:"service"`
	}

	TlogFromService struct {
		Name string `json:"name"`
	}

	Tobject struct {
		ID   string `json:"id"`
		Name string `json:"name"`
		Type string `json:"type"`
	}
)
