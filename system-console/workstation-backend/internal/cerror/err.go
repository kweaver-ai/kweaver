package cerror

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
)

// E 自定义错误
type E struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Cause   string `json:"cause"`
}

func NewError(code int, message string, cause string) E {
	return E{
		Code:    code,
		Message: message,
		Cause:   cause,
	}
}

func AsError(err error) E {
	var rel E
	if errors.As(err, &rel) {
		return rel
	}
	return NewError(
		CodeServerProduceError,
		"server produce internal error",
		err.Error(),
	)
}

func (e E) httpcode() int {
	c, _ := strconv.Atoi(strconv.Itoa(e.Code)[:3])
	return c
}

func (e E) Error() string {
	return fmt.Sprintf("code=%d, message='%s', cause='%s'", e.Code, e.Message, e.Cause)
}

func (e E) Reply(c *gin.Context) {
	c.JSON(e.httpcode(), e)
	c.Abort()
}

func Reply(err error, c *gin.Context) {
	AsError(err).Reply(c)
}
