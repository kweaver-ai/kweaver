package thirft

import (
	"context"
	"encoding/base64"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/tapi/sharemgnt"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/go-lib/tclient"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

//go:generate mockgen -package mock_thirft -source ../../drivenadapters/thirft/sharemgnt.go -destination ../../tests/mock_thirft/sharemgnt_mock.go

// ShareMgnt method interface
type ShareMgnt interface {
	// 发送携带图片附件的邮件
	SendEmailWithImage(ctx context.Context, subject, content string, img *string, toEmailList []string) error
}

type shareMgntSvc struct {
	host string
	port int
	// logger common.Logger
}

var (
	sharemgntOnce sync.Once
	s             ShareMgnt
)

// NewShareMgnt 创建sharemgnt处理对象
func NewShareMgnt() ShareMgnt {
	sharemgntOnce.Do(func() {
		config := common.NewConfig()
		s = &shareMgntSvc{
			host: config.ShareMgnt.Host,
			port: config.ShareMgnt.Port,
			// logger: common.NewLogger(),
		}
	})
	return s
}

// SendEmail 给指定用户发送信息
func (s *shareMgntSvc) SendEmailWithImage(ctx context.Context, subject, content string, img *string, toEmailList []string) error {
	var (
		err             error
		shareMgntClient *sharemgnt.NcTShareMgntClient
	)

	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	tLog := traceLog.WithContext(ctx)

	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, s.host, s.port)

	if err != nil {
		tLog.Warnf("[SendEmailWithImage] Create shareMgntClient error:%s ", err.Error())
		return err
	}

	defer func() {
		if transport != nil {
			transport.Close() //nolint
		}
	}()
	decodedBytes, _ := base64.StdEncoding.DecodeString(*img)
	err = shareMgntClient.SMTP_SendEmailWithImage(ctx, toEmailList, subject, content, decodedBytes)
	if err != nil {
		tLog.Warnf("[SendEmailWithImage] SMTP_SendEmailWithImage error:%s ", err.Error())
	}
	return err
}
