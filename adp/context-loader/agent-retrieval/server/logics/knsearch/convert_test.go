// Copyright The kweaver.ai Authors.
//
// Licensed under the Apache License, Version 2.0.
// See the LICENSE file in the project root for details.

package knsearch

import (
	"testing"

	"github.com/kweaver-ai/adp/context-loader/agent-retrieval/server/interfaces"
)

func TestRetrievalConfigToLocal_PreservesSchemaBriefFalse(t *testing.T) {
	cfg := &interfaces.RetrievalConfig{
		ConceptRetrieval: &interfaces.ConceptRetrievalConfig{
			TopK:        10,
			SchemaBrief: false,
		},
	}
	local := retrievalConfigToLocal(cfg)
	if local == nil || local.ConceptRetrieval == nil {
		t.Fatalf("expected ConceptRetrieval, got local=%v", local)
	}
	if local.ConceptRetrieval.SchemaBrief == nil {
		t.Fatal("SchemaBrief must be non-nil for explicit false (nil would merge as default true)")
	}
	if *local.ConceptRetrieval.SchemaBrief != false {
		t.Fatalf("SchemaBrief=%v, want false", *local.ConceptRetrieval.SchemaBrief)
	}
}

func TestKnSearchReqToLocal_RetrievalConfigTypedPreservesFalseBools(t *testing.T) {
	req := &interfaces.KnSearchReq{
		Query: "q",
		KnID:  "kn-1",
		RetrievalConfig: &interfaces.RetrievalConfig{
			ConceptRetrieval: &interfaces.ConceptRetrievalConfig{
				TopK:                   5,
				IncludeSampleData:      false,
				SchemaBrief:            false,
				EnablePropertyBrief:    false,
				EnableCoarseRecall:     false,
				PerObjectPropertyTopK:  8,
				GlobalPropertyTopK:     30,
				CoarseObjectLimit:      2000,
				CoarseRelationLimit:    300,
				CoarseMinRelationCount: 5000,
			},
			PropertyFilter: &interfaces.PropertyFilterConfig{
				MaxPropertiesPerInstance: 20,
				MaxPropertyValueLength:   500,
				EnablePropertyFilter:     false,
			},
		},
	}
	local := KnSearchReqToLocal(req)
	if local == nil || local.RetrievalConfig == nil {
		t.Fatal("expected RetrievalConfig on local request")
	}
	cr := local.RetrievalConfig.ConceptRetrieval
	if cr == nil {
		t.Fatal("expected ConceptRetrieval")
	}
	assertBoolPtr(t, "IncludeSampleData", cr.IncludeSampleData, false)
	assertBoolPtr(t, "SchemaBrief", cr.SchemaBrief, false)
	assertBoolPtr(t, "EnablePropertyBrief", cr.EnablePropertyBrief, false)
	assertBoolPtr(t, "EnableCoarseRecall", cr.EnableCoarseRecall, false)
	pf := local.RetrievalConfig.PropertyFilter
	if pf == nil {
		t.Fatal("expected PropertyFilter")
	}
	assertBoolPtr(t, "EnablePropertyFilter", pf.EnablePropertyFilter, false)
}

func assertBoolPtr(t *testing.T, name string, p *bool, want bool) {
	t.Helper()
	if p == nil {
		t.Fatalf("%s: got nil, want %v", name, want)
	}
	if *p != want {
		t.Fatalf("%s: got %v, want %v", name, *p, want)
	}
}
