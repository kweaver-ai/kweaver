// Package driveradapters 定义驱动适配器
// @file middleware.go
// @description: 中间件适配器
package driveradapters

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/common"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-app/server/interfaces"

	"devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/TelemetrySDK-Go.git/span/v2/field"
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

		// 设置认证上下文到context
		authContext := &interfaces.AccountAuthContext{
			AccountID:   tokenInfo.VisitorID,
			AccountType: tokenInfo.VisitorTyp.ToAccessorType(),
			TokenInfo:   tokenInfo,
		}
		ctx = common.SetAccountAuthContextToCtx(ctx, authContext)
		c.Request = c.Request.WithContext(ctx)
		c.Request.Header.Set(string(interfaces.HeaderUserID), tokenInfo.VisitorID)
		c.Next()
	}
}

// 内部接口Header认证账户信息处理中间件
func middlewareHeaderAuthContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		// 获取Header中xAccountType账户类型
		xAccountType := c.GetHeader(string(interfaces.HeaderXAccountType))

		// 兼容user_id传参，当user_id为空时，使用xAccountID
		xAccountID := c.GetHeader(string(interfaces.HeaderUserID))
		if xAccountID == "" {
			xAccountID = c.GetHeader(string(interfaces.HeaderXAccountID))
		}
		// 将user_id设置到Header中,TODO:是否需要检查必填？
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
