package agentsvc

import (
	"context"
	"net/http"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	agentexecutordto "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"github.com/bytedance/sonic"
)

func (agentSvc *agentSvc) Debug(ctx context.Context, req *agentreq.DebugReq) (chan []byte, error) {

	agent, err := agentSvc.agentFactory.GetAgent(ctx, req.AgentID, req.AgentVersion)
	if err != nil {
		return nil, err
	}

	agentDebugReq := &agentexecutordto.AgentDebugReq{
		ID:     req.AgentID,
		Config: AgentConfig2AgentCallConfigDebug(ctx, &agent.Config, req),
		// Input:  req.Input,
		Input: map[string]interface{}{
			"query": req.Input.Query,
			// "file":    req.Input.TempFiles,
			"history": req.Input.History,
			"tool":    req.Input.Tool,
		},
	}
	for _, field := range agent.Config.Input.Fields {
		if field.Type == "file" {
			agentDebugReq.Input[field.Name] = req.Input.TempFiles
			continue
		}
		if field.Name == "history" || field.Name == "query" || field.Name == "header" || field.Name == "tool" || field.Name == "self_config" {
			// agentDebugReq.Input[field.Name] = contexts
			continue
		}
		//NOTE: 如果field.Name为自定义参数，则将req.CustomQuerys[field.Name]赋值给agentDebugReq.Input[field.Name]
		agentDebugReq.Input[field.Name] = req.Input.CustomQuerys[field.Name]
	}

	//NOTE:根据请求参数切换深度思考大模型
	if req.ChatMode == constant.DeepThinkingMode {
		for _, llm := range agentDebugReq.Config.Llms {
			if llm.IsDefault && llm.LlmConfig.ModelType != cdaenum.ModelTypeLlm {
				llm.IsDefault = false
			}
		}
		for _, llm := range agentDebugReq.Config.Llms {
			if llm.LlmConfig.ModelType == cdaenum.ModelTypeRlm {
				llm.IsDefault = true
				break
			}
		}
	}

	channel := make(chan []byte)
	agentDebugReq.UserID = req.UserID
	agentDebugReq.Token = req.Token
	messageChan, errChan, err := agentSvc.agentExecutor.Debug(ctx, agentDebugReq)
	if err != nil {
		return nil, err
	}
	newCtx := context.Background()
	go agentSvc.DebugProcess(newCtx, req, channel, messageChan, errChan)
	return channel, nil
}

func (agentSvc *agentSvc) DebugProcess(ctx context.Context, req *agentreq.DebugReq, respChan chan []byte, messageChan chan string, errChan chan error) error {
	defer close(respChan)
	lastData := []byte(`{}`)
	var currentData []byte
	var err error
	var seq = new(int)
	*seq = 0
	isEnd := false
looplabel:
	for {
		select {
		case msg, more := <-messageChan:
			if !more {
				//NOTE: 如果channel不关闭，则会导致channel阻塞
				isEnd = true
				break looplabel
			}
			var message string
			parts := strings.SplitN(msg, ":", 2)
			if len(parts) == 2 && (parts[0] == "data" || parts[0] == "error") {
				message = parts[1]
			} else {
				isEnd = true
				break looplabel
			}
			if message == "end" {
				isEnd = true
				break looplabel
			}
			currentData, isEnd, err = agentSvc.DebugAfterProcess(ctx, []byte(message), req)
			if err != nil {
				isEnd = true
				break looplabel
			}
			if req.Stream {
				if req.IncStream {
					err := StreamDiff(ctx, seq, lastData, currentData, respChan)
					if err != nil {
						agentSvc.logger.Errorf("[DebugProcess] parse event stream message err: %v", err)
					}
					lastData = currentData
				} else {
					respChan <- formatSSEMessage(string(currentData))
				}
			} else {
				//NOTE: 非流式处理
				respChan <- currentData
			}
			//NOTE: 如果isEnd为true，则结束,需要先stream diff，再结束，否则丢失最后一次的信息
			if isEnd {
				break looplabel
			}

		case err, more := <-errChan:
			if !more {
				isEnd = true
				break looplabel
			}
			if err.Error() != "unexpected EOF" && err.Error() != "EOF" {
				errMsg := capierr.New500Err(ctx, err.Error())
				errBytes, _ := sonic.Marshal(errMsg)
				respChan <- formatSSEMessage(string(errBytes))
			}
			if err.Error() == "unexpected EOF" || err.Error() == "EOF" {
				isEnd = true
				break looplabel
			}
		}
	}
	if err != nil {
		//NOTE: 分类讨论
		if req.Stream {
			//NOTE: 如果err不为nil，则把err写入到respChan
			//NOTE: 这里目前来说不会有错
			StreamDiff(ctx, seq, lastData, currentData, respChan)
		} else {
			//NOTE: 非流式处理，直接返回err
			httpErr := rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(err.Error())
			errBytes, _ := sonic.Marshal(httpErr)
			respChan <- errBytes
		}
	}
	if isEnd {
		if req.Stream {
			emitJSON(seq, respChan, []interface{}{}, nil, "end")
		}
	}
	return nil
}

func (agentSvc *agentSvc) DebugAfterProcess(ctx context.Context, callResult []byte, req *agentreq.DebugReq) ([]byte, bool, error) {
	var newData []byte
	var err error
	var isEnd bool
	newData = callResult

	return newData, isEnd, err
}
