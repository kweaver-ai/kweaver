package agentsvc

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"slices"
	"strings"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/constant"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/conversationmsgvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentexecutoraccess/agentexecutordto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/agentfactoryaccess/agentfactorydto"
	agentreq "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/req"
	agentresp "devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/driveradapter/api/rdto/agent/resp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/apierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/chelper"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/cutil"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/rest"
	"go.opentelemetry.io/otel/attribute"

	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
)

var (
	//NOTE: 终止channel map， 用于终止会话，key为会话ID，value为终止channel
	stopChanMap sync.Map = sync.Map{}
	//NOTE: session map，用于对话恢复，key为会话ID，value为session
	SessionMap sync.Map = sync.Map{}
	//NOTE: key 为assistantMessageID，value 为progress的数组,存储所有状态不为processing的progress，不重复
	// progressMap map[string][]*agentrespvo.Progress = make(map[string][]*agentrespvo.Progress)
	progressMap sync.Map = sync.Map{}
	//NOTE: key 为assistantMessageID，value 为map[srting]bool ,判断一个progress的ID是否已经存在
	// progressSet map[string]map[string]bool = make(map[string]map[string]bool)
	progressSet sync.Map = sync.Map{}
)

const (
	CHANNEL_SIZE = 100
)

// NOTE: 统一的chat服务
func (agentSvc *agentSvc) Chat(ctx context.Context, req *agentreq.ChatReq) (chan []byte, error) {
	var err error
	newCtx, _ := o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(newCtx, err)
	o11y.SetAttributes(newCtx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(newCtx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(newCtx, attribute.String("user_id", req.UserID))

	//NOTE: 1. 根据agentID 和agentVersion 获取agent配置
	//NOTE: Chat接口请求时，agentID 实际值为agentID, APIChat接口请求时，agentID 实际值为agentKey
	agent, err := agentSvc.agentFactory.GetAgent(newCtx, req.AgentID, req.AgentVersion)
	if err != nil {
		o11y.Error(newCtx, fmt.Sprintf("[chat] get agent failed: %v", err))
		return nil, rest.NewHTTPError(newCtx, http.StatusInternalServerError,
			apierr.AgentAPP_Agent_GetAgentFailed).WithErrorDetails(fmt.Sprintf("[chat] get agent failed: %v", err))
	}
	//NOTE：传递给AgentExecutor的agentID 前确保实际值为agentID
	req.AgentID = agent.ID
	//NOTE: 如果是apichat,但是没有发布成api agent，则返回403
	if req.CallType == constant.APIChat && agent.PublishInfo.IsAPIAgent == 0 {
		httpErr := capierr.NewCustom403Err(newCtx, apierr.AgentAPP_Forbidden_PermissionDenied, "[Chat] apichat is not published")
		return nil, httpErr
	}
	//NOTE: 2. 获取历史上下文
	conversationPO, contexts, msgIndex, err := agentSvc.GetHistoryAndMsgIndex(newCtx, req)
	if err != nil {
		o11y.Error(newCtx, fmt.Sprintf("[chat] get history and msg index failed: %v", err))
		return nil, err
	}
	//NOTE: 3. 插入用户消息和助手消息, 并返回userMessageID, assistantMessageID, assistantMessageIndex
	req.UserMessageID, req.AssistantMessageID, req.AssistantMessageIndex, err = agentSvc.UpsertUserAndAssistantMsg(newCtx, req, msgIndex, conversationPO)
	if err != nil {
		o11y.Error(newCtx, fmt.Sprintf("[chat] upsert user and assistant msg failed: %v", err))
		return nil, err
	}
	//NOTE: 4.  创建一个stop_channel 关联conversationID
	stopChan := make(chan struct{})
	stopChanMap.Store(req.ConversationID, stopChan)

	//NOTE: 5. 创建一个session 关联conversationID 用于会话恢复
	session := &Session{
		RWMutex:        sync.RWMutex{},
		ConversationID: req.ConversationID,
		TempMsgResp:    agentresp.ChatResp{},
		Signal:         nil,
		IsResuming:     false,
	}
	SessionMap.Store(req.ConversationID, session)

	progressMap.Store(req.AssistantMessageID, make([]*agentrespvo.Progress, 0))
	progressSet.Store(req.AssistantMessageID, make(map[string]bool, 0))

	//NOTE: 6. 生成agent call请求
	agentCallReq, err := agentSvc.GenerateAgentCallReq(newCtx, req, contexts, agent)
	if err != nil {
		agentSvc.logger.Errorf("[Chat] generate agent call req err: %v", err)
		o11y.Error(newCtx, fmt.Sprintf("[chat] generate agent call req err: %v", err))
		return nil, err
	}

	//NOTE: 调用agent-executor
	//创建一个不带取消的ctx，复制可观测性信息
	callCtx := context.WithoutCancel(ctx)
	//创建一个带取消的ctx，用于终止对话时取消agent-executor的请求
	cancelCtx, cancel := context.WithCancel(callCtx)
	agentCall := &AgentCall{
		callCtx:       cancelCtx,
		req:           agentCallReq,
		agentExecutor: agentSvc.agentExecutor,
		cancelFunc:    cancel,
	}
	messageChan, errChan, err := agentCall.Call()
	if err != nil {
		//NOTE: 发生错误，将assistantMessage 状态设置为failed
		conversationAssistantMsgPO, _ := agentSvc.conversationMsgRepo.GetByID(callCtx, req.AssistantMessageID)
		conversationAssistantMsgPO.Status = cdaenum.MsgStatusFailed
		agentSvc.conversationMsgRepo.Update(callCtx, conversationAssistantMsgPO)
		agentSvc.logger.Errorf("[Chat] call agent executor err: %v", err)
		o11y.Error(newCtx, fmt.Sprintf("[chat] call agent executor err: %v", err))
		return nil, rest.NewHTTPError(newCtx, http.StatusInternalServerError,
			apierr.AgentAPP_Agent_CallAgentExecutorFailed).WithErrorDetails(fmt.Sprintf("[chat] call agent executor err: %v", err))
	}

	//NOTE: 流式响应处理
	channel := make(chan []byte, CHANNEL_SIZE)

	go agentSvc.Process(req, agent, stopChan, channel, messageChan, errChan, agentCall.Cancel)
	return channel, nil
}

// NOTE: 流式处理, 接受agent-executor的返回结果,进行会话后处理，响应前端
func (agentSvc *agentSvc) Process(req *agentreq.ChatReq, agent agentfactorydto.Agent, stopChan chan struct{},
	respChan chan []byte, messageChan chan string, errChan chan error, cancelFunc func()) error {
	//NOTE: 记录开始时间
	startTime := time.Now()
	var err error
	//NOTE: 使用新的ctx，确保process协程能独立完成请求，不受外界影响
	ctx := context.Background()
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	//NOTE: process是对话的核心，process结束时关闭respChan
	defer close(respChan)
	lastData := []byte(`{}`)
	var currentData []byte
	var seq = new(int)
	*seq = 0
	isEnd := false
	var session *Session = &Session{}
	// failed := false
	var counter int = -1
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
			if len(parts) == 2 && parts[0] == "data" {
				message = parts[1]
			} else {
				agentSvc.logger.Errorf("[Process] the format of message is invalid,  msg: %v", msg)
				continue
			}
			//NOTE: message 是原始数据
			// currentData, isEnd, err = agentSvc.CallResult2MsgResp(ctx, []byte(message), req)
			currentData, isEnd, err = agentSvc.AfterProcess(ctx, []byte(message), req, &agent)
			if err != nil {
				agentSvc.logger.Errorf("[Process] after process err: %v", err)
				o11y.Error(ctx, fmt.Sprintf("[Process] after process err: %v", err))
				isEnd = true
				break looplabel
			}
			counter++
			if counter%agentSvc.streamDiffFrequency == 0 || isEnd {
				//NOTE: 这里的currentData 是newMsgResp
				var val agentresp.ChatResp
				err = sonic.Unmarshal(currentData, &val)
				if err != nil {
					agentSvc.logger.Errorf("[Process] unmarshal currentData err: %v", err)
					o11y.Error(ctx, fmt.Sprintf("[Process] unmarshal currentData err: %v", err))
				}
				sessionInterface, ok := SessionMap.Load(req.ConversationID)
				if !ok {
					agentSvc.logger.Errorf("[Process] session not found")
					isEnd = true
					break looplabel
				}
				session = sessionInterface.(*Session)
				session.UpdateTempMsgResp(val)
				SessionMap.Store(req.ConversationID, session)
				if isEnd {
					session.CloseSignal()
				} else {
					session.SendSignal()
				}
				if req.Stream {
					if req.IncStream {
						err := StreamDiff(ctx, seq, lastData, currentData, respChan)
						if err != nil {
							agentSvc.logger.Errorf("[Process] parse event stream message err: %v", err)
							o11y.Error(ctx, fmt.Sprintf("[Process] parse event stream message err: %v", err))
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
			}

		case err, more := <-errChan:
			if !more {
				isEnd = true
				break looplabel
			}
			if req.Stream {
				if err.Error() != "unexpected EOF" && err.Error() != "EOF" {
					errMsg := rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(err.Error())
					errBytes, _ := sonic.Marshal(errMsg)
					respChan <- formatSSEMessage(string(errBytes))
				}
				if err.Error() == "unexpected EOF" || err.Error() == "EOF" {
					isEnd = true
					break looplabel
				}
			} else {
				httpErr := rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(err.Error())
				errBytes, _ := sonic.Marshal(httpErr)
				respChan <- errBytes
			}
		case <-stopChan:
			isEnd = true
			err := agentSvc.HandleStopChan(ctx, req, session)
			if err != nil {
				agentSvc.logger.Errorf("[Process] handle stop chan err: %v", err)
				o11y.Error(ctx, fmt.Sprintf("[Process] handle stop chan err: %v", err))
			}
			//NOTE: 取消agent-executor的请求,中断大模型输出
			cancelFunc()
			agentSvc.logger.Infof("[Process] handle stop chan success")
			break looplabel
		case <-time.After(5 * time.Second):
			agentSvc.logger.Debugf("[Process] get msg from messageChan timeout 5s")
		}
	}
	if err != nil {
		//NOTE: 发生错误，将assistantMessage 状态设置为failed
		conversationAssistantMsgPO, errNew := agentSvc.conversationMsgRepo.GetByID(ctx, req.AssistantMessageID)
		if errNew != nil {
			agentSvc.logger.Errorf("[Process] get conversation assistant message failed: %v", errNew)
			o11y.Error(ctx, fmt.Sprintf("[Process] get conversation assistant message failed: %v", errNew))
		}
		conversationAssistantMsgPO.Status = cdaenum.MsgStatusFailed
		agentSvc.conversationMsgRepo.Update(ctx, conversationAssistantMsgPO)

		//NOTE: 分类讨论
		if req.Stream {
			//NOTE: 如果err不为nil，则把err写入到respChan,是chatresponse结构，可以携带正确数据的信息
			StreamDiff(ctx, seq, lastData, currentData, respChan)
		} else {
			//NOTE: 非流式处理，直接返回err，直接是错误码，无法携带正确数据信息
			httpErr := rest.NewHTTPError(ctx, http.StatusInternalServerError, apierr.AgentAPP_InternalError).WithErrorDetails(err.Error())
			errBytes, _ := sonic.Marshal(httpErr)
			respChan <- errBytes
		}

	}
	if isEnd {
		session.CloseSignal()
		SessionMap.Delete(req.ConversationID)
		stopChanMap.Delete(req.ConversationID)
		progressMap.Delete(req.AssistantMessageID)
		progressSet.Delete(req.AssistantMessageID)
		if req.Stream {
			emitJSON(seq, respChan, []interface{}{}, nil, "end")
		}

	}
	//NOTE: 记录结束时间
	processTime := time.Since(startTime)
	//NOTE: 打印处理时间，ms
	agentSvc.logger.Infof("[Process] chat process time: %d ms", processTime.Milliseconds())
	return nil
}

// NOTE: 将msgResp转换为msgPO
func (agentSvc *agentSvc) MsgResp2MsgPO(ctx context.Context, msgResp agentresp.ChatResp, req *agentreq.ChatReq) (dapo.ConversationMsgPO, bool, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	content, err := sonic.Marshal(msgResp.Message.Content)

	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[MsgResp2MsgPO] marshal msgResp.Message.Content err: %v", err))
		return dapo.ConversationMsgPO{}, false, errors.Wrapf(err, "[MsgResp2MsgPO] marshal msgResp.Message.Content err")
	}
	ext, err := sonic.Marshal(msgResp.Message.Ext)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[MsgResp2MsgPO] marshal msgResp.Message.Ext err: %v", err))
		return dapo.ConversationMsgPO{}, false, errors.Wrapf(err, "[MsgResp2MsgPO] marshal msgResp.Message.Ext err")
	}
	contentStr := string(content)
	extStr := string(ext)
	msgPO := dapo.ConversationMsgPO{
		ID:             req.AssistantMessageID,
		AgentAPPKey:    req.AgentAPPKey,
		ConversationID: msgResp.ConversationID,
		AgentID:        req.AgentID,
		AgentVersion:   req.AgentVersion,
		ReplyID:        req.UserMessageID,
		Role:           cdaenum.MsgRoleAssistant,
		Index:          req.AssistantMessageIndex,

		//Repo更新字段
		Content:     &contentStr,
		ContentType: cdaenum.ConversationMsgContentType(msgResp.Message.ContentType),
		Status:      cdaenum.MsgStatusSucceded,
		Ext:         &extStr,
		UpdateTime:  cutil.GetCurrentMSTimestamp(),
		UpdateBy:    req.UserID,
	}

	return msgPO, false, nil
}

// NOTE: 获取会话中的上下文、会话中消息的最大下标、更新req.ConversationID
func (agentSvc *agentSvc) GetHistoryAndMsgIndex(ctx context.Context, req *agentreq.ChatReq) (*dapo.ConversationPO, []*comvalobj.LLMMessage, int, error) {
	var contexts []*comvalobj.LLMMessage
	var conversationPO *dapo.ConversationPO
	var msgIndex int
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	//NOTE: 从前端请求的conversationID不为空，接口可能为空;
	//NOTE: 如果会话ID为空，则创建新会话；
	if req.ConversationID == "" {
		conversationPO = &dapo.ConversationPO{
			AgentAPPKey: req.AgentAPPKey,
			Title:       "新会话", // todo
			CreateBy:    req.UserID,
			UpdateBy:    req.UserID,
			Ext:         new(string),
		}
		//NOTE: 如果query不为空，则更新会话标题
		if req.Query != "" {
			//NOTE: 用query 的前50个字符作为会话标题，如果query长度小于50个字符，则用query作为会话标题
			// 使用 []rune 来处理 Unicode 字符
			runes := []rune(req.Query)
			if len(runes) < 50 {
				conversationPO.Title = string(runes)
			} else {
				conversationPO.Title = string(runes[:50])
			}
		}
		conversationPO, err = agentSvc.conversationRepo.Create(ctx, conversationPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[GetHistoryAndMsgIndex] create conversation failed: %v", err))
			return nil, nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_CreateConversationFailed).WithErrorDetails(fmt.Sprintf("[GetHistoryAndMsgIndex] create conversation failed: %v", err))
		}
		req.ConversationID = conversationPO.ID

	} else {
		//获取对话
		conversationPO, err = agentSvc.conversationRepo.GetByID(ctx, req.ConversationID)
		if err != nil {

			if chelper.IsSqlNotFound(err) {
				o11y.Warn(ctx, fmt.Sprintf("[GetHistoryAndMsgIndex] conversation not found: %v", err))
				return nil, nil, 0, rest.NewHTTPError(ctx, http.StatusNotFound,
					apierr.AgentAPP_Agent_GetConversationFailed).WithErrorDetails(fmt.Sprintf("[GetHistoryAndMsgIndex] conversation not found: %v", err))
			}
			o11y.Error(ctx, fmt.Sprintf("[GetHistoryAndMsgIndex] get conversation failed: %v", err))
			return nil, nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetConversationFailed).WithErrorDetails(fmt.Sprintf("[GetHistoryAndMsgIndex] get conversation failed: %v", err))
		}
		//NOTE: 获取会话中消息的最大下标，后续创建新消息时需要在这基础上递增
		msgIndex, err = agentSvc.conversationMsgRepo.GetMaxIndexByID(ctx, req.ConversationID)
		if err != nil {
			//NOTE：当前会话未产生消息
			if chelper.IsSqlNotFound(err) {
				msgIndex = 0
			} else {
				o11y.Error(ctx, fmt.Sprintf("[GetHistoryAndMsgIndex] get max index failed: %v", err))
				return nil, nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					apierr.AgentAPP_Agent_GetMaxIndexFailed).WithErrorDetails(fmt.Sprintf("[GetHistoryAndMsgIndex] get max index failed: %v", err))
			}
		}
		//NOTE: 获取历史上下文，-1表示获取所有历史上下文
		contexts, err = agentSvc.conversationSvc.GetHistory(ctx, req.ConversationID, req.HistoryLimit, req.RegenerateUserMsgID, req.RegenerateAssistantMsgID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[GetHistoryAndMsgIndex] get conversation messages history failed: %v", err))
			return nil, nil, 0, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetHistoryFailed).WithErrorDetails(fmt.Sprintf("[GetHistoryAndMsgIndex] get conversation messages history failed: %v", err))
		}
	}
	return conversationPO, contexts, msgIndex, nil
}

// NOTE: 插入用户消息和助手消息
func (agentSvc *agentSvc) UpsertUserAndAssistantMsg(ctx context.Context, req *agentreq.ChatReq,
	msgIndex int, conversationPO *dapo.ConversationPO) (string, string, int, error) {

	userMessageID := ""
	assistantMessageID := ""
	assistantMessageIndex := 0
	var conversationUserMsgPO *dapo.ConversationMsgPO
	var conversationAssistantMsgPO *dapo.ConversationMsgPO
	var err error
	//NOTE: ctx变量名
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	//NOTE: 普通对话则创建userMessage,状态为recieved
	if IsNormalChat(req) {
		userContent := conversationmsgvo.UserContent{
			Text:      req.Query,
			TempFiles: req.TempFiles,
		}
		userContentBytes, _ := sonic.Marshal(userContent)
		userContentStr := string(userContentBytes)
		conversationUserMsgPO = &dapo.ConversationMsgPO{
			ConversationID: req.ConversationID,
			AgentAPPKey:    req.AgentAPPKey,
			AgentID:        req.AgentID,
			AgentVersion:   req.AgentVersion,
			Index:          msgIndex + 1,
			Role:           cdaenum.MsgRoleUser,
			Content:        &userContentStr,
			ContentType:    cdaenum.MsgText,
			Status:         cdaenum.MsgStatusProcessed,
			Ext:            new(string),
			CreateBy:       req.UserID,
			UpdateBy:       req.UserID,
		}
		userMessageID, err = agentSvc.conversationMsgRepo.Create(ctx, conversationUserMsgPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] create conversation user message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_CreateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] create conversation user message failed: %v", err))
		}
		// 更新会话下标
		conversationPO.MessageIndex = conversationUserMsgPO.Index
		err = agentSvc.conversationRepo.Update(ctx, conversationPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_UpdateConversationFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation failed: %v", err))
		}
	} else if req.RegenerateUserMsgID != "" {
		//如果是编辑问题，则更新userMessage
		userMessageID = req.RegenerateUserMsgID
		conversationUserMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, req.RegenerateUserMsgID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation user message [%s] failed: %v", req.RegenerateUserMsgID, err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation user message [%s] failed: %v", req.RegenerateUserMsgID, err))
		}
		userContent := conversationmsgvo.UserContent{
			Text:      req.Query,
			TempFiles: req.TempFiles,
		}
		userContentBytes, _ := sonic.Marshal(userContent)
		userContentStr := string(userContentBytes)
		conversationUserMsgPO.Content = &userContentStr
		conversationUserMsgPO.Status = cdaenum.MsgStatusReceived
		conversationUserMsgPO.UpdateBy = req.UserID
		conversationUserMsgPO.UpdateTime = cutil.GetCurrentMSTimestamp()
		err = agentSvc.conversationMsgRepo.Update(ctx, conversationUserMsgPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation user message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_UpdateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation user message failed: %v", err))
		}
	} else {
		//NOTE: 如果是重新生成或者中断，则获取userMessageID
		if req.RegenerateAssistantMsgID != "" {
			conversationAssistantMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, req.RegenerateAssistantMsgID)
			if err != nil {
				o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.RegenerateAssistantMsgID, err))
				return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.RegenerateAssistantMsgID, err))
			}

		} else {
			conversationAssistantMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, req.InterruptedAssistantMsgID)
			if err != nil {
				o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.InterruptedAssistantMsgID, err))
				return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
					apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.InterruptedAssistantMsgID, err))
			}
		}
		userMessageID = conversationAssistantMsgPO.ReplyID
	}

	//NOTE: 如果req.RegenerateAssistantMsgID 和 req.InterruptedAssistantMsgID 和req.RegenerateUserMsgID == ""都为空，说明当前为普通对话，只需要创建assistantMessage,状态为processing 持久化
	if IsNormalChat(req) {

		conversationAssistantMsgPO = &dapo.ConversationMsgPO{
			ConversationID: req.ConversationID,
			AgentAPPKey:    req.AgentAPPKey,
			AgentID:        req.AgentID,
			AgentVersion:   req.AgentVersion,
			ReplyID:        conversationUserMsgPO.ID,
			Index:          conversationUserMsgPO.Index + 1,
			Role:           cdaenum.MsgRoleAssistant,
			Content:        new(string),
			ContentType:    cdaenum.MsgText,
			Status:         cdaenum.MsgStatusProcessing,
			Ext:            new(string),
			CreateBy:       req.UserID,
			UpdateBy:       req.UserID,
			UpdateTime:     cutil.GetCurrentMSTimestamp(),
		}
		//NOTE: 只创建assistantMessage 不更新会话下标，会话下标在对话完成时更新
		assistantMessageID, err = agentSvc.conversationMsgRepo.Create(ctx, conversationAssistantMsgPO)
		assistantMessageIndex = conversationAssistantMsgPO.Index
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] create conversation assistant message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_CreateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] create conversation assistant message failed: %v", err))
		}
	} else if req.RegenerateAssistantMsgID != "" {
		//NOTE: 如果是重新生成
		conversationAssistantMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, req.RegenerateAssistantMsgID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.RegenerateAssistantMsgID, err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.RegenerateAssistantMsgID, err))
		}
		//NOTE: 重新生成将assistantMessage 状态设置为processing
		conversationAssistantMsgPO.Status = cdaenum.MsgStatusProcessing
		err = agentSvc.conversationMsgRepo.Update(ctx, conversationAssistantMsgPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_UpdateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
		}
		assistantMessageID = req.RegenerateAssistantMsgID
		assistantMessageIndex = conversationAssistantMsgPO.Index
	} else if req.InterruptedAssistantMsgID != "" {
		//NOTE: 如果是中断
		conversationAssistantMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, req.InterruptedAssistantMsgID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.InterruptedAssistantMsgID, err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", req.InterruptedAssistantMsgID, err))
		}
		//NOTE: 中断将将assistantMessage 状态设置为processing
		conversationAssistantMsgPO.Status = cdaenum.MsgStatusProcessing
		err = agentSvc.conversationMsgRepo.Update(ctx, conversationAssistantMsgPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_UpdateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
		}
		assistantMessageID = req.InterruptedAssistantMsgID
		assistantMessageIndex = conversationAssistantMsgPO.Index
	} else if req.RegenerateUserMsgID != "" {
		//NOTE: 如果是编辑用户消息
		//TODO: 后续版本优，同时考虑多版本消息设计
		conversation, err := agentSvc.conversationSvc.Detail(ctx, req.ConversationID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetConversationFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation failed: %v", err))
		}
		for index, msg := range conversation.Messages {
			if msg.ID == req.RegenerateUserMsgID {
				assistantMessageID = conversation.Messages[index+1].ID
				assistantMessageIndex = conversation.Messages[index+1].Index
				break
			}
		}
		//NOTE: 编辑用户消息将assistantMessage 状态设置为processing
		conversationAssistantMsgPO, err = agentSvc.conversationMsgRepo.GetByID(ctx, assistantMessageID)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", assistantMessageID, err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_GetMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] get conversation assistant message [%s] failed: %v", assistantMessageID, err))
		}
		conversationAssistantMsgPO.Status = cdaenum.MsgStatusProcessing
		err = agentSvc.conversationMsgRepo.Update(ctx, conversationAssistantMsgPO)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
			return userMessageID, assistantMessageID, assistantMessageIndex, rest.NewHTTPError(ctx, http.StatusInternalServerError,
				apierr.AgentAPP_Agent_UpdateMessageFailed).WithErrorDetails(fmt.Sprintf("[UpsertUserAndAssistantMsg] update conversation assistant message failed: %v", err))
		}
	}
	return userMessageID, assistantMessageID, assistantMessageIndex, nil
}

func (agentSvc *agentSvc) GenerateAgentCallReq(ctx context.Context, req *agentreq.ChatReq, contexts []*comvalobj.LLMMessage, agent agentfactorydto.Agent) (*agentexecutordto.AgentCallReq, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	//NOTE: 如果req.ChatMode不为空，则设置req.ChatMode
	if req.ChatMode != constant.DeepThinkingMode {
		req.ChatMode = constant.NormalMode
	}
	if contexts == nil {
		contexts = []*comvalobj.LLMMessage{}
	}
	//NOTE: 如果req.History不为空，应该直接使用req.History
	if len(req.History) > 0 {
		contexts = req.History
	}
	//NOTE: 动态字段 file  和 自定义变量
	agentCallReq := &agentexecutordto.AgentCallReq{
		ID:           req.AgentID,
		AgentVersion: req.AgentVersion,
		Config:       AgentConfig2AgentCallConfig(ctx, &agent.Config, req),
		Input: map[string]interface{}{
			"query":        req.Query,
			"history":      contexts,
			"tool":         req.Tool,
			"confirm_plan": req.ConfirmPlan,
		},
		CallType:          req.CallType,
		ExecutorVersion:   req.ExecutorVersion,
		XAccountID:        req.XAccountID,
		XAccountType:      req.XAccountType,
		XBusinessDomainID: req.XBusinessDomainID,
	}
	//NOTE: 将agent.Config.Input.Fields 转换为map，排除一些内置参数
	excludeFields := []string{"history", "query", "header", "tool", "self_config"}
	for _, field := range agent.Config.Input.Fields {
		if field.Type == "file" {
			agentCallReq.Input[field.Name] = req.TempFiles
			continue
		}
		//NOTE: 如果field.Name为内置参数则不进行处理
		if slices.Contains(excludeFields, field.Name) {
			continue
		}
		//NOTE: 如果field.Name为自定义参数，则将req.CustomQuerys[field.Name]赋值给agentCallReq.Input[field.Name]
		agentCallReq.Input[field.Name] = req.CustomQuerys[field.Name]
	}

	//NOTE:根据请求参数切换深度思考大模型
	if req.ChatMode == constant.DeepThinkingMode {
		agentSvc.logger.Infof("[GenerateAgentCallReq] deep_thinking")
		//NOTE: 先将默认的llm设置为false
		for _, llm := range agentCallReq.Config.Llms {
			if llm.IsDefault && llm.LlmConfig.ModelType == cdaenum.ModelTypeLlm {
				llm.IsDefault = false
			}
		}
		//NOTE: 将rlm设置为默认
		for _, llm := range agentCallReq.Config.Llms {
			if llm.LlmConfig.ModelType == cdaenum.ModelTypeRlm {
				llm.IsDefault = true
				break
			}
		}
	}
	//NOTE: 重新生成时调整大模型温度参数
	if req.RegenerateAssistantMsgID != "" {
		//NOTE: 如果传了modelname，则修改对应大模型的温度，否则修改默认大模型的温度
		if req.ModelName != "" {
			for _, llm := range agentCallReq.Config.Llms {
				if llm.LlmConfig.Name == req.ModelName {
					llm.LlmConfig.Temperature = math.Max(llm.LlmConfig.Temperature, 0.8)
					if llm.LlmConfig.TopK < 10 {
						llm.LlmConfig.TopK = 10
					}
					break
				}
			}
		} else {
			for _, llm := range agentCallReq.Config.Llms {
				if llm.IsDefault {
					llm.LlmConfig.Temperature = math.Max(llm.LlmConfig.Temperature, 0.8)
					if llm.LlmConfig.TopK < 10 {
						llm.LlmConfig.TopK = 10
					}
					break
				}
			}
		}
	}
	//NOTE: 鉴权
	agentCallReq.UserID = req.UserID
	agentCallReq.Token = req.Token
	agentCallReq.VisitorType = req.VisitorType

	return agentCallReq, nil
}

// NOTE: 处理终止信号，对话终止时，进行 助手消息的持久化
func (agentSvc *agentSvc) HandleStopChan(ctx context.Context, req *agentreq.ChatReq, session *Session) error {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("agent_id", req.AgentID))
	o11y.SetAttributes(ctx, attribute.String("agent_run_id", req.AgentRunID))
	o11y.SetAttributes(ctx, attribute.String("user_id", req.UserID))
	msgResp := session.GetTempMsgResp()
	bytes, _ := sonic.Marshal(msgResp)
	var resp agentresp.ChatResp
	err = sonic.Unmarshal(bytes, &resp)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[HandleStopChan] unmarshal msgResp err: %v", err))
		return errors.Wrapf(err, "[HandleStopChan] unmarshal msgResp err")
	}

	//NOTE: 将msgResp转换为msgPO
	msgPO, _, err := agentSvc.MsgResp2MsgPO(ctx, resp, req)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[HandleStopChan] convert msgResp to msgPO err: %v", err))
		return errors.Wrapf(err, "[HandleStopChan] convert msgResp to msgPO err")
	}
	msgPO.Status = cdaenum.MsgStatusCancelled
	msgPO.UpdateTime = cutil.GetCurrentMSTimestamp()
	err = agentSvc.conversationMsgRepo.Update(ctx, &msgPO)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[HandleStopChan] update msgPO err: %v", err))
		return errors.Wrapf(err, "[HandleStopChan] update msgPO err")
	}
	//更新会话
	conversationPO, err := agentSvc.conversationRepo.GetByID(ctx, req.ConversationID)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[HandleStopChan] get conversationPO err: %v", err))
		return errors.Wrapf(err, "[HandleStopChan] get conversationPO err")
	}
	conversationPO.UpdateTime = cutil.GetCurrentMSTimestamp()
	conversationPO.MessageIndex = msgPO.Index
	err = agentSvc.conversationRepo.Update(ctx, conversationPO)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[HandleStopChan] update conversationPO err: %v", err))
		return errors.Wrapf(err, "[HandleStopChan] update conversationPO err")
	}
	o11y.Info(ctx, "[HandleStopChan] terminate chat success")
	return nil
}

// NOTE: 如果req.RegenerateAssistantMsgID 和 req.InterruptedAssistantMsgID 和req.RegenerateUserMsgID == ""都为空，
func IsNormalChat(req *agentreq.ChatReq) bool {
	return req.RegenerateAssistantMsgID == "" && req.InterruptedAssistantMsgID == "" && req.RegenerateUserMsgID == ""
}
