package cerror

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CError struct {
	Code     int    `json:"code"`
	Message  string `json:"message"`
	Cause    string `json:"cause"`
	Data     any    `json:"data,omitempty"`
	HttpCode int    `json:"-"`
	Err      error  `json:"-"`
}

func (e *CError) Error() string {
	return fmt.Sprintf(
		"code=%d;message=%s,cuase=%s",
		e.Code,
		e.Message,
		e.Cause,
	)

}

func (e *CError) GinFailed(ctx *gin.Context) {
	if e.Code == 0 {
		e.Code = ErrCodeInternal
		// 补充错误码
	}
	if e.Message == "" {
		if e.Err != nil {
			e.Message = e.Err.Error()
		} else if e.HttpCode != 0 {
			e.Message = http.StatusText(e.HttpCode)
		} else {
			e.Message = "internal server error"
		}
		// 补充消息
	}
	if e.Cause == "" {
		if e.Err != nil {
			e.Cause = e.Err.Error()
		} else if e.HttpCode != 0 {
			e.Cause = http.StatusText(e.HttpCode)
		} else {
			e.Cause = "internal server error"
		}
		// 补充原因
	}

	if e.HttpCode == 0 {
		e.HttpCode = http.StatusInternalServerError
		// 默认状态码
	}

	ctx.AbortWithStatusJSON(e.HttpCode, e)
}

func GinAutoFailed(ctx *gin.Context, err error) {
	var ce *CError
	if errors.As(err, &ce) {
		ce.GinFailed(ctx)
		return
	}

	New(-1).SetErr(err).GinFailed(ctx)
}

func (e *CError) SetHttpCode(code int) *CError {
	e.HttpCode = code
	return e
}

func (e *CError) SetErr(err error) *CError {
	e.Err = err
	return e
}

func (e *CError) WithData(data any) *CError {
	e.Data = data
	return e
}

func (e *CError) WithMessage(msg string) *CError {
	e.Message = msg
	return e
}

func (e *CError) WithCause(cause string) *CError {
	e.Cause = cause
	return e
}

func (e *CError) WithCode(code int) *CError {
	e.Code = code
	return e
}

func New(code int) *CError {
	return &CError{
		Code: code,
	}
}
