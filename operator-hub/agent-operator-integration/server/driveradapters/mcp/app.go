package mcp

import (
	"bufio"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/tls"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strings"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/errors"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/rest"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

const (
	originHeadersKey interfaces.ContextKey = "OriginalHeaders" // 原始响应头key
)

const (
	mcpMessageEndpointKeyTemplate = "agent-operator-integration:mcp_message_endpoint:%s" // sse mcp 消息端点缓存key模板
	mcpMessageEndpointExpiryTime  = 24 * time.Hour                                       // sse mcp 消息端点缓存过期时间
)

func (h *mcpHandle) HandleStreamingHttp(c *gin.Context) {
	var err error
	req := &interfaces.MCPAppEndpointRequest{}

	if err = c.ShouldBindUri(req); err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	result, err := h.mcpService.GetAppConfig(c.Request.Context(), req.MCPID, interfaces.MCPModeStream)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	h.reverseProxyStream(c, result)
}

func (h *mcpHandle) HandleServerSentEvents(c *gin.Context) {
	var err error
	req := &interfaces.MCPAppEndpointRequest{}

	if err = c.ShouldBindUri(req); err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}
	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	result, err := h.mcpService.GetAppConfig(c.Request.Context(), req.MCPID, interfaces.MCPModeSSE)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	h.reverseProxySSE(c, result)
}

func (h *mcpHandle) HandleSSEMessage(c *gin.Context) {
	var err error
	req := &interfaces.MCPAppEndpointRequest{}

	if err = c.ShouldBindUri(req); err != nil {
		err = errors.DefaultHTTPError(c.Request.Context(), http.StatusBadRequest, err.Error())
		rest.ReplyError(c, err)
		return
	}

	err = validator.New().Struct(req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	// 从redis中获取目标message端点url
	messageEndpoint, err := h.redisCli.Get(c.Request.Context(), fmt.Sprintf(mcpMessageEndpointKeyTemplate, req.MCPID)).Result()
	if err != nil {
		rest.ReplyError(c, errors.DefaultHTTPError(c.Request.Context(), http.StatusNotFound, "message endpoint not found"))
		return
	}

	target, err := url.Parse(messageEndpoint)
	if err != nil {
		h.Logger.Warnf("[MCP App] parse message endpoint error: %v", err)
		rest.ReplyError(c, errors.DefaultHTTPError(c.Request.Context(), http.StatusInternalServerError, "parse message endpoint error"))
		return
	}

	// 确保RawQuery不会被错误地附加到Path上
	rawQuery := c.Request.URL.RawQuery
	if rawQuery != "" {
		// 确保不会将查询参数错误地附加到路径上
		if strings.Contains(target.Path, "?") {
			// 分离路径和查询参数
			parts := strings.SplitN(target.Path, "?", 2)
			target.Path = parts[0]

			// 合并查询参数
			if target.RawQuery != "" {
				target.RawQuery += "&" + parts[1]
			} else {
				target.RawQuery = parts[1]
			}
		}

		// 添加请求中的查询参数
		if target.RawQuery != "" {
			target.RawQuery += "&" + rawQuery
		} else {
			target.RawQuery = rawQuery
		}
	}

	h.reverseProxyMessage(c, target)
}

func (h *mcpHandle) reverseProxyMessage(c *gin.Context, targetURL *url.URL) {
	reverseProxy := httputil.NewSingleHostReverseProxy(targetURL)

	// 1. 配置传输层参数
	reverseProxy.Transport = &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        200,             // 适度限制连接数
		IdleConnTimeout:     5 * time.Minute, // 空闲超时5分钟
		TLSHandshakeTimeout: 10 * time.Second,
		WriteBufferSize:     32 * 1024, // 32KB写缓冲区
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // 跳过TLS证书验证，仅用于测试
		},
		DisableCompression: false, // 允许压缩
	}

	// 2. 配置请求转发逻辑
	reverseProxy.Director = func(req *http.Request) {
		sensitiveHeaders := []string{
			"X-Forwarded-For",
			"X-Real-Ip",
		}
		for _, h := range sensitiveHeaders {
			req.Header.Del(h)
		}

		// 设置必要的请求头
		req.Header.Set("Accept", "*/*")
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Cache-Control", "no-cache")
		req.Header.Set("Connection", "keep-alive")

		// 修改请求URL
		req.URL.Scheme = targetURL.Scheme
		req.URL.Host = targetURL.Host
		req.URL.Path = targetURL.Path
		req.URL.RawQuery = targetURL.RawQuery

		// 设置Host头为目标主机
		req.Host = targetURL.Host
	}

	// 3. 配置错误处理
	reverseProxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		h.Logger.Warnf("[MCP App] Message proxy error: %v", err)
		w.WriteHeader(http.StatusBadGateway)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(fmt.Sprintf(`{"error":"Proxy error: %v"}`, err)))
	}

	// 4. 添加响应修改功能
	reverseProxy.ModifyResponse = func(resp *http.Response) error {
		// 如果响应状态码不是200，记录详细信息
		if resp.StatusCode != http.StatusOK {
			h.Logger.Warnf("[MCP App] Non-200 message response: %d %s", resp.StatusCode, resp.Status)

			// 读取响应体用于诊断
			body, err := io.ReadAll(io.LimitReader(resp.Body, 1000))
			if err != nil {
				h.Logger.Warnf("[MCP App] Error reading message response body: %v", err)
			} else {
				// 重新创建响应体
				resp.Body = io.NopCloser(bytes.NewBuffer(body))
			}
		}

		return nil
	}

	reverseProxy.ServeHTTP(c.Writer, c.Request)
}

func (h *mcpHandle) reverseProxySSE(c *gin.Context, config *interfaces.MCPAppConfigInfo) {
	target, err := url.Parse(config.URL)
	if err != nil {
		h.Logger.Warnf("[MCP App] Failed to parse target URL: %v", err)
		c.String(http.StatusInternalServerError, "Failed to parse target URL")
		return
	}
	reverseProxy := httputil.NewSingleHostReverseProxy(target)

	// 配置传输层参数
	reverseProxy.Transport = &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConnsPerHost:   500, // 提高单主机连接数
		IdleConnTimeout:       0,   // 禁用空闲超时
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 60 * time.Second, // 设置响应头超时
		ExpectContinueTimeout: 5 * time.Second,  // 设置100-continue超时
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // 跳过TLS证书验证，仅用于测试
		},
		DisableCompression: false, // 允许压缩
	}

	// 配置请求转发逻辑
	reverseProxy.Director = func(req *http.Request) {
		// 清除敏感头信息
		sensitiveHeaders := []string{
			"X-Forwarded-For",
			"X-Real-Ip",
		}
		for _, h := range sensitiveHeaders {
			req.Header.Del(h)
		}

		// 修改请求URL
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = target.Path
		req.URL.RawQuery = target.RawQuery

		// 设置Host头为目标主机
		req.Host = target.Host

		// 添加自定义头
		if len(config.Headers) > 0 {
			for key, value := range config.Headers {
				req.Header.Set(key, value)
			}
		}
	}

	// 3. 配置错误处理
	reverseProxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		h.Logger.Warnf("[MCP App] proxy error: %v", err)
		w.WriteHeader(http.StatusBadGateway)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(fmt.Sprintf("Proxy error: %v", err)))
	}

	// 4. 响应修改
	reverseProxy.ModifyResponse = func(resp *http.Response) error {
		// 创建响应头的深拷贝
		originalHeaders := make(http.Header)
		for k, v := range resp.Header {
			// 对每个切片值也进行拷贝
			originalHeaders[k] = append([]string{}, v...)
		}

		ctx := context.WithValue(resp.Request.Context(), originHeadersKey, originalHeaders)
		resp.Request = resp.Request.WithContext(ctx)
		contentType := resp.Header.Get("Content-Type")
		mimeType, _, _ := strings.Cut(contentType, ";")

		// 如果响应状态码不是200，记录详细信息
		if resp.StatusCode != http.StatusOK {
			h.Logger.Warnf("[MCP App] Non-200 response from target: %d %s", resp.StatusCode, resp.Status)
		}

		if contentType == "" {
			h.Logger.Warnf("[MCP App] Warning: Content-Type header is empty")
		}

		if strings.TrimSpace(mimeType) != "text/event-stream" {
			// 读取前500字节响应体用于诊断，但不记录内容
			_, err := io.ReadAll(io.LimitReader(resp.Body, 500))
			if err != nil {
				h.Logger.Warnf("[MCP App] Error reading response body: %v", err)
			}
		}

		// 创建管道处理流式响应
		pr, pw := io.Pipe()
		token := getToken(c)
		go h.processSSEStream(resp.Request.Context(), config.MCPID, token, target, resp.Body, pw)
		resp.Body = pr

		// 确保设置正确的响应头
		resp.Header.Del("Content-Encoding")
		resp.Header.Set("Cache-Control", "no-cache")
		resp.Header.Set("Connection", "keep-alive")

		return nil
	}

	reverseProxy.ServeHTTP(c.Writer, c.Request)
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

func (h *mcpHandle) reverseProxyStream(c *gin.Context, config *interfaces.MCPAppConfigInfo) {
	target, err := url.Parse(config.URL)
	if err != nil {
		h.Logger.Warnf("[MCP App] Failed to parse target URL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse target URL"})
		return
	}

	// 创建反向代理
	reverseProxy := httputil.NewSingleHostReverseProxy(target)

	// 1. 配置传输层参数
	reverseProxy.Transport = &http.Transport{
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		MaxIdleConns:        200,
		IdleConnTimeout:     5 * time.Minute,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: true, // 跳过TLS证书验证，仅用于测试
		},
	}

	// 2. 配置透明请求转发逻辑
	reverseProxy.Director = func(req *http.Request) {
		// 记录原始请求信息（用于调试）
		h.Logger.Debugf("[MCP App] Transparent forwarding: %s %s", req.Method, req.URL.Path)

		// 如果有请求体，记录用于调试（但不修改）
		if req.Body != nil && req.ContentLength > 0 {
			bodyBytes, err := io.ReadAll(req.Body)
			if err != nil {
				h.Logger.Warnf("[MCP App] Failed to read request body for logging: %v", err)
			} else {
				// 重新设置请求体，保持原始内容
				req.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
				h.Logger.Debugf("[MCP App] Request body: %s", string(bodyBytes))
			}
		}

		// 只删除代理相关的敏感头部，保留其他所有头部
		sensitiveHeaders := []string{
			"X-Forwarded-For",
			"X-Real-Ip",
		}
		for _, h := range sensitiveHeaders {
			req.Header.Del(h)
		}

		// 修改请求URL到目标地址
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = target.Path
		req.URL.RawQuery = target.RawQuery

		// 设置Host头为目标主机
		req.Host = target.Host

		h.Logger.Debugf("[MCP App] Forwarding to: %s://%s%s", req.URL.Scheme, req.URL.Host, req.URL.Path)
	}

	// 3. 配置错误处理
	reverseProxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		h.Logger.Warnf("[MCP App] Proxy error: %v", err)
		w.WriteHeader(http.StatusBadGateway)
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(fmt.Sprintf(`{"error":"Proxy error: %v"}`, err)))
	}

	// 4. 添加响应修改功能
	reverseProxy.ModifyResponse = func(resp *http.Response) error {
		// 如果响应状态码不是200，记录详细信息
		if resp.StatusCode != http.StatusOK {
			h.Logger.Warnf("[MCP App] Non-200 response: %d %s", resp.StatusCode, resp.Status)

			// 读取响应体用于诊断，但保留它以便返回给客户端
			body, err := io.ReadAll(io.LimitReader(resp.Body, 1000))
			if err != nil {
				h.Logger.Warnf("[MCP App] Error reading response body: %v", err)
			} else {
				h.Logger.Debugf("[MCP App] Response body: %s", string(body))
				// 重新创建响应体
				resp.Body = io.NopCloser(bytes.NewBuffer(body))
			}
		} else {
			// 记录成功响应
			h.Logger.Debugf("[MCP App] Successful response with status: %d %s", resp.StatusCode, resp.Status)
			h.Logger.Debugf("[MCP App] Response headers: %v", resp.Header)
		}

		return nil
	}

	// 使用反向代理处理请求
	reverseProxy.ServeHTTP(c.Writer, c.Request)
}

func (h *mcpHandle) processSSEStream(ctx context.Context, mcpID, token string, targetURL *url.URL, src io.ReadCloser, dst *io.PipeWriter) {
	defer func() {
		src.Close()
		dst.Close()
	}()

	// 添加gzip解压缩逻辑
	reader := io.Reader(src)

	// 从上下文中获取响应头信息
	if headers, ok := ctx.Value(originHeadersKey).(http.Header); ok {
		contentEncoding := headers.Get("Content-Encoding")

		// 处理 gzip 压缩
		if strings.Contains(strings.ToLower(contentEncoding), "gzip") {
			gz, err := gzip.NewReader(reader)
			if err != nil {
				// 如果解压失败，尝试直接使用原始 reader
				gz, err = gzip.NewReader(bufio.NewReader(reader))
				if err != nil {
					h.Logger.Warnf("[MCP App] Gzip decompression failed: %v", err)
					// 发送错误消息并返回
					errorMsg := fmt.Sprintf("event: error\ndata: {\"error\": \"Gzip decompression failed: %v\"}\n\n", err)
					if _, writeErr := dst.Write([]byte(errorMsg)); writeErr != nil {
						h.Logger.Warnf("[MCP App] Failed to write error to SSE stream: %v", writeErr)
					}
					return
				}
			}
			defer gz.Close()
			reader = gz
		}
	}

	// 添加缓冲读取器以处理大文件
	bufferedReader := bufio.NewReader(reader)
	scanner := bufio.NewScanner(bufferedReader)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()
		h.Logger.Infof("[MCP App] sse stream line: %s", line)

		// 处理endpoint事件
		endpointRegex := regexp.MustCompile(`(?i)^event:\s*endpoint`)
		if endpointRegex.MatchString(line) {
			eventLine := line
			// 读取下一行
			if !scanner.Scan() {
				dst.Write([]byte(eventLine + "\n"))
				break
			}

			dataLine := scanner.Text()
			if strings.Contains(dataLine, "data:") {
				// 解析原始message端点
				originalURI := strings.TrimPrefix(dataLine, "data:")
				originalURI = strings.TrimSpace(originalURI)

				// 检查是否是完整URL，如果不是，则构建完整URL
				if !strings.HasPrefix(originalURI, "http://") && !strings.HasPrefix(originalURI, "https://") {
					// 如果是相对路径，构建完整URL
					baseURL := targetURL.Scheme + "://" + targetURL.Host

					// 确保路径和查询参数正确分离
					pathAndQuery := originalURI
					if strings.Contains(pathAndQuery, "?") {
						parts := strings.SplitN(pathAndQuery, "?", 2)
						pathPart := parts[0]
						queryPart := parts[1]

						// 确保路径正确
						if !strings.HasPrefix(pathPart, "/") {
							pathPart = "/" + pathPart
						}

						originalURI = baseURL + pathPart + "?" + queryPart
					} else {
						// 没有查询参数的情况
						if !strings.HasPrefix(pathAndQuery, "/") {
							pathAndQuery = "/" + pathAndQuery
						}
						originalURI = baseURL + pathAndQuery
					}
				}
				u, err := url.Parse(originalURI)
				if err != nil {
					h.Logger.Warnf("[MCP App] parse original path error: %v", err)
					continue
				}

				// 构建完整的消息端点URL
				// 从URL中提取正确的路径和查询参数
				messagePath := u.Path
				if !strings.HasPrefix(messagePath, "/") {
					messagePath = "/" + messagePath
				}

				// 使用原始目标URL的scheme和host，加上从SSE事件中提取的路径
				messageEndpoint := targetURL.Scheme + "://" + targetURL.Host + messagePath

				// 添加查询参数
				if u.RawQuery != "" {
					messageEndpoint += "?" + u.RawQuery
				}

				// 存储到映射中供后续请求使用
				h.redisCli.Set(ctx, fmt.Sprintf(mcpMessageEndpointKeyTemplate, mcpID), messageEndpoint, mcpMessageEndpointExpiryTime)

				// 构建客户端请求的查询参数
				clientQuery := ""
				if u.RawQuery != "" {
					clientQuery = "?" + u.RawQuery
					if token != "" {
						clientQuery += "&token=" + token
					}
				} else if token != "" {
					clientQuery = "?token=" + token
				}

				// 重写代理地址，确保不包含多余的查询参数分隔符
				dataLine = fmt.Sprintf("data: /api/agent-operator-integration/v1/mcp/app/%s/message%s", mcpID, clientQuery)
				// 写回修改后的数据
				dst.Write([]byte(eventLine + "\n"))
				dst.Write([]byte(dataLine + "\n"))
			}
		} else {
			dst.Write([]byte(line + "\n"))
		}
	}
	if err := scanner.Err(); err != nil {
		h.Logger.Warnf("[MCP App] Error reading SSE stream: %v", err)
		// 确保错误消息正确发送
		errorMsg := fmt.Sprintf("event: error\ndata: {\"error\": \"Error reading SSE stream: %v\"}\n\n", err)
		if _, writeErr := dst.Write([]byte(errorMsg)); writeErr != nil {
			h.Logger.Warnf("[MCP App] Failed to write error to SSE stream: %v", writeErr)
		}
	}
}
