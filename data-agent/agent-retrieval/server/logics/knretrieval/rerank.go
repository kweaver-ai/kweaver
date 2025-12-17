package knretrieval

import (
	"context"
	"sort"

	"devops.aishu.cn/AISHUDevOps/DIP/_git/agent-retrieval/server/interfaces"
)

// 收集不同概念类集合，并进行排序，每个概念集取前limit个
func (k *knRetrievalServiceImpl) rerankByConceptType(conceptResults []*interfaces.ConceptResult, limit int) []*interfaces.ConceptResult {
	// 去重
	conceptResults = k.deduplicateConcepts(conceptResults)
	conceptTypeMap := make(map[interfaces.KnConceptType][]*interfaces.ConceptResult)
	// 按概念类型分类
	for _, concept := range conceptResults {
		conceptTypeMap[concept.ConceptType] = append(conceptTypeMap[concept.ConceptType], concept)
	}
	// 按概念类型排序
	for _, concepts := range conceptTypeMap {
		sort.Slice(concepts, func(i, j int) bool {
			return concepts[i].MatchScore > concepts[j].MatchScore
		})
		if len(concepts) > limit {
			concepts = concepts[:limit]
		}
	}
	result := []*interfaces.ConceptResult{}
	// 顺序要求：对象类、关系类、行动类
	if conceptTypeMap[interfaces.KnConceptTypeObject] != nil && len(conceptTypeMap[interfaces.KnConceptTypeObject]) > 0 {
		result = append(result, conceptTypeMap[interfaces.KnConceptTypeObject]...)
	}
	if conceptTypeMap[interfaces.KnConceptTypeRelation] != nil && len(conceptTypeMap[interfaces.KnConceptTypeRelation]) > 0 {
		result = append(result, conceptTypeMap[interfaces.KnConceptTypeRelation]...)
	}
	if conceptTypeMap[interfaces.KnConceptTypeAction] != nil && len(conceptTypeMap[interfaces.KnConceptTypeAction]) > 0 {
		result = append(result, conceptTypeMap[interfaces.KnConceptTypeAction]...)
	}
	if len(result) > limit {
		result = result[:limit]
	}
	return result
}

func (k *knRetrievalServiceImpl) rerankByDataRetrieval(ctx context.Context, queryUnderstandResult *interfaces.QueryUnderstanding, conceptResults []*interfaces.ConceptResult,
	action interfaces.KnowledgeRerankActionType, limit int) (rerankResults []*interfaces.ConceptResult, err error) {
	// 去重
	conceptResults = k.deduplicateConcepts(conceptResults)
	// 请求重排
	rerankResults, err = k.dataRetrieval.KnowledgeRerank(ctx, &interfaces.KnowledgeRerankReq{
		QueryUnderstanding: queryUnderstandResult,
		KnowledgeConcepts:  conceptResults,
		Action:             action,
	})
	if err != nil {
		return
	}
	// 过滤rerankScore等于0的数据
	rerankResults = k.filterRerankScoreZero(rerankResults)
	// 分页
	if len(rerankResults) > limit {
		rerankResults = rerankResults[:limit]
	}
	return
}

// 过滤rerankScore等于0的数据
func (k *knRetrievalServiceImpl) filterRerankScoreZero(conceptResults []*interfaces.ConceptResult) []*interfaces.ConceptResult {
	var result []*interfaces.ConceptResult
	for _, concept := range conceptResults {
		if concept.RerankScore > 0 {
			result = append(result, concept)
		}
	}
	return result
}
