package agentsvc

import (
	"context"
	"fmt"

	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/static"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/pkg/errors"
	"go.opentelemetry.io/otel/attribute"
)

func (agentSvc *agentSvc) GetAPIDoc(ctx context.Context, req *agentreq.GetAPIDocReq) (interface{}, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_version", req.AgentVersion))

	agent, err := agentSvc.agentFactory.GetAgent(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetAPIDoc] get agent failed: %v", err))
		return nil, errors.Wrapf(err, "[GetAPIDoc] get agent failed: %v", err)
	}
	// 读取api文档模版并解析为openapi3类型
	loader := openapi3.NewLoader()

	docByte, err := static.StaticFiles.ReadFile("agent-api.json")
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetAPIDoc] read file failed: %v", err))
		return nil, errors.Wrapf(err, "[GetAPIDoc] read file failed: %v", err)
	}

	apiDoc, err := loader.LoadFromData(docByte)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetAPIDoc] load api doc err: %v", err))
		return nil, errors.Wrapf(err, "[GetAPIDoc] load api doc err: %v", err)
	}

	// 取这个接口的配置
	pathItem := apiDoc.Paths.Value("/api/agent-app/v1/app/{app_key}/api/chat/completion")
	pathItem.Post.Summary = agent.Name

	if agent.Profile != "" {
		pathItem.Post.Description = agent.Profile
	}

	// 取请求体
	chatRequest := apiDoc.Components.Schemas["ChatRequest"]
	// 初始化示例
	reqExample := make(map[string]interface{})
	reqExample["custom_querys"] = make(map[string]interface{})

	for _, input := range agent.Config.Input.Fields {
		if input.Name == "history" {
			reqExample[input.Name] = []map[string]string{}
		} else {
			if input.Name == "query" {
				// query的默认值
				reqExample[input.Name] = "在这里输入的问题"
				chatRequest.Value.Properties[input.Name] = &openapi3.SchemaRef{
					Ref: "",
					Value: &openapi3.Schema{
						Type:        &openapi3.Types{openapi3.TypeString},
						Description: "用户输入的问题",
					},
				}
			} else {
				if input.Type == "object" {
					//空结构体
					reqExample["custom_querys"].(map[string]interface{})[input.Name] = make(map[string]interface{})
					chatRequest.Value.Properties[input.Name] = &openapi3.SchemaRef{
						Ref: "",
						Value: &openapi3.Schema{
							Type:        &openapi3.Types{openapi3.TypeObject},
							Description: "用户自定义的输入参数",
						},
					}
				} else if input.Type == "string" {
					reqExample["custom_querys"].(map[string]interface{})[input.Name] = "在这里输入参数内容"
					chatRequest.Value.Properties[input.Name] = &openapi3.SchemaRef{
						Ref: "",
						Value: &openapi3.Schema{
							Type:        &openapi3.Types{openapi3.TypeString},
							Description: "用户自定义的输入参数",
						},
					}
				}
			}
		}
	}
	if len(reqExample["custom_querys"].(map[string]interface{})) == 0 {
		delete(reqExample, "custom_querys")
	}
	reqExample["stream"] = false
	reqExample["agent_version"] = agent.Version
	reqExample["agent_key"] = agent.Key
	pathItem.Post.RequestBody.Value.Content["application/json"].Example = reqExample
	pathItem.Post.RequestBody.Value.Content["application/json"].Schema = chatRequest

	return apiDoc, nil
}
