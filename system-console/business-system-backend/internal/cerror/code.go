package cerror

const (
	ErrCodeUnauthorized  = 1  // http.StatusUnauthorized
	ErrCodeForbidden     = 2  // http.StatusForbidden
	ErrCodeConflict      = 3  // http.StatusConflict
	ErrCodeBadRequest    = 4  // http.StatusBadRequest
	ErrCodeNotFound      = 5  // http.StatusNotFound
	ErrCodeMemberExist   = 6  // http.StatusForbidden
	ErrCodeResourceExist = 7  // http.StatusForbidden
	ErrCodeInternal      = -1 // http.StatusInternalServerError
)
