package actions

import (
	"fmt"
	"sync"
	"time"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

// AudioTransfer 音频转文字节点
type AudioTransfer struct {
	DocID   string `json:"docid"`
	Version string `json:"version"`
}

// Name 操作名称
func (a *AudioTransfer) Name() string {
	return common.AudioTransfer
}

var (
	audioMutex sync.Mutex
)

// Run 操作方法
func (a *AudioTransfer) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	taskIns := ctx.GetTaskInstance()
	if taskIns == nil {
		return nil, fmt.Errorf("get taskinstance failed")
	}
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*AudioTransfer)
	id := ctx.GetTaskID()
	log := traceLog.WithContext(ctx.Context())
	audioMutex.Lock()
	defer audioMutex.Unlock()
	// 获取文件信息
	_, docInfo, err := getDocInfo(ctx.Context(), input.DocID, token.Token, token.LoginIP, token.IsApp, ctx.NewASDoc())
	if err != nil {
		ctx.Trace(ctx.Context(), err.Error())
		log.Warnf("[AudioTransfer.Run] getDocInfo failed, detail: %s", err.Error())
		return nil, err
	}

	// 获取文件预下载地址
	res, err := ctx.NewASDoc().InnerOSDownload(newCtx, input.DocID, input.Version)
	if err != nil {
		ctx.Trace(ctx.Context(), err.Error())
		log.Warnf("[AudioTransfer.Run] InnerOSDownload failed, detail: %s", err.Error())
		return nil, err
	}

	// 获取文件二进制内容
	body, err := getFileStream(res.URL, 15*60*time.Second)
	if err != nil {
		ctx.Trace(ctx.Context(), err.Error())
		log.Warnf("[AudioTransfer.Run] getFileStream failed, detail: %s", err.Error())
		return nil, err
	}

	var sizeLimit int64 = 500 * 1024 * 1024
	result, err := ctx.NewRepo().AudioTransfer(ctx.Context(), float64(sizeLimit), "", body, docInfo)
	if err != nil {
		ctx.Trace(ctx.Context(), err.Error())
		log.Warnf("[AudioTransfer.Run] AudioTransfer failed, detail: %s", err.Error())
		return nil, err
	}

	ctx.ShareData().Set(id, result)

	ctx.Trace(ctx.Context(), "run end")
	return result, nil
}

// ParameterNew 初始化参数
func (a *AudioTransfer) ParameterNew() interface{} {
	return &AudioTransfer{}
}
