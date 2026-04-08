// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package knfindskills

import (
	"testing"

	"github.com/kweaver-ai/adp/context-loader/agent-retrieval/server/interfaces"
)

func makeSkillsObjType(nameOps, descOps []interfaces.KnOperationType) *interfaces.ObjectType {
	return &interfaces.ObjectType{
		ID:   "skills",
		Name: "skills",
		DataProperties: []*interfaces.DataProperty{
			{
				Name:                "name",
				Type:                "text",
				ConditionOperations: nameOps,
			},
			{
				Name:                "description",
				Type:                "text",
				ConditionOperations: descOps,
			},
		},
	}
}

func TestBuildSkillQueryCondition_EmptyQuery(t *testing.T) {
	ot := makeSkillsObjType(
		[]interfaces.KnOperationType{interfaces.KnOperationTypeKnn},
		[]interfaces.KnOperationType{interfaces.KnOperationTypeMatch},
	)
	cond := BuildSkillQueryCondition("", ot, 10)
	if cond != nil {
		t.Error("expected nil condition for empty query")
	}
}

func TestBuildSkillQueryCondition_NilObjectType(t *testing.T) {
	cond := BuildSkillQueryCondition("test", nil, 10)
	if cond != nil {
		t.Error("expected nil condition for nil object type")
	}
}

func TestBuildSkillQueryCondition_KnnPreferred(t *testing.T) {
	ot := makeSkillsObjType(
		[]interfaces.KnOperationType{interfaces.KnOperationTypeKnn, interfaces.KnOperationTypeMatch},
		[]interfaces.KnOperationType{interfaces.KnOperationTypeKnn},
	)
	cond := BuildSkillQueryCondition("审查", ot, 10)
	if cond == nil {
		t.Fatal("expected non-nil condition")
	}
	if cond.Operation != interfaces.KnOperationTypeOr {
		t.Fatalf("expected OR root, got %s", cond.Operation)
	}
	if len(cond.SubConditions) != 2 {
		t.Fatalf("expected 2 sub-conditions, got %d", len(cond.SubConditions))
	}
	for _, sub := range cond.SubConditions {
		if sub.Operation != interfaces.KnOperationTypeKnn {
			t.Errorf("expected knn for field %s, got %s", sub.Field, sub.Operation)
		}
	}
}

func TestBuildSkillQueryCondition_MatchFallback(t *testing.T) {
	ot := makeSkillsObjType(
		[]interfaces.KnOperationType{interfaces.KnOperationTypeMatch},
		[]interfaces.KnOperationType{interfaces.KnOperationTypeMatch},
	)
	cond := BuildSkillQueryCondition("审查", ot, 10)
	if cond == nil {
		t.Fatal("expected non-nil condition")
	}
	for _, sub := range cond.SubConditions {
		if sub.Operation != interfaces.KnOperationTypeMatch {
			t.Errorf("expected match for field %s, got %s", sub.Field, sub.Operation)
		}
	}
}

func TestBuildSkillQueryCondition_LikeFallback(t *testing.T) {
	ot := makeSkillsObjType(
		[]interfaces.KnOperationType{interfaces.KnOperationTypeLike},
		[]interfaces.KnOperationType{},
	)
	cond := BuildSkillQueryCondition("审查", ot, 10)
	if cond == nil {
		t.Fatal("expected non-nil condition")
	}
	// Only name field has like, description has no ops -> single condition returned directly
	if cond.Field != "name" {
		t.Errorf("expected field=name, got %s", cond.Field)
	}
	if cond.Operation != interfaces.KnOperationTypeLike {
		t.Errorf("expected like, got %s", cond.Operation)
	}
}

func TestBuildSkillQueryCondition_NoUsableOps(t *testing.T) {
	ot := makeSkillsObjType(
		[]interfaces.KnOperationType{interfaces.KnOperationTypeEqual},
		[]interfaces.KnOperationType{interfaces.KnOperationTypeEqual},
	)
	cond := BuildSkillQueryCondition("审查", ot, 10)
	if cond != nil {
		t.Error("expected nil when no knn/match/like available")
	}
}
