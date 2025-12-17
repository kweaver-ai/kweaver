package daresvo

import (
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/enum/chat_enum/chatresenum"
	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-app/src/domain/valueobject/agentrespvo"
)

// DocRetrievalResultStrategy 文档召回结果判断策略接口
type DocRetrievalResultStrategy interface {

	// Process 处理结果并返回标准化的结构
	Process(answer interface{}) (agentrespvo.DocRetrievalAnswer, error)

	// GetStrategyName 获取策略名称
	GetStrategyName() chatresenum.DocRetrievalStrategy
}
