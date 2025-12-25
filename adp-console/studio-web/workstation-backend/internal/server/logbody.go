//nolint:unused
package server

import (
	"bytes"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type customResponseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w customResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func bodyLogger(log logrus.FieldLogger) gin.HandlerFunc {
	return func(c *gin.Context) {
		crw := &customResponseWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		l := log.WithField("path", c.Request.URL.Path).WithField("method", c.Request.Method)
		c.Writer = crw
		reqBody, _ := c.GetRawData()
		if len(reqBody) > 0 {
			c.Request.Body = io.NopCloser(bytes.NewBuffer(reqBody))
		}
		l.WithField("body", "request").Trace(string(reqBody))
		c.Next()
		l.WithField("body", "response").Trace(crw.body.String())
	}
}
