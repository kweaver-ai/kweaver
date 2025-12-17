## 1. 文档索引
### 1.1 索引示例
```json
{
	"docid": "gns:xxxx/xxxx", //文档ID
  "basename": "", // 文件名
	"doclib_id": "", // 文档库ID
	"folder_id": [], // 文件目录ID
	"ext_type": ".docx", // 文件扩展名
	"mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // 文件类型
	"parent_path": "gnx:xxxxx", // 父级路径
	"size": 8484848, // 文件大小
	"source": "document_center", // 来源
	"doclib_type": "custom_doc_lib", // 文档库类型

	"creator": "", // 文件创建人ID
	"creator_name": "ghxl", // 文件创建人
	"create_time": 1223384387484, // 文件创建时间
	"editor": "", // 文件编辑人ID
	"editor_name": "", // 文件编辑人
	"modity_time": 2142342342, // 文件编辑时间

	"slice_content": "", // 切片内容
	"segment_id": 0, // 切片分段ID,
	"embedding": [] // 向量结果

}
```
### 1.2 索引结构
```json
{
  "mappings": {
      "dynamic": "strict",
      "properties": {
        "basename": {
          "type": "text",
          "fields": {
            "graph": {
              "type": "text",
              "analyzer": "graph_analyzer"
            },
            "keyword": {
              "type": "keyword"
            },
            "ngram": {
              "type": "text",
              "analyzer": "2ngram_analyzer",
              "search_analyzer": "keyword"
            }
          },
          "analyzer": "as_hanlp_analyzer"
        },
        "slice_content": {
          "type": "text",
          "fields": {
            "alphanumeric": {
              "type": "text",
              "index_options": "offsets",
              "analyzer": "custom_alphanumeric_analyzer"
            }
          },
          "index_options": "offsets",
          "analyzer": "as_hanlp_analyzer"
        },
        "docid": {
          "type": "keyword"
        },
        "doclib_id": {
          "type": "keyword"
        },
        "folder_id": {
          "type": "keyword"
        },
        "ext_type": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "normalizer": "lowercase_normalizer"
            }
          },
          "analyzer": "lower_case_keyword_analyzer"
        },
        "mimetype": {
          "type": "keyword"
        },
        "parent_path": {
          "type": "keyword"
        },
        "size": {
          "type": "long"
        },
        "source": {
          "type": "keyword"
        },
        "doclib_type": {
          "type": "keyword"
        },
        "creator": {
          "type": "keyword"
        },
        "creator_name": {
          "type": "keyword"
        },
        "create_time": {
          "type": "long"
        },
        "editor": {
          "type": "keyword"
        },
        "editor_name": {
          "type": "keyword"
        },
        "modity_time": {
          "type": "long"
        },
        "embedding": {
          "type": "float"
        },
        "embedding_sq": {
          "type": "knn_vector",
          "dimension": 768,
          "data_type": "BYTE",
          "method": {
            "engine": "lucene",
            "space_type": "cosinesimil",
            "name": "hnsw",
            "parameters": {
              "ef_construction": 128,
              "m": 24
            }
          }
        },
        "segment_id": {
          "type": "integer"
        }
      }
    },
    "settings": {
      "index": {
        "replication": {
          "type": "DOCUMENT"
        },
        "max_ngram_diff": "18",
        "number_of_shards": "1",
        "knn.algo_param": {
          "ef_search": "100"
        },
        "similarity": {
          "custom_bm25": {
            "type": "BM25",
            "b": "0.1",
            "k1": "1.2"
          }
        },
        "knn": "true",
        "analysis": {
          "filter": {
            "as_word_delimiter_graph_filter": {
              "split_on_numerics": "false",
              "split_on_case_change": "false",
              "type": "word_delimiter_graph",
              "type_table": [
                ". => DIGIT"
              ],
              "stem_english_possessive": "true"
            },
            "erase_alphanumeric_filter": {
              "pattern": "^(\\d+|[a-zA-Z]+)$",
              "type": "pattern_replace",
              "replacement": ""
            }
          },
          "char_filter": {
            "not_alphanumeric_char_filter": {
              "pattern": "[^a-zA-Z0-9]+",
              "type": "pattern_replace",
              "replacement": " "
            }
          },
          "normalizer": {
            "lowercase_normalizer": {
              "filter": [
                "lowercase",
                "asciifolding"
              ],
              "type": "custom",
              "char_filter": []
            }
          },
          "analyzer": {
            "graph_analyzer": {
              "filter": [
                "lowercase",
                "asciifolding",
                "as_word_delimiter_graph_filter"
              ],
              "tokenizer": "keyword"
            },
            "custom_alphanumeric_analyzer": {
              "filter": [
                "erase_alphanumeric_filter",
                "lowercase",
                "asciifolding"
              ],
              "char_filter": [
                "not_alphanumeric_char_filter"
              ],
              "tokenizer": "whitespace"
            },
            "lower_case_keyword_analyzer": {
              "filter": [
                "lowercase",
                "as_word_delimiter_graph_filter"
              ],
              "type": "custom",
              "tokenizer": "keyword"
            },
            "as_hanlp_analyzer": {
              "filter": [
                "lowercase",
                "asciifolding"
              ],
              "tokenizer": "as_hanlp"
            },
            "2ngram_analyzer": {
              "tokenizer": "2ngram_tokenizer"
            }
          },
          "tokenizer": {
            "2ngram_tokenizer": {
              "token_chars": [
                "letter",
                "digit"
              ],
              "min_gram": "1",
              "type": "ngram",
              "max_gram": "10"
            },
            "as_hanlp": {
              "enable_custom_config": "true",
              "type": "hanlp_index",
              "enable_stop_dictionary": "true"
            }
          }
        },
        "number_of_replicas": "0"
      }
    }
}
```

## 2. 索引写入接口

### 2.1请求示例

```
POST /api/agent-app/v1/document/bulk_index
Content-Type: application/json
X-Op-Request-ID: 1234567890
X-Op-Trace-ID: 1234567890

[
    {
        "docid": "gns:xxxx/xxxx",
        "basename": "test白皮书",
        "doclib_id": "gns:xxxx/xxxx",
        "ext_type": ".docx",
        "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "parent_path": "gnx:xxxxx",
        "size": 8484848,
        "source": "document_center",
        "doclib_type": "custom_doc_lib",
        "creator": "8a471f3a-f4df-11ef-8c8d-8e15b6893f4e",
        "creator_name": "ghxl",
        "create_time": 1223384387484,
        "editor": "8a471f3a-f4df-11ef-8c8d-8e15b6893f4e",
        "editor_name": "ghxl",
        "modity_time": 2142342342,
        "slice_contents": ["第一段切片内容","第二段切片内容"],
        "embeddings": [[1,2,3],[4,5,6]]

    }
]
```

### 2.2 响应示例
response header中返回字段需要包括：
- X-Op-Request-ID: 550e8400-e29b-41d4-a716-446655440000
- X-Op-Trace-ID: trace_abc123
- X-Op-Metrics: {"latency":30,"start":1700998200000,"end":1700998200030}

1. response 200时，表示索引写入成功，response body为空

2. response 为非200时，表示索引写入失败 , response body返回格式如下
```json
{
  "code": "DOMAIN.BadRequest.CATEGORY_REASON",
  "description": "错误的描述信息",
  "solution": "建议的解决方案",
  "detail": {
    // 错误的详细信息，可选
  }
}
```


## 3. 索引召回接口

### 3.1 请求示例
```
GET /api/agent-app/v1/document/search
Content-Type: application/json
X-Op-Request-ID: 1234567890
X-Op-Trace-ID: 1234567890

{
    "query": "白皮书",
    "query_embedding": [],
    "limit": 10
}
```

### 3.2 响应示例
response header中返回字段需要包括：
- X-Op-Request-ID: 550e8400-e29b-41d4-a716-446655440000
- X-Op-Trace-ID: trace_abc123
- X-Op-Metrics: {"latency":30,"start":1700998200000,"end":1700998200030}

1. response 200时，表示索引召回成功，response body返回格式如下
```json
[
    {
        "docid": "gns:xxxx/xxxx",
        "basename": "test白皮书",
        "doclib_id": "gns:xxxx/xxxx",
        "folder_id": [],
        "ext_type": ".docx",
        "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "parent_path": "gnx:xxxxx",
        "size": 8484848,
        "source": "document_center",
        "doclib_type": "custom_doc_lib",
        "slice_contents": [
            {
                "segment_id": 0,
                "slice_content": "第一段切片内容"
            },
            {
                "segment_id": 1,
                "slice_content": "第二段切片内容"
            }
        ]
    }
]
```

2. response 为非200时，表示索引召回失败 , response body返回格式如下
```json
{
  "code": "DOMAIN.BadRequest.CATEGORY_REASON",
  "description": "错误的描述信息",
  "solution": "建议的解决方案",
  "detail": {
    // 错误的详细信息，可选
  }
}
```

