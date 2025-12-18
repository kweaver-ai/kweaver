package mod

import (
	"context"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	commonLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/log"
	cmq "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/mq"
)

// MQHandler interface
type MQHandler interface {
	Publish(topic string, message []byte) (err error)
}

var (
	mOnce sync.Once
	m     MQHandler
)

type mq struct {
	log   commonLog.Logger
	mq    cmq.MQClient
	store Store
}

// NewMQHandler 实例化MQ
func NewMQHandler() MQHandler {
	mOnce.Do(func() {
		m = &mq{
			log:   commonLog.NewLogger(),
			mq:    cmq.NewMQClient(),
			store: GetStore(),
		}
	})
	return m
}

// Publish 推送消息
func (m *mq) Publish(topic string, message []byte) (err error) {
	err = m.mq.Publish(topic, message)
	if err != nil {
		m.log.Errorf("[Publish] Publish %s failed, err = %v\n", topic, err)

		if oErr := m.store.CreatOutBoxMessage(context.Background(), &entity.OutBox{
			BaseInfo: entity.BaseInfo{},
			Topic:    topic,
			Msg:      string(message),
		}); oErr != nil {
			m.log.Errorf("[Publish] CreatOutBoxMessage error: %v", oErr.Error())
			return oErr
		}
	}
	return err
}
