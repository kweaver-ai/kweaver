package cerror

import "net/http"

const appCode = 26
const (
	CodeServerProduceError = iota + 1_000*appCode + 1_000_000*http.StatusInternalServerError
	CodeParamsInvalidError = iota + 1_000*appCode + 1_000_000*http.StatusBadRequest
	CodeNotFoundError      = iota + 1_000*appCode + 1_000_000*http.StatusNotFound
)
