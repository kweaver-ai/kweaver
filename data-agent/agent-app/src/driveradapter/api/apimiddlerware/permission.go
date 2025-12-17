package apimiddleware

import (
	"bytes"
	"fmt"
	"io"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/httpinject"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/drivenadapter/httpaccess/agentfactoryhttp/afhttpdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capimiddleware"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
	"github.com/gin-gonic/gin"
)

func CheckAgentUsePms() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 方法3：使用 gin 的 GetRawData
		body, err := c.GetRawData()
		if err != nil {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePms] get raw data failed")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		var data map[string]interface{}
		if err := sonic.Unmarshal(body, &data); err != nil {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePms] unmarshal body failed")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		agentID := ""
		if agentValue, ok := data["agent_id"].(string); ok {
			agentID = agentValue
		} else if agentValue, ok := data["agent_key"].(string); ok {
			//NOTE: 通过AgentKey查询AgentID
			agent, err := httpinject.NewAgentFactoryHttpAcc().GetAgent(c.Request.Context(), agentValue, "latest")
			if err != nil {
				httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] get agent id by agent key failed")
				rest.ReplyError(c, httpErr)
				c.Abort()
				return
			}
			agentID = agent.ID
		} else {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePms] one of agent_id and agent_key is required,type must be string")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		// 重新设置请求体
		//NOTE: 读取完请求体后需要重新设置，否则后续的处理器无法读取
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

		visitor := chelper.GetVisitorFromCtx(c)
		if visitor == nil {
			httpErr := capierr.New401Err(c, "[CheckAgentUsePms] user not found")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		req := &afhttpdto.CheckPmsReq{}
		if visitor.Type == rest.VisitorType_App {
			req = afhttpdto.NewCheckAgentUsePmsReq(agentID, "", visitor.ID)
		} else {
			req = afhttpdto.NewCheckAgentUsePmsReq(agentID, visitor.ID, "")
		}

		handler := capimiddleware.CheckPms(req, func(c *gin.Context, hasPms bool) {
			if !hasPms {
				httpErr := capierr.NewCustom403Err(c, apierr.AgentAPP_Forbidden_PermissionDenied, fmt.Sprintf("user %s has no permission to use agent %s", visitor.ID, agentID))
				rest.ReplyError(c, httpErr)
				c.Abort()
				return
			}
		})

		handler(c)

		c.Next()
	}
}

// func CheckSpaceMember() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		customSpaceID := c.Query("custom_space_id")
// 		visitor := chelper.GetVisitorFromCtx(c)
// 		if visitor == nil {
// 			httpErr := capierr.New401Err(c, "[CheckSpaceMember] user not found")
// 			rest.ReplyError(c, httpErr)
// 			c.Abort()
// 			return
// 		}

// 		req := &cpmsreq.CheckIsCustomSpaceMemberReq{
// 			CustomSpaceID: customSpaceID,
// 			UserID:        visitor.ID,
// 		}

// 		handler := capimiddleware.CheckSpaceMember(req, func(c *gin.Context, hasPms bool) {
// 			if !hasPms {
// 				httpErr := capierr.NewCustom403Err(c, apierr.AgentAPP_Forbidden_PermissionDenied, fmt.Sprintf("user %s has no permission to use custom space %s", visitor.ID, customSpaceID))

// 				rest.ReplyError(c, httpErr)
// 				c.Abort()

// 				return
// 			}
// 		})

// 		handler(c)

// 		c.Next()
// 	}
// }

func CheckAgentUsePmsInternal() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 方法3：使用 gin 的 GetRawData
		body, err := c.GetRawData()
		if err != nil {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] get raw data failed")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		var data map[string]interface{}
		if err := sonic.Unmarshal(body, &data); err != nil {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] unmarshal body failed")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		agentID := ""
		if agentValue, ok := data["agent_id"].(string); ok {
			agentID = agentValue
		} else if agentValue, ok := data["agent_key"].(string); ok {
			//NOTE: 通过AgentKey查询AgentID,一一对应与agent_version无关
			agent, err := httpinject.NewAgentFactoryHttpAcc().GetAgent(c.Request.Context(), agentValue, "latest")
			if err != nil {
				httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] get agent id by agent key failed")
				rest.ReplyError(c, httpErr)
				c.Abort()
				return
			}
			agentID = agent.ID
		} else {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] one of agent_id and agent_key is required,type must be string")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		// 重新设置请求体
		//NOTE: 读取完请求体后需要重新设置，否则后续的处理器无法读取
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))
		userID := c.Request.Header.Get("x-account-id")
		if userID == "" {
			httpErr := capierr.New401Err(c, "[CheckAgentUsePmsInternal] user not found")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		accountType := c.Request.Header.Get("x-account-type")
		//NOTE: 如果visitorType为空，则默认是实名用户
		if accountType == "" {
			accountType = "user"
		}

		req := &afhttpdto.CheckPmsReq{}
		if accountType == "app" {
			req = afhttpdto.NewCheckAgentUsePmsReq(agentID, "", userID)
		} else if accountType == "user" || accountType == "anonymous" {
			req = afhttpdto.NewCheckAgentUsePmsReq(agentID, userID, "")
		} else {
			httpErr := capierr.New400Err(c, "[CheckAgentUsePmsInternal] account type not found")
			rest.ReplyError(c, httpErr)
			c.Abort()
			return
		}
		handler := capimiddleware.CheckPms(req, func(c *gin.Context, hasPms bool) {
			if !hasPms {
				httpErr := capierr.NewCustom403Err(c, apierr.AgentAPP_Forbidden_PermissionDenied,
					fmt.Sprintf("user %s has no permission to use agent %s", userID, agentID))

				rest.ReplyError(c, httpErr)
				c.Abort()
				return
			}
		})

		handler(c)
		c.Next()
	}
}

// func CheckSpaceMemberInternal() gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		customSpaceID := c.Query("custom_space_id")
// 		userID := c.Request.Header.Get("x-account-id")
// 		if userID == "" {
// 			httpErr := capierr.New401Err(c, "[CheckSpaceMemberInternal] account id  not found")
// 			rest.ReplyError(c, httpErr)
// 			c.Abort()
// 			return
// 		}

// 		req := &cpmsreq.CheckIsCustomSpaceMemberReq{
// 			CustomSpaceID: customSpaceID,
// 			UserID:        userID,
// 		}

// 		handler := capimiddleware.CheckSpaceMember(req, func(c *gin.Context, hasPms bool) {
// 			if !hasPms {
// 				httpErr := capierr.NewCustom403Err(c, apierr.AgentAPP_Forbidden_PermissionDenied,
// 					fmt.Sprintf("user %s has no permission to use custom space %s", userID, customSpaceID))

// 				rest.ReplyError(c, httpErr)
// 				c.Abort()

// 				return
// 			}
// 		})

// 		handler(c)

// 		c.Next()
// 	}
// }
