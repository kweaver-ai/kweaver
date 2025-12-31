package drivenadapters

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sync"

	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/common"
	"devops.aishu.cn/AISHUDevOps/AnyShareFamily/_git/ContentAutomation/errors"
	traceLog "devops.aishu.cn/AISHUDevOps/DIP/_git/ide-go-lib/telemetry/log"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type StructureExtractor interface {
	FileParse(ctx context.Context, fileUrl, fileName string) (*FileParseResultItem, []*ContentItem, error)
}

type structureExtractor struct {
	baseURL string
	config  *common.StructureExtractor
	client  *http.Client
}

var (
	structureExtractorIns  StructureExtractor
	structureextractorOnce sync.Once
)

func NewStructureExtractor() StructureExtractor {
	structureextractorOnce.Do(func() {
		config := common.NewConfig().StructureExtractor
		structureExtractorIns = &structureExtractor{
			baseURL: fmt.Sprintf("http://%s:%v", config.PrivateHost, config.PrivatePort),
			config:  &config,
			client: &http.Client{
				Transport: otelhttp.NewTransport(&http.Transport{
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				}),
			},
		}
	})

	return structureExtractorIns
}

type FileParseResultItem struct {
	Images      map[string]string `json:"images"`
	MdContent   string            `json:"md_content"`
	ContentList string            `json:"content_list"`
}

type ContentItem struct {
	// 通用字段 (所有类型都有)
	Type    string `json:"type"`     // text, image, table, equation, code, list, header, footer, etc.
	PageIdx int    `json:"page_idx"` // 页码,从 0 开始
	Bbox    [4]int `json:"bbox"`     // [x0, y0, x1, y1], 归一化到 0-1000

	// 文本类型字段
	Text      string `json:"text,omitempty"`       // 文本内容
	TextLevel *int   `json:"text_level,omitempty"` // 标题层级,0=正文,1-N=标题

	// 图片类型字段
	ImgPath       string   `json:"img_path,omitempty"`       // 图片路径
	ImageCaption  []string `json:"image_caption,omitempty"`  // 图片描述
	ImageFootnote []string `json:"image_footnote,omitempty"` // 图片脚注

	// 公式类型字段
	TextFormat string `json:"text_format,omitempty"` // "latex"

	// 表格类型字段
	TableCaption  []string `json:"table_caption,omitempty"`  // 表格标题
	TableFootnote []string `json:"table_footnote,omitempty"` // 表格脚注
	TableBody     string   `json:"table_body,omitempty"`     // HTML 格式表格

	// 代码类型字段 (VLM 后端)
	SubType     string   `json:"sub_type,omitempty"`     // "code", "algorithm", "text", "ref_text"
	CodeCaption []string `json:"code_caption,omitempty"` // 代码标题
	CodeBody    string   `json:"code_body,omitempty"`    // 代码内容
	GuessLang   string   `json:"guess_lang,omitempty"`   // 编程语言

	// 列表类型字段 (VLM 后端)
	ListItems []string `json:"list_items,omitempty"` // 列表项
}

type FileParseResult struct {
	Results map[string]*FileParseResultItem `json:"results"`
}

func (s *structureExtractor) FileParse(ctx context.Context, fileUrl, fileName string) (*FileParseResultItem, []*ContentItem, error) {
	pr, pw := io.Pipe()

	writer := multipart.NewWriter(pw)
	go func() {
		defer pw.Close()
		defer writer.Close()
		writer.WriteField("output_dir", s.config.OutputDir)
		writer.WriteField("backend", s.config.Backend)
		writer.WriteField("server_url", s.config.ServerUrl)
		writer.WriteField("lang_list", "ch")
		writer.WriteField("return_md", "true")
		writer.WriteField("return_content_list", "true")
		writer.WriteField("return_images", "false")

		resp, err := s.client.Get(fileUrl)

		if err != nil {
			pw.CloseWithError(err)
			return
		}

		defer resp.Body.Close()

		part, err := writer.CreateFormFile("files", fileName)

		if err != nil {
			pw.CloseWithError(err)
			return
		}

		_, err = io.Copy(part, resp.Body)

		if err != nil {
			pw.CloseWithError(err)
			return
		}
	}()

	target := fmt.Sprintf("%s/file_parse", s.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", target, pr)

	if err != nil {
		traceLog.WithContext(ctx).Warnf("FileParse err: %s", err.Error())
		return nil, nil, err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := s.client.Do(req)

	if err != nil {
		traceLog.WithContext(ctx).Warnf("FileParse err: %s", err.Error())
		return nil, nil, err
	}

	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)

	if err != nil {
		traceLog.WithContext(ctx).Warnf("FileParse err: %s", err.Error())
		return nil, nil, err
	}

	respCode := resp.StatusCode
	if (respCode < http.StatusOK) || (respCode >= http.StatusMultipleChoices) {
		err = errors.ExHTTPError{
			Body:   string(data),
			Status: respCode,
		}
		return nil, nil, err
	}

	var res FileParseResult
	err = json.Unmarshal(data, &res)

	if err != nil {
		traceLog.WithContext(ctx).Warnf("FileParse err: %s", err.Error())
		return nil, nil, err
	}

	for _, item := range res.Results {
		var contentList []*ContentItem
		if err := json.Unmarshal([]byte(item.ContentList), &contentList); err != nil {
			return item, nil, nil
		}

		return item, contentList, nil
	}

	return nil, nil, nil
}
