package agentsvc

import (
	"context"
	"fmt"
	"strings"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo/daresvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/drivenadapter/httpaccess/efastaccess/efastdto"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/infra/common/util"
	o11y "devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/observability"
	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
)

func (agentSvc *agentSvc) handleRetrievalField(ctx context.Context, result *daresvo.DataAgentRes, markCite bool) (*agentrespvo.DocRetrievalField, any, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	answer, cites, err := result.DocRetrievalAnswerAndCites()
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[handleRetrievalField] DocRetrievalAnswerAndCites error: %v", err))
		return nil, nil, errors.Wrapf(err, "[handleRetrievalField] DocRetrievalAnswerAndCites error: %v", err)
	}
	docRetrievalField := &agentrespvo.DocRetrievalField{
		Text: answer,
	}
	err = agentSvc.docCite(ctx, docRetrievalField, markCite, cites)
	if err != nil {
		o11y.Error(ctx, fmt.Sprintf("[handleRetrievalField] docCite error: %v", err))
		return nil, nil, errors.Wrapf(err, "[handleRetrievalField] docCite error: %v", err)
	}
	return docRetrievalField, nil, nil
}

func (agentSvc *agentSvc) docCite(ctx context.Context, retrievalField *agentrespvo.DocRetrievalField, markCite bool, cites []*agentrespvo.AnswerCite) (err error) {
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	var docCites []*agentrespvo.CiteDoc

	if len(cites) > 0 {
		docCites, err = agentSvc.answerCiteToCiteDoc(ctx, cites)
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[docCite] answerCiteToCiteDoc error: %v", err))
			return errors.Wrapf(err, "[docCite] answerCiteToCiteDoc error: %v", err)
		}
	}
	retrievalField.Cites = docCites
	if markCite && len(docCites) > 0 {
		retrievalField.Text = agentSvc.addCiteDocMark(retrievalField.Text, docCites)
	}

	return
}

func (agentSvc *agentSvc) answerCiteToCiteDoc(ctx context.Context, cites []*agentrespvo.AnswerCite) ([]*agentrespvo.CiteDoc, error) {
	var err error
	ctx, _ = o11y.StartInternalSpan(ctx)
	defer o11y.EndSpan(ctx, err)
	docCites := []*agentrespvo.CiteDoc{}
	var docIDs []string

	// 1. 遍历cites，收集docID等
	for _, cite := range cites {
		// 1.1 解析cite
		imeta, e := parseAgentDebugMeta(cite.CiteType, cite.Meta)
		if e != nil {
			o11y.Error(ctx, fmt.Sprintf("[answerCiteToCiteDoc] parseAgentDebugMeta err: %v, cite type: %s, cite meta: %v", e, cite.CiteType, cite.Meta))
			continue
		}

		// 1.2 根据cite类型，转换为CiteDoc
		switch meta := imeta.(type) {
		case *agentDebugInfoRetrieversBlockContentTextMetaDocLib:
			// 用于定位文档召回方面问题
			o11y.Debug(ctx, fmt.Sprintf("[answerCiteToCiteDoc] meta.ExtType: %s, meta.DocID: %s", meta.ExtType, meta.DocID))

			if meta.ExtType == "" {
				continue
			} else {
				docIDs = append(docIDs, util.GNS2ObjectID(meta.DocID))
			}
			docCites = append(docCites, &agentrespvo.CiteDoc{
				Content:    cite.Content,
				ExtType:    meta.ExtType,
				DocID:      meta.DocID,
				DocName:    meta.DocName,
				ObjectID:   meta.ObjectID,
				ParentPath: meta.ParentPath,
				Size:       meta.Size,
				Type:       "document",
				Slices:     meta.Slices,
				SpaceID:    meta.SpaceID,
				DocLibType: meta.DocLibType,
			})

		default:
			o11y.Debug(ctx, fmt.Sprintf("[answerCiteToCiteDoc]  others %T : %v", meta, meta))
		}
	}

	// 2. 获取文档元数据
	docsMap := map[string]*efastdto.DocumentMetaData{}
	if len(docIDs) > 0 {
		if docIDs[0] == "" {
			err := fmt.Errorf("docIDs[0] is empty,citeInfo:%v", cites)
			return nil, err
		}
		docsMap, err = agentSvc.efast.GetObjectFieldByID(ctx, docIDs, "names", "paths", "doc_lib_types")
		if err != nil {
			o11y.Error(ctx, fmt.Sprintf("[answerCiteToCiteDoc] efast.GetObjectFieldByID docIDs err: %v, docIDs:%v", err, docIDs))
			return nil, errors.Wrapf(err, "[answerCiteToCiteDoc] efast.GetObjectFieldByID docIDs err: %v, docIDs:%v", err, docIDs)
		}
	}

	// 3. 设置docCites
	for _, cite := range docCites {
		doc, ok := docsMap[cite.ObjectID]
		if ok {
			cite.DocID = doc.ID
			cite.ParentPath = FileLocationToParentPath(doc.Path)
			cite.DocLibType = doc.DocLibType
		}
	}

	return docCites, nil
}

// agentDebugInfoDocQARetrieversBlockContentTextMeta 检索器块内容文本元数据调试信息
type agentDebugInfoRetrieversBlockContentTextMetaDocLib struct {
	ObjectID   string                 `json:"object_id"`
	DocName    string                 `json:"doc_name"`
	ExtType    string                 `json:"ext_type"`    // 后缀名
	ParentPath string                 `json:"parent_path"` // 路径
	Size       int64                  `json:"size"`
	DocID      string                 `json:"doc_id"`      // gns
	DataSource string                 `json:"data_source"` // 数据集
	Slices     []*agentrespvo.V1Slice `json:"slices"`
	DocLibType string                 `json:"doc_lib_type"` // 文档库类型
	SpaceID    string                 `json:"space_id"`     // 空间ID
}

func parseAgentDebugMeta(rst string, meta interface{}) (interface{}, error) {
	data, _ := sonic.Marshal(meta)
	switch rst {
	case "DOC_LIB":
		meta := &agentDebugInfoRetrieversBlockContentTextMetaDocLib{}
		err := sonic.Unmarshal(data, meta)
		return meta, err
		// case "KG_RULE":
		// 	// meta := &agentDebugInfoRetrieversBlockContentTextMetaKGRule{}
		// 	err := sonic.Unmarshal(data, meta)
		// 	return meta, err
		// case "KG_RAG":
		// 	meta := &agentDebugInfoRetrieversBlockContentTextMetaKGRAG{}
		// 	err := sonic.Unmarshal(data, meta)
		// 	return meta, err
	}
	return nil, fmt.Errorf("unknown retrieve source type %s", rst)
}

func FileLocationToParentPath(fileLocation string) string {
	parts := strings.Split(fileLocation, "/")
	result := strings.Join(parts[:len(parts)-1], "/")
	fileLocation = fmt.Sprintf("%s%s", "gns://", result)
	return fileLocation
}
