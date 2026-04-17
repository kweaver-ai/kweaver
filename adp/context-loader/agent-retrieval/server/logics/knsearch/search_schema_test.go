package knsearch

import (
	"context"
	"testing"

	infraLogger "github.com/kweaver-ai/adp/context-loader/agent-retrieval/server/infra/logger"
	"github.com/kweaver-ai/adp/context-loader/agent-retrieval/server/interfaces"
)

type stubSearchSchemaLocalService struct {
	resp *interfaces.KnSearchLocalResponse
	err  error
	req  *interfaces.KnSearchLocalRequest
}

func (s *stubSearchSchemaLocalService) Search(_ context.Context, req *interfaces.KnSearchLocalRequest) (*interfaces.KnSearchLocalResponse, error) {
	s.req = req
	return s.resp, s.err
}

func TestSearchSchema_AppliesMaxConceptsPerResourceType(t *testing.T) {
	maxConcepts := 1
	service := &knSearchService{
		Logger: infraLogger.DefaultLogger(),
		LocalSearch: &stubSearchSchemaLocalService{
			resp: &interfaces.KnSearchLocalResponse{
				ObjectTypes: []*interfaces.KnSearchObjectType{
					{ConceptID: "ot_1", ConceptName: "Object 1"},
					{ConceptID: "ot_2", ConceptName: "Object 2"},
					{ConceptID: "ot_3", ConceptName: "Object 3"},
				},
				RelationTypes: []*interfaces.KnSearchRelationType{
					{ConceptID: "rt_1", ConceptName: "Relation 1", SourceObjectTypeID: "ot_1", TargetObjectTypeID: "ot_2"},
					{ConceptID: "rt_2", ConceptName: "Relation 2", SourceObjectTypeID: "ot_2", TargetObjectTypeID: "ot_3"},
					{ConceptID: "rt_3", ConceptName: "Relation 3", SourceObjectTypeID: "ot_3", TargetObjectTypeID: "ot_1"},
				},
				ActionTypes: []*interfaces.KnSearchActionType{
					{ID: "at_1", Name: "Action 1"},
					{ID: "at_2", Name: "Action 2"},
					{ID: "at_3", Name: "Action 3"},
				},
			},
		},
		UseLocalSearch: true,
	}

	resp, err := service.SearchSchema(context.Background(), &interfaces.SearchSchemaReq{
		Query:       "find schema",
		KnID:        "kn-001",
		MaxConcepts: &maxConcepts,
	})
	if err != nil {
		t.Fatalf("SearchSchema returned error: %v", err)
	}

	if got := len(resp.RelationTypes); got != 1 {
		t.Fatalf("RelationTypes len=%d, want 1", got)
	}
	if got := len(resp.ObjectTypes); got != 2 {
		t.Fatalf("ObjectTypes len=%d, want 2 relation endpoint objects", got)
	}
	if got := len(resp.ActionTypes); got != 3 {
		t.Fatalf("ActionTypes len=%d, want all actions", got)
	}

	if got := resp.ObjectTypes[0].(map[string]any)["concept_id"]; got != "ot_1" {
		t.Fatalf("ObjectTypes[0] concept_id=%v, want ot_1", got)
	}
	if got := resp.ObjectTypes[1].(map[string]any)["concept_id"]; got != "ot_2" {
		t.Fatalf("ObjectTypes[1] concept_id=%v, want ot_2", got)
	}
	if got := resp.RelationTypes[0].(map[string]any)["concept_id"]; got != "rt_1" {
		t.Fatalf("RelationTypes[0] concept_id=%v, want rt_1", got)
	}
	if got := resp.ActionTypes[0].(map[string]any)["id"]; got != "at_1" {
		t.Fatalf("ActionTypes[0] id=%v, want at_1", got)
	}
	if got := resp.ActionTypes[2].(map[string]any)["id"]; got != "at_3" {
		t.Fatalf("ActionTypes[2] id=%v, want at_3", got)
	}
}

func TestSearchSchema_LimitsObjectTypesWhenRelationTypesExcluded(t *testing.T) {
	maxConcepts := 1
	includeRelationTypes := false
	service := &knSearchService{
		Logger: infraLogger.DefaultLogger(),
		LocalSearch: &stubSearchSchemaLocalService{
			resp: &interfaces.KnSearchLocalResponse{
				ObjectTypes: []*interfaces.KnSearchObjectType{
					{ConceptID: "ot_1", ConceptName: "Object 1"},
					{ConceptID: "ot_2", ConceptName: "Object 2"},
				},
				RelationTypes: []*interfaces.KnSearchRelationType{
					{ConceptID: "rt_1", ConceptName: "Relation 1", SourceObjectTypeID: "ot_1", TargetObjectTypeID: "ot_2"},
				},
				ActionTypes: []*interfaces.KnSearchActionType{
					{ID: "at_1", Name: "Action 1"},
					{ID: "at_2", Name: "Action 2"},
				},
			},
		},
		UseLocalSearch: true,
	}

	resp, err := service.SearchSchema(context.Background(), &interfaces.SearchSchemaReq{
		Query:       "find schema",
		KnID:        "kn-001",
		MaxConcepts: &maxConcepts,
		SearchScope: &interfaces.SearchSchemaScope{
			IncludeRelationTypes: &includeRelationTypes,
		},
	})
	if err != nil {
		t.Fatalf("SearchSchema returned error: %v", err)
	}

	if got := len(resp.RelationTypes); got != 0 {
		t.Fatalf("RelationTypes len=%d, want 0", got)
	}
	if got := len(resp.ObjectTypes); got != 1 {
		t.Fatalf("ObjectTypes len=%d, want 1", got)
	}
	if got := resp.ObjectTypes[0].(map[string]any)["concept_id"]; got != "ot_1" {
		t.Fatalf("ObjectTypes[0] concept_id=%v, want ot_1", got)
	}
	if got := len(resp.ActionTypes); got != 2 {
		t.Fatalf("ActionTypes len=%d, want all actions", got)
	}
}
