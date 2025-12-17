package conversationsvc

import (
	"context"
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/comvalobj"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/conversationmsgvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/persistence/dapo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/domain/enum/cdaenum"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
	"go.opentelemetry.io/otel/attribute"
)

func (svc *conversationSvc) GetHistory(ctx context.Context, id string, limit int, regenerateUserMsgID string,
	regenerateAssistantMsgID string) ([]*comvalobj.LLMMessage, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	o11y.SetAttributes(ctx, attribute.String("conversation_id", id))
	//NOTE:获取会话详情
	conversation, err := svc.Detail(ctx, id)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[GetHistory] get conversation detail error, id: %s, err: %v", id, err))
		return nil, errors.Wrapf(err, "[GetHistory] get conversation detail error, id: %s, err: %v", id, err)
	}

	//NOTE: 提取会话中的历史上下文
	history := make([]*comvalobj.LLMMessage, 0)
	userMsgID, assistantMsgID := GetID(ctx, conversation.Messages, regenerateUserMsgID, regenerateAssistantMsgID)
	for _, msg := range conversation.Messages {
		if msg.ID == userMsgID || msg.ID == assistantMsgID {
			break
		}
		if msg.Role == cdaenum.MsgRoleAssistant {
			content := conversationmsgvo.AssistantContent{}
			//NOTE: 不能将空字符串反序列化，否则会报错
			if msg.Content != nil && *msg.Content != "" {
				err := sonic.Unmarshal([]byte(*msg.Content), &content)
				if err != nil {
					o11y.Error(ctx, fmt.Sprintf("[GetHistory] unmarshal assistant content error, id: %s, err: %v", id, err))
					return nil, errors.Wrapf(err, "[GetHistory] unmarshal assistant content error, id: %s, err: %v", id, err)
				}
			}
			//NOTE: 如果最终输出变量是是prompt，则将answer.text作为content
			if content.FinalAnswer.Answer.Text != "" {
				history = append(history, &comvalobj.LLMMessage{
					Role:    string(msg.Role),
					Content: content.FinalAnswer.Answer.Text,
				})
			} else if len(content.FinalAnswer.SkillProcess) > 0 {
				//NOTE:如果最终输出变量是是explore, 如果技能执行过程大于0，则将技能执行过程的最后一个技能的answer.text作为content
				history = append(history, &comvalobj.LLMMessage{
					Role:    string(msg.Role),
					Content: content.FinalAnswer.SkillProcess[len(content.FinalAnswer.SkillProcess)-1].Text,
				})
			} else {
				//NOTE: 如果是other类型，则将other变量序列化为json字符串
				other := content.FinalAnswer.AnswerTypeOther
				if otherStr, ok := other.(string); ok {
					history = append(history, &comvalobj.LLMMessage{
						Role:    string(msg.Role),
						Content: otherStr,
					})
				} else {
					byt, _ := sonic.Marshal(other)
					history = append(history, &comvalobj.LLMMessage{
						Role:    string(msg.Role),
						Content: string(byt),
					})
				}
			}
		} else {
			userContent := conversationmsgvo.UserContent{}
			if msg.Content != nil && *msg.Content != "" {
				err := sonic.Unmarshal([]byte(*msg.Content), &userContent)
				if err != nil {
					o11y.Error(ctx, fmt.Sprintf("[GetHistory] unmarshal user content error, id: %s, err: %v", id, err))
					return nil, errors.Wrapf(err, "[GetHistory] unmarshal user content error, id: %s, err: %v", id, err)
				}
			}
			history = append(history, &comvalobj.LLMMessage{
				Role:    string(msg.Role),
				Content: userContent.Text,
			})
		}
	}

	if limit == 0 {
		limit = 10
	}
	//NOTE:获取会话详情时，message的顺序按照index asc排序，这里需要取最近的limit条
	if len(history) <= limit || limit == -1 {
		return history, nil
	}
	return history[len(history)-limit:], nil
}

// NOTE: 如果不是普通对话，则获取用户消息和助手消息的ID
func GetID(ctx context.Context, messages []*dapo.ConversationMsgPO, regenerateUserMsgID string, regenerateAssistantMsgID string) (userMsgID string, assistantMsgID string) {
	if regenerateAssistantMsgID == "" && regenerateUserMsgID == "" {
		return "", ""
	}
	for index, msg := range messages {
		if msg.ID == regenerateUserMsgID {
			userMsgID = msg.ID
			assistantMsgID = messages[index+1].ID
			return userMsgID, assistantMsgID
		}
		if msg.ID == regenerateAssistantMsgID {
			assistantMsgID = msg.ID
			userMsgID = msg.ReplyID
			return userMsgID, assistantMsgID
		}

	}
	return "", ""
}
