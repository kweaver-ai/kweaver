package daresvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/enum/chat_enum/chatresenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-go-common-pkg/src/infra/cmp/icmp"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/mdl-go-lib/logger"
	"github.com/bytedance/sonic"
	"github.com/pkg/errors"
)

// StandardDocRetrievalStrategy 标准文档召回结果策略
type StandardDocRetrievalStrategy struct {
	name   chatresenum.DocRetrievalStrategy
	logger icmp.Logger
}

func NewStandardDocRetrievalStrategy() *StandardDocRetrievalStrategy {
	return &StandardDocRetrievalStrategy{
		name:   chatresenum.DocRetrievalStrategyStandard,
		logger: logger.GetLogger(),
	}
}

func (s *StandardDocRetrievalStrategy) GetStrategyName() chatresenum.DocRetrievalStrategy {
	return s.name
}

func (s *StandardDocRetrievalStrategy) Process(answer interface{}) (agentrespvo.DocRetrievalAnswer, error) {
	//NOTE: 兼容返回的结果类型
	if answerMap, ok := answer.(map[string]interface{}); ok {
		// 检查是否包含错误信息
		if errorCode, hasError := answerMap["error_code"]; hasError {
			return agentrespvo.DocRetrievalAnswer{}, errors.Errorf("文档召回错误: code=%v,error=%v", errorCode, answerMap)
		}

		// 检查必需字段是否存在
		if _, hasResult := answerMap["result"]; !hasResult {
			return agentrespvo.DocRetrievalAnswer{}, errors.New("文档召回结果缺少必需字段: result")
		}

		if fullResult, hasFullResult := answerMap["full_result"].(map[string]interface{}); !hasFullResult {
			return agentrespvo.DocRetrievalAnswer{}, errors.New("文档召回结果缺少必需字段: full_result")
		} else {
			if _, hasText := fullResult["text"]; !hasText {
				return agentrespvo.DocRetrievalAnswer{}, errors.New("文档召回结果缺少必需字段: full_result.text")
			}
		}
		// 将 map[string]interface{} 转换为 JSON，再反序列化为 DocRetrievalAnswer
		answerBytes, _ := sonic.Marshal(answerMap)
		var docRetrievalAnswer agentrespvo.DocRetrievalAnswer
		err := sonic.Unmarshal(answerBytes, &docRetrievalAnswer)
		if err != nil {
			err = errors.Wrapf(err, "[GetDocRetrieval] type map[string]interface{} to DocRetrievalAnswer error, 文档召回结果格式错误:%v", err)
			return agentrespvo.DocRetrievalAnswer{}, err
		}

		return docRetrievalAnswer, nil
	} else {
		//NOTE: 非标准结构，打日志不报错
		s.logger.Errorf("文档召回结果非标准结构，值为: %v, 类型为: %T", answer, answer)
		return agentrespvo.DocRetrievalAnswer{}, nil
	}
}
