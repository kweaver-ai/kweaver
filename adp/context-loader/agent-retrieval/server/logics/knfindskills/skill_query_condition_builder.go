// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package knfindskills

import (
	"strings"

	"github.com/kweaver-ai/adp/context-loader/agent-retrieval/server/interfaces"
)

var skillQueryTargetFields = map[string]struct{}{
	"name":        {},
	"description": {},
}

// BuildSkillQueryCondition builds a KnCondition from skill_query against
// the name/description fields of the skills ObjectType.
// Returns nil when skillQuery is empty or no usable condition can be built.
func BuildSkillQueryCondition(skillQuery string, skillsObjType *interfaces.ObjectType, topK int) *interfaces.KnCondition {
	skillQuery = strings.TrimSpace(skillQuery)
	if skillQuery == "" || skillsObjType == nil {
		return nil
	}

	var subConditions []*interfaces.KnCondition

	for _, prop := range skillsObjType.DataProperties {
		if prop == nil {
			continue
		}
		name := strings.TrimSpace(prop.Name)
		if _, ok := skillQueryTargetFields[name]; !ok {
			continue
		}
		if len(prop.ConditionOperations) == 0 {
			continue
		}

		cond := buildFieldCondition(name, skillQuery, prop.ConditionOperations, topK)
		if cond != nil {
			subConditions = append(subConditions, cond)
		}
	}

	if len(subConditions) == 0 {
		return nil
	}
	if len(subConditions) == 1 {
		return subConditions[0]
	}
	return &interfaces.KnCondition{
		Operation:     interfaces.KnOperationTypeOr,
		SubConditions: subConditions,
	}
}

// buildFieldCondition picks the best condition type for a single field.
// Priority: knn > match > like
func buildFieldCondition(fieldName, query string, ops []interfaces.KnOperationType, topK int) *interfaces.KnCondition {
	var hasKnn, hasMatch, hasLike bool
	for _, op := range ops {
		switch op {
		case interfaces.KnOperationTypeKnn:
			hasKnn = true
		case interfaces.KnOperationTypeMatch:
			hasMatch = true
		case interfaces.KnOperationTypeLike:
			hasLike = true
		}
	}

	switch {
	case hasKnn:
		return &interfaces.KnCondition{
			Field:      fieldName,
			Operation:  interfaces.KnOperationTypeKnn,
			Value:      query,
			ValueFrom:  interfaces.CondValueFromConst,
			LimitKey:   interfaces.CondLimitKeyK,
			LimitValue: topK,
		}
	case hasMatch:
		return &interfaces.KnCondition{
			Field:     fieldName,
			Operation: interfaces.KnOperationTypeMatch,
			Value:     query,
			ValueFrom: interfaces.CondValueFromConst,
		}
	case hasLike:
		return &interfaces.KnCondition{
			Field:     fieldName,
			Operation: interfaces.KnOperationTypeLike,
			Value:     query,
			ValueFrom: interfaces.CondValueFromConst,
		}
	default:
		return nil
	}
}
