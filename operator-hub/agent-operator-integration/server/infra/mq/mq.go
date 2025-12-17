// Package mq MQ客户端
package mq

import (
	"context"
	"fmt"
	"sync"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/infra/config"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-operator-integration/server/interfaces"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	msqclient "devops.aishu.cn/AISHUDevOps/ONE-Architecture/_git/proton-mq-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

//go:generate mockgen -package mock -source ./mq.go -destination ./mock/mock_mq.go

// MQClient mq客户端接口
type MQClient interface {
	Subscribe(ctx context.Context, topic string, channel string, cmd func([]byte) error)
	Publish(ctx context.Context, topic string, message []byte) error
}

var (
	mqOnce   sync.Once
	mqClient MQClient
)

type msgQueue struct {
	logger                   interfaces.Logger
	protonMQClient           msqclient.ProtonMQClient
	pollIntervalMilliseconds int64
	maxInFlight              int
}

// NewMQClient 创建消息队列
func NewMQClient() MQClient {
	mqOnce.Do(func() {
		configLoader := config.NewConfigLoader()
		protonClient, err := msqclient.NewProtonMQClientFromFile(configLoader.MQConfigFile)
		if err != nil {
			panic(err)
		}
		mqClient = &msgQueue{
			logger:                   configLoader.GetLogger(),
			protonMQClient:           protonClient,
			pollIntervalMilliseconds: 100, //nolint:mnd
			maxInFlight:              200, //nolint:mnd
		}
	})
	return mqClient
}

// Subscribe 订阅
func (m *msgQueue) Subscribe(ctx context.Context, topic, channel string, cmd func([]byte) error) {
	go func() {
		var err error
		tracer := otel.GetTracerProvider()
		if tracer != nil {
			var span trace.Span
			ctx, span = o11y.StartConsumerSpan(ctx)
			span.SetAttributes(attribute.String("messaging.operation", "subscribe"))
			span.SetAttributes(attribute.String("messaging.topic", topic))
			span.SetAttributes(attribute.String("messaging.channel", channel))
			defer o11y.EndSpan(ctx, err)
		}
		err = m.protonMQClient.Sub(topic, channel, cmd, m.pollIntervalMilliseconds, m.maxInFlight)
		m.logger.WithContext(ctx).Errorf("subscribe mq topic: %s, channel: %s,  error: %v", topic, channel, err)
	}()
}

// Publish 发布
func (m *msgQueue) Publish(ctx context.Context, topic string, message []byte) (err error) {
	tracer := otel.GetTracerProvider()
	if tracer != nil {
		var span trace.Span
		ctx, span = o11y.StartProducerSpan(ctx)
		span.SetAttributes(attribute.String("messaging.operation", "publish"))
		span.SetAttributes(attribute.String("messaging.topic", topic))
		span.SetAttributes(attribute.String("messaging.payload_size_bytes", fmt.Sprintf("%d", int64(len(message)))))
		defer o11y.EndSpan(ctx, err)
	}
	if err := m.protonMQClient.Pub(topic, message); err != nil {
		m.logger.WithContext(ctx).Errorf("publish mq topic %s, message: %s, error: %v", topic, string(message), err)
		return err
	}
	return nil
}
