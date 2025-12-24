package auditlog

import (
	"context"
	"encoding/json"
	"system-backend/internal/config"
	"time"

	mqsdk "github.com/AISHU-Technology/proton-mq-sdk-go"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type AuditLog struct {
	cli mqsdk.ProtonMQClient
	log *logrus.Entry
	opr *Toperator
}

func NewAuditLog(app *config.AppConfig, log *logrus.Entry) *AuditLog {
	var cli mqsdk.ProtonMQClient
	if !app.DepsConfig.EnableMQ {
		return &AuditLog{
			cli: nil,
			log: log,
		}
	}

	cli, err := mqsdk.NewProtonMQClient(
		app.MQConfig.Host,
		app.MQConfig.Port,
		app.MQConfig.LookupdHost,
		app.MQConfig.LookupdPort,
		app.MQConfig.Type,
		mqsdk.AuthMechanism(app.MQConfig.AuthMechanism),
		mqsdk.UserInfo(app.MQConfig.AuthUsername, app.MQConfig.AuthPassword),
	)

	if err != nil {
		log.WithError(err).Fatal("init mq client failed")
		return nil
	}

	return &AuditLog{
		cli: cli,
		log: log,
	}
}

func (a *AuditLog) Health() error {
	return nil
}

func (a *AuditLog) SetOperator(o *Toperator) {
	a.opr = o
}

func (a *AuditLog) SLog(ctx context.Context, msg BDMessage) error {
	realMsg := Message{
		Level:       msg.Level,
		Operation:   msg.Operation,
		Operator:    *a.opr,
		Description: msg.Description,
		OPTime:      time.Now().UnixNano(),
		Object:      msg.Object,
		LogFrom: TlogFrom{
			Package: "DeploymentStudio",
			Service: TlogFromService{
				Name: "business-system-backend",
			},
		},
		OutBizID: uuid.NewString(),
		EXMsg:    msg.EXMsg,
		Type:     "management",
	}

	data, err := json.Marshal(realMsg)
	if err != nil {
		return err
	}

	var mapData map[string]any
	_ = json.Unmarshal(data, &mapData)

	// 根据配置和MQ客户端状态决定是否发送MQ消息
	if a.cli == nil {
		a.log.WithField("content", mapData).Info("[配置模式] 审计日志已记录，跳过MQ发送")
		return nil
	}

	a.log.WithField("content", mapData).Debug("send a audit log")
	return a.cli.Pub("isf.audit_log.log", data)
}
