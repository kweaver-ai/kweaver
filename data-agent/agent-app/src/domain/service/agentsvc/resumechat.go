package agentsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/common/capierr"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/bytedance/sonic"
	"go.opentelemetry.io/otel/attribute"
)

func (agentSvc *agentSvc) ResumeChat(ctx context.Context, conversationID string) (chan []byte, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("conversation_id", conversationID))
	sessionInterface, ok := SessionMap.Load(conversationID)
	if !ok {
		o11y.Error(ctx, fmt.Sprintf("[ResumeChat] conversation_id %s not found", conversationID))
		agentSvc.logger.Errorf("[ResumeChat] conversation_id %s not found", conversationID)
		return nil, capierr.New400Err(ctx, "conversation_id not found")
	}
	session := sessionInterface.(*Session)
	session.Lock()
	defer session.Unlock()
	session.IsResuming = true
	//NOTE: 注册一个channel
	signal := make(chan struct{})
	if session.Signal == nil {
		session.Signal = signal
		SessionMap.Store(conversationID, session)
	} else {
		signal = session.Signal
	}
	channel := make(chan []byte)

	go func() {
		defer close(channel)
		oldResp := []byte(`{}`)
		seq := new(int)
		*seq = 0

		sessionInterface, ok := SessionMap.Load(conversationID)
		if !ok {
			o11y.Error(ctx, fmt.Sprintf("[ResumeChat] conversation_id %s not found", conversationID))
			agentSvc.logger.Errorf("[ResumeChat] conversation_id %s not found", conversationID)
			return
		}
		session := sessionInterface.(*Session)
		signal = session.GetSignal()
		newResp, err := sonic.Marshal(session.GetTempMsgResp())
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[ResumeChat] marshal temp msg resp err: %v", err))
			agentSvc.logger.Errorf("[ResumeChat] marshal temp msg resp err: %v", err)
			return
		}
		//NOTE:先发送一次,把当前的tempMsgResp发送出去
		if newResp != nil {
			if err := StreamDiff(ctx, seq, oldResp, newResp, channel); err != nil {
				o11y.Error(ctx, fmt.Sprintf("[ResumeChat] stream diff err: %v", err))
				agentSvc.logger.Errorf("[ResumeChat] stream diff err: %v", err)
				return
			}
		}

		//NOTE: 监听信号，直到关闭
		for _, ok := <-signal; ok; _, ok = <-signal {
			//NOTE: 每当收到信号，就发送一条消息
			newResp, err := sonic.Marshal(session.GetTempMsgResp())
			if err != nil {
				o11y.Error(ctx, fmt.Sprintf("[ResumeChat] marshal temp msg resp err: %v", err))
				agentSvc.logger.Errorf("[ResumeChat] marshal temp msg resp err: %v", err)
				break
			}
			if len(oldResp) == 0 {
				oldResp = newResp
			} else {
				if err := StreamDiff(ctx, seq, oldResp, newResp, channel); err != nil {
					o11y.Error(ctx, fmt.Sprintf("[ResumeChat] stream diff err: %v", err))
					agentSvc.logger.Errorf("[ResumeChat] stream diff err: %v", err)
					break
				}
				oldResp = newResp
			}
		}
		emitJSON(seq, channel, []interface{}{}, nil, "end")
	}()

	return channel, nil
}
