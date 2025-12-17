### 需要做什么？

- input
    - query
    - data_sources: 检索的时候可以使用此配置项传给全文检索接口（目前没有这个模块）
    - output_concept：可以帮助识别意图（目前没有这个模块）

- output
    - 和文档库问答保持一致：List[Dict[str, Union[str, Dict]]]

### 怎么做

各阶段的配置还是需要配置文件传过来
需要定义各阶段需要哪些配置
定义各阶段的输入输出
还是使用task流来记录各个阶段的数据


### pseudo_code
```
GraphRev():
Input: query q, data_source_field sf, data_source_long_context_field lcsf, output_field otf, aug_field af, fme(from RuleBasedAndConceptModeQA)
Output: graph_rev_output
1. otf = intent_func(q, otf)
2. path_sim_rev_output, entities_pool, rels_pool = 
		parallel(PathSim(q,sf,otf,fme), 
				 GraphRagRetrieval(q, sf, otf))  # 拿到pathsim信息，graph_rag_rev的结果
3. path_sim_rev_output, entities_pool, rels_pool = clean_func(path_sim_rev_output, entity_recall_hits, neigbbor_recall_hits, neigbbor_recall_rels)  # 清洗召回的实体和关系
4. aggregation_output = aggregation_func(path_sim_rev_output, entities_pool, rels_pool, otf)  # 对结果聚合
5. ranking_output = rank_func(aggregation_output)  # 排序
6. graph_rev_output = augmentation_func(ranking_output, af)  # 对结果进行增强
 

GraphRagRetrieval():
Input: query q, data_source_field sf, data_source_long_context_field lcsf, output_field otf
Output: graph_rag_rev_output
1. entity_recall_hits = entity_recall_func(q, sf, lcsf)  # 实体召回
2. neigbbor_recall_hits, neigbbor_recall_rels = neigbbor_recall_func(entity_recall_hits, sf)  # 一度邻居查询


PathSim():
Input: query q, data_source_field sf, output_field otf, fme(from RuleBasedAndConceptModeQA),graph schema sc
Output: path_sim_rev_output

1.过滤边类 r = embedding_prefilter(sc,q)
2.召回2hop邻居路径 p = nebula_neighbor_2hop(fme, r)
3.路径转文本 pt = path2text(p)
3.粗筛后路径 p, pt = coarse_filter(p, pt, q)
4.精排取topn路径 top_p, top_pt = embedding_sort(p, pt, q)
5.LLM过滤答案路径 path_sim_rev_output = LLM(top_p, top_pt) 

```


### 不需要做什么
- 不需要 引用
- 不需要 高亮
- 不需要 来源
