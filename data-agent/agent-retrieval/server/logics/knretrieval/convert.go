package knretrieval

import (
	"fmt"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
)

var knOperationTypeMap = map[string]interfaces.KnOperationType{
	"and":       interfaces.KnOperationTypeAnd,
	"or":        interfaces.KnOperationTypeOr,
	"==":        interfaces.KnOperationTypeEqual,
	"!=":        interfaces.KnOperationTypeNotEqual,
	">":         interfaces.KnOperationTypeGreater,
	"<":         interfaces.KnOperationTypeLess,
	">=":        interfaces.KnOperationTypeGreaterOrEqual,
	"<=":        interfaces.KnOperationTypeLessOrEqual,
	"in":        interfaces.KnOperationTypeIn,
	"not_in":    interfaces.KnOperationTypeNotIn,
	"like":      interfaces.KnOperationTypeLike,
	"not_like":  interfaces.KnOperationTypeNotLike,
	"range":     interfaces.KnOperationTypeRange,
	"out_range": interfaces.KnOperationTypeOutRange,
	"exist":     interfaces.KnOperationTypeExist,
	"not_exist": interfaces.KnOperationTypeNotExist,
	"regex":     interfaces.KnOperationTypeRegex,
	"match":     interfaces.KnOperationTypeMatch,
	"knn":       interfaces.KnOperationTypeKnn,
}

// ParseKnOperationType 将字符串解析为 KnOperationType。
// 如果输入字符串无效，则返回错误。
func ParseKnOperationType(s string) (interfaces.KnOperationType, error) {
	if op, exists := knOperationTypeMap[s]; exists {
		return op, nil
	}
	return "", fmt.Errorf("无效的 KnOperationType: %s", s)
}
