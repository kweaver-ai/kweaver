package drivenadapters

// const (
// 	knID = "kn_hr"
// )

// func mockAgentClient() *agentClient {
// 	return &agentClient{
// 		logger:     logger.DefaultLogger(),
// 		baseURL:    "http://XXX:30777/api/agent-app",
// 		httpClient: rest.NewHTTPClient(),
// 		DeployAgent: config.DeployAgentConfig{
// 			ConceptIntentionAnalysisAgentKey:   "01K5FS890WD4V7M27GAWE1259H",
// 			ConceptRetrievalStrategistAgentKey: "01K5G6JFAVJF94C40K90Y8TJ3B",
// 		},
// 	}
// }

// func mockVisitor() *interfaces.Visitor {
// 	visitor := &interfaces.Visitor{
// 		UserID:      "bdb78b62-6c48-11f0-af96-fa8dcc0a06b2",
// 		VisitorType: "realname",
// 	}
// 	return visitor
// }

// 冒烟测试
// 测试ConceptIntentionAnalysisAgent
// func TestSmokeConceptIntentionAnalysisAgent(t *testing.T) {
// 	cli := mockAgentClient()
// 	visitor := mockVisitor()
// 	req := &interfaces.ConceptIntentionAnalysisAgentReq{
// 		HistoryQuerys: []string{"你好"},
// 		Query:         "请帮我查找薪资在20-30的Java开发工程师",
// 		KnID:          knID,
// 	}
// 	resp, err := cli.ConceptIntentionAnalysisAgent(context.Background(), visitor, req)
// 	if err != nil {
// 		t.Fatalf("ConceptIntentionAnalysisAgent err: %v", err)
// 		return
// 	}
// 	if resp == nil {
// 		t.Fatalf("ConceptIntentionAnalysisAgent resp is nil")
// 		return
// 	}
// 	fmt.Println(utils.ObjectToJSON(resp))
// }
// func TestSmokeConceptRetrievalStrategistAgent(t *testing.T) {
// 	cli := mockAgentClient()
// 	visitor := mockVisitor()
// 	req := &interfaces.ConceptRetrievalStrategistReq{
// 		QueryParam: &interfaces.ConceptRetrievalStrategistQueryParam{
// 			OriginalQuery: "请帮我查找薪资在20-30的Java开发工程师",
// 			CurrentIntentSegment: &interfaces.SemanticQueryIntent{
// 				QuerySegment:      "薪资在20-30k",
// 				Confidence:        0.9,
// 				Reasoning:         "用户明确提到了薪资范围20-30，这是一个具体的筛选条件。",
// 				RequiresReasoning: false,
// 				RelatedConcepts: []*interfaces.KnowledgeConcept{
// 					{
// 						ConceptType: "object_type",
// 						ConceptID:   "basicinfo",
// 						ConceptName: "简历基本信息",
// 					},
// 				},
// 			},
// 		},
// 		KnID:          knID,
// 		HistoryQuerys: []string{"你好"},
// 	}
// 	resp, err := cli.ConceptRetrievalStrategistAgent(context.Background(), visitor, req)
// 	if err != nil {
// 		t.Fatalf("ConceptRetrievalStrategistAgent err: %v", err)
// 		return
// 	}
// 	if resp == nil {
// 		t.Fatalf("ConceptRetrievalStrategistAgent resp is nil")
// 		return
// 	}
// 	fmt.Println(utils.ObjectToJSON(resp))
// }
