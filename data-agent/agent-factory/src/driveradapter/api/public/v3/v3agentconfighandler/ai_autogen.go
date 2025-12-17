package v3agentconfighandler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/driveradapter/api/rdto/agent_config/agentconfigreq"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-factory/src/port/driven/ihttpaccess/imodelfactoryacc"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/gin-gonic/gin"
)

// aiAutogenContent AI自动生成内容
func (h *daConfHTTPHandler) AIAutogenContent(c *gin.Context) {
	language := chelper.GetVisitLanguageCtx(c)
	closeNotify := c.Request.Context().Done()

	go func() {
		<-closeNotify
	}()

	var req agentconfigreq.AiAutogenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		err = capierr.New400Err(c, chelper.ErrMsg(err, &req))
		rest.ReplyError(c, err)

		return
	}

	req.Language = language

	user := chelper.GetVisitorFromCtx(c)
	if user == nil {
		err := capierr.New401Err(c, "[AIAutogenContent] user not found")
		rest.ReplyError(c, err)

		return
	}

	req.UserID = user.ID
	req.AccountType.LoadFromMDLVisitorType(user.Type)

	if req.IsNotStream() {
		h.aiAutogenContentNotStream(c, &req)
		return
	}

	req.Stream = true

	messageChan, errorChan, err := h.daConfSvc.AIAutogenV3(c, &req)
	if err != nil {
		httpErr := rest.NewHTTPError(c, http.StatusInternalServerError, apierr.AiAutogenError).WithErrorDetails(err.Error())
		rest.ReplyError(c, httpErr)

		return
	}
	// 开始SSE流
	var resp imodelfactoryacc.ChatCompletionResponse

	c.Stream(func(w io.Writer) bool {
		select {
		case <-closeNotify:
			return false
		case msg, more := <-messageChan:
			if !more {
				return false // 消息通道关闭，结束SSE流
			}

			var message string

			parts := strings.SplitN(msg, ":", 2)
			if len(parts) == 2 && (parts[0] == "data" || parts[0] == "error") {
				message = parts[1]
			}

			if message == " [DONE]" {
				c.SSEvent("", "[DONE]")
				return false
			}
			// NOTE: 这里需要处理msg的格式
			err = json.Unmarshal([]byte(message), &resp)
			if err != nil {
				errMsg := rest.NewHTTPError(c, http.StatusInternalServerError, apierr.AiAutogenError).WithErrorDetails(err.Error())
				errBytes, _ := json.Marshal(errMsg)
				c.SSEvent("error", string(errBytes))

				return false
			}

			if resp.Choices[0].Delta.Content != "" {
				c.SSEvent("message", resp.Choices[0].Delta.Content)
			}
			// 确保每条消息后立即刷新
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}

			return true

		case err, more := <-errorChan:
			if !more {
				return false // 错误通道关闭，也可以结束SSE流
			}

			if err.Error() == "unexpected EOF" || err.Error() == "EOF" {
				c.SSEvent("", "[DONE]")
				return false
			}

			if err.Error() != "unexpected EOF" && err.Error() != "EOF" {
				errMsg := rest.NewHTTPError(c, http.StatusInternalServerError, apierr.AiAutogenError).WithErrorDetails(err.Error())
				errBytes, _ := json.Marshal(errMsg)
				c.SSEvent("error", string(errBytes))

				if f, ok := w.(http.Flusher); ok {
					f.Flush()
				}
			}

			return true
		}
	})
}

func (h *daConfHTTPHandler) aiAutogenContentNotStream(c *gin.Context, req *agentconfigreq.AiAutogenReq) {
	res, err := h.daConfSvc.AIAutogenNotStream(c, req)
	if err != nil {
		rest.ReplyError(c, err)
		return
	}

	c.JSON(http.StatusOK, res)
}
