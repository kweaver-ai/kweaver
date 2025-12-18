package actions

import (
	"context"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/drivenadapters"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/pkg/entity"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/trace"
)

const (
	ocr         = "@anyshare/ocr/general"
	eleInvoice  = "@anyshare/ocr/eleinvoice"
	idCard      = "@anyshare/ocr/idcard"
	ocrTaskType = int64(100)
	pdfTaskType = int64(1)
)

var (
	mu  sync.Mutex
	emu sync.Mutex
	imu sync.Mutex
)

// OCR 图像识别
type OCR struct {
	DocID string `json:"docid"`
}

// Name 操作名称
func (a *OCR) Name() string {
	return ocr
}

// Run 操作方法
func (a *OCR) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) { //nolint
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	newCtx = context.WithValue(newCtx, common.Authorization, token.Token)
	ctx.SetContext(newCtx)
	log := traceLog.WithContext(ctx.Context())

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*OCR)

	err = checkOCRAvailable(ctx, token)
	if err != nil {
		log.Warnf("[OCR.Run] checkOCRAvailable failed, detail: %s", err.Error())
		return nil, err
	}

	mu.Lock()
	defer mu.Unlock()
	result, err := handleOCR(ctx, token, input.DocID, "general", "handwriting", "/lab/ocr/predict/general", pdfTaskType)
	if err != nil {
		log.Warnf("[OCR.Run] handleOCR failed, detail: %s", err.Error())
	}
	return result, err
}

// ParameterNew 初始化参数
func (a *OCR) ParameterNew() interface{} {
	return &OCR{}
}

// EleInvoice 电子票据识别
type EleInvoice struct {
	DocID string `json:"docid"`
}

// Name 操作名称
func (ei *EleInvoice) Name() string {
	return eleInvoice
}

// Run 操作方法
func (ei *EleInvoice) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) { //nolint
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	newCtx = context.WithValue(newCtx, common.Authorization, token.Token)
	ctx.SetContext(newCtx)
	log := traceLog.WithContext(ctx.Context())

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*EleInvoice)

	err = checkOCRAvailable(ctx, token)
	if err != nil {
		log.Warnf("[EleInvoice.Run] checkOCRAvailable failed, detail: %s", err.Error())
		return nil, err
	}

	emu.Lock()
	defer emu.Unlock()
	result, err := handleOCR(ctx, token, input.DocID, "eleinvoice", "eleinvoice", "/lab/ocr/predict/ticket", ocrTaskType)
	if err != nil {
		log.Warnf("[EleInvoice.Run] handleOCR failed, detail: %s", err.Error())
	}
	return result, err
}

// ParameterNew 初始化参数
func (ei *EleInvoice) ParameterNew() interface{} {
	return &EleInvoice{}
}

// IDCard 身份证识别
type IDCard struct {
	DocID string `json:"docid"`
}

// Name 操作名称
func (ic *IDCard) Name() string {
	return idCard
}

// Run 操作方法
func (ic *IDCard) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) { //nolint
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	newCtx = context.WithValue(newCtx, common.Authorization, token.Token)
	ctx.SetContext(newCtx)
	log := traceLog.WithContext(ctx.Context())

	ctx.Trace(ctx.Context(), "run start", entity.TraceOpPersistAfterAction)
	input := params.(*IDCard)

	err = checkOCRAvailable(ctx, token)
	if err != nil {
		log.Warnf("[IDCard.Run] checkOCRAvailable failed, detail: %s", err.Error())
		return nil, err
	}

	imu.Lock()
	defer imu.Unlock()
	result, err := handleOCR(ctx, token, input.DocID, "idcard", "idcard", "/lab/ocr/predict/ticket", ocrTaskType)
	if err != nil {
		log.Warnf("[IDCard.Run] handleOCR failed, detail: %s", err.Error())
	}
	return result, err
}

// ParameterNew 初始化参数
func (ic *IDCard) ParameterNew() interface{} {
	return &IDCard{}
}

type OCRNew struct {
	DocID   string `json:"docid"`
	Version string `json:"version"`
}

func (a *OCRNew) Name() string {
	return common.OpOCRNew
}

func (a *OCRNew) ParameterNew() any {
	return &OCRNew{}
}

func (a *OCRNew) Run(ctx entity.ExecuteContext, params interface{}, token *entity.Token) (interface{}, error) {
	var err error
	newCtx, span := trace.StartInternalSpan(ctx.Context())
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	ctx.SetContext(newCtx)
	ctx.Trace(newCtx, "run start", entity.TraceOpPersistAfterAction)
	log := traceLog.WithContext(ctx.Context())

	input := params.(*OCRNew)

	efast := drivenadapters.NewEfast()
	downloadInfo, err := efast.InnerOSDownload(ctx.Context(), input.DocID, input.Version)
	if err != nil {
		log.Warnf("[OCRNew.Run] InnerOSDownload err %s, docid %s, version %s", err.Error(), input.DocID, input.Version)
		return nil, err
	}

	ocr := drivenadapters.NewOcr()
	text, err := ocr.RecognizeText(ctx.Context(), downloadInfo.URL, downloadInfo.Name)

	if err != nil {
		log.Warnf("[OCRNew.Run] RecognizeText err %s, docid %s, version %s", err.Error(), input.DocID, input.Version)
		return nil, err
	}

	result := map[string]any{
		"text": text,
	}

	ctx.ShareData().Set(ctx.GetTaskID(), result)

	return result, nil
}
