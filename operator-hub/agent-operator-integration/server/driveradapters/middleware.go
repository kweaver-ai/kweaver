// Package driveradapters 定义驱动适配器
// @file middleware.go
// @description: 中间件适配器
package driveradapters

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/span/v2/field"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/gin-gonic/gin"
	jsoniter "github.com/json-iterator/go"
)

type apiLogModel struct {
	URI          string      `json:"uri"`
	Method       string      `json:"method"`
	RemoteAddr   string      `json:"remoteAddr"`
	RequestBody  interface{} `json:"requestBody"`
	ResponseCode int         `json:"responseCode"`
	ResponseBody interface{} `json:"ResponseBody"`
	Latency      float64     `json:"latency"` // 单位(ms)
}

func getToken(c *gin.Context) (token string) {
	tokenID := c.GetHeader("Authorization")
	if tokenID == "" {
		tokenID = c.GetHeader("X-Authorization")
	}
	if tokenID == "" {
		token, _ = c.GetQuery("token")
	} else {
		token = strings.TrimPrefix(tokenID, "Bearer ")
	}
	return token
}

// middlewareIntrospect 令牌内省中间件
func middlewareIntrospectVerify(hydra interfaces.Hydra) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		// 设置language信息到context
		ctx = common.SetLanguageToCtx(ctx, common.GetLanguageInfo(c))

		tokenInfo, err := hydra.Introspect(ctx, getToken(c))
		if err != nil {
			rest.ReplyError(c, err)
			c.Abort()
			return
		}
		if tokenInfo.LoginIP == "" {
			// 若返回IP为空则使用clientIP
			tokenInfo.LoginIP = c.ClientIP()
		}
		tokenInfo.MAC = c.GetHeader("X-Request-MAC")
		tokenInfo.UserAgent = c.GetHeader("User-Agent")

		// 设置tokenInfo到context
		ctx = common.SetPublicAPIToCtx(ctx, true)
		// 设置认证上下文到context
		authContext := &interfaces.AccountAuthContext{
			AccountID:   tokenInfo.VisitorID,
			AccountType: tokenInfo.VisitorTyp.ToAccessorType(),
			TokenInfo:   tokenInfo,
		}
		ctx = common.SetAccountAuthContextToCtx(ctx, authContext)
		c.Request = c.Request.WithContext(ctx)
		c.Request.Header.Set(string(interfaces.HeaderUserID), tokenInfo.VisitorID)
		c.Request.Header.Set(string(interfaces.IsPublic), "true")
		c.Next()
	}
}

// 内部接口Header认证账户信息处理中间件
func middlewareHeaderAuthContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		// 获取Header中xAccountType账户类型
		xAccountType := c.GetHeader(string(interfaces.HeaderXAccountType))
		if xAccountType == "" {
			xAccountType = string(interfaces.AccessorTypeUser)
		}
		// 兼容user_id传参，当user_id为空时，使用xAccountID
		xAccountID := c.GetHeader(string(interfaces.HeaderUserID))
		if xAccountID == "" {
			xAccountID = c.GetHeader(string(interfaces.HeaderXAccountID))
		}
		// 将user_id设置到Header中,TODO:是否需要检查必填？
		if xAccountID != "" {
			c.Request.Header.Set(string(interfaces.HeaderUserID), xAccountID)
			// 设置认证上下文到context
			authContext := &interfaces.AccountAuthContext{
				AccountID:   xAccountID,
				AccountType: interfaces.AccessorType(xAccountType),
				TokenInfo: &interfaces.TokenInfo{
					VisitorID:  xAccountID,
					VisitorTyp: interfaces.AccessorType(xAccountType).ToVisitorType(),
				},
			}
			ctx = common.SetAccountAuthContextToCtx(ctx, authContext)
			c.Request = c.Request.WithContext(ctx)
		}
		c.Next()
	}
}

func middlewareRequestLog(logger interfaces.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		now := time.Now()
		req, err := io.ReadAll(c.Request.Body)
		if err != nil {
			err = errors.DefaultHTTPError(c.Request.Context(), http.StatusInternalServerError, err.Error())
			rest.ReplyError(c, err)
			c.Abort()
			return
		}
		c.Request.Body = io.NopCloser(bytes.NewBuffer(req))
		c.Next()
		logger.WithContext(c.Request.Context()).Infof("HTTP API Log : %v", field.MallocJsonField(apiLogModel{
			URI:          c.Request.RequestURI,
			Method:       c.Request.Method,
			RemoteAddr:   c.Request.RemoteAddr,
			RequestBody:  byteToInterface(req),
			ResponseCode: c.Writer.Status(),
			Latency:      float64(time.Since(now).Nanoseconds()) / 1e6, //nolint:mnd
		}).Data)
	}
}

func middlewareTrace(c *gin.Context) {
	tracer := otel.GetTracerProvider()
	if tracer != nil {
		var ctx context.Context
		var span trace.Span
		ctx, span = o11y.StartServerSpan(c)
		scheme := interfaces.HTTPS
		if c.Request.TLS == nil {
			scheme = interfaces.HTTP
		}
		span.SetAttributes(attribute.Key("http.scheme").String(scheme))
		req := c.Request.WithContext(ctx)
		c.Request = req
		defer o11y.EndSpan(ctx, c.Request.Context().Err())
	}
	c.Next()
}

func byteToInterface(byt []byte) interface{} {
	m := map[string]interface{}{}
	err := jsoniter.Unmarshal(byt, &m)
	if err == nil {
		return m
	}
	s := []interface{}{}
	err = jsoniter.Unmarshal(byt, &s)
	if err == nil {
		return s
	}

	m["string"] = string(byt)
	return m
}

// middlewareBusinessDomain 处理x-business-domain逻辑
func middlewareBusinessDomain(isPublic, isBuiltin bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		businessDomain := c.GetHeader(string(interfaces.HeaderXBusinessDomain))

		// 1. 外部接口：如果不传递，默认bd_public
		if isPublic {
			if businessDomain == "" {
				businessDomain = interfaces.DefaultBusinessDomain
				c.Request.Header.Set(string(interfaces.HeaderXBusinessDomain), businessDomain)
			}
		} else {
			// 2. 内部接口中的内置算子、工具、MCP：默认bd_public
			if isBuiltin {
				if businessDomain == "" {
					businessDomain = interfaces.DefaultBusinessDomain
					c.Request.Header.Set(string(interfaces.HeaderXBusinessDomain), businessDomain)
				}
			} else {
				if businessDomain == "" {
					err := errors.NewHTTPError(ctx, http.StatusBadRequest, errors.ErrExtBusinessDomainIDRequired, nil)
					rest.ReplyError(c, err)
					c.Abort()
					return
				}
			}
		}

		// 设置到context中供后续使用
		ctx = common.SetBusinessDomainToCtx(ctx, businessDomain)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// middlewareProxyRequest 识别代理请求并设置上下文信息
func middlewareProxyRequest() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 识别请求类型（同步/流式）及流类型
		isStreaming := isStreamingRequest(c)
		if !isStreaming {
			c.Next()
			return
		}
		executionMode := interfaces.ExecutionModeStream
		streamingMode := detectStreamingMode(c)
		// 流式响应模式下，设置响应码为200
		// c.Status(http.StatusOK)
		// 先设置响应码和响应头
		// switch streamingMode {
		// case interfaces.StreamingModeSSE:
		// 	c.Writer.Header().Set("Content-Type", "text/event-stream")
		// 	c.Writer.Header().Set("Cache-Control", "no-cache")
		// 	c.Writer.Header().Set("Connection", "keep-alive")
		// case interfaces.StreamingModeHTTP:
		// 	c.Writer.Header().Set("Content-Type", "application/stream+json")
		// 	c.Writer.Header().Set("Transfer-Encoding", "chunked")
		// 	c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		// }
		// 然后设置上下文和请求头
		ctx := c.Request.Context()
		ctx = common.SetResponseWriterToCtx(ctx, c.Writer)
		ctx = common.SetExecutionModeToCtx(ctx, executionMode)
		ctx = common.SetStreamingModeToCtx(ctx, streamingMode)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// isStreamingRequest 判断是否为流式请求
func isStreamingRequest(c *gin.Context) bool {
	if c.Query("stream") == "true" {
		return true
	}
	accept := c.GetHeader("Accept")
	switch accept {
	case "text/event-stream":
		return true
	case "application/stream+json":
		return true
	default:
		return false
	}
}

// detectStreamingMode 检测流式模式
func detectStreamingMode(c *gin.Context) interfaces.StreamingMode {
	streamMode := c.Query("mode")
	switch interfaces.StreamingMode(streamMode) {
	case interfaces.StreamingModeSSE:
		return interfaces.StreamingModeSSE
	case interfaces.StreamingModeHTTP:
		return interfaces.StreamingModeHTTP
	}
	accept := c.GetHeader("Accept")
	switch accept {
	case "text/event-stream":
		return interfaces.StreamingModeSSE
	case "application/stream+json":
		return interfaces.StreamingModeHTTP
	default:
		return interfaces.StreamingModeHTTP
	}
}
