{
  "toolbox": {
    "configs": [
      {
        "box_id": "0ba16abc-e02c-4767-8e7f-c78f427c498b",
        "box_name": "5002_基础结构化数据分析工具箱",
        "box_desc": "支持对结构话数据进行处理的工具箱，工具包含: \n1. json2plot\n2. text2sql\n3. text2ngql\n4. text2metric\n5. sql_helper\n6. knowledge_item\n7. execute_code\n8. execute_command\n9. read_file\n10. create_file\n11. list_files\n12. get_status\n13. close_sandbox\n14. download_from_efast\n15. jupyter_code_executor\n16. content_echo\n17. knowledge_rerank\n18. knowledge_retrieve\n",
        "box_svc_url": "http://data-retrieval:9100",
        "status": "published",
        "category_type": "system",
        "category_name": "系统工具",
        "is_internal": false,
        "source": "custom",
        "tools": [
          {
            "tool_id": "facecf63-d7cb-48f6-9155-a696d01c8414",
            "name": "rerank_tool",
            "description": "概念重排序工具，根据查询意图对概念列表进行重排序",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "6a3f4823-b47d-4534-be90-db84144163b8",
              "summary": "rerank_tool",
              "description": "概念重排序工具，根据查询意图对概念列表进行重排序",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/knowledge_rerank",
              "method": "POST",
              "create_time": 1760169925654488000,
              "update_time": 1760169925654488000,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "example": {
                        "action": "llm",
                        "batch_size": 128,
                        "concepts": [
                          {
                            "description": "产品的销售金额",
                            "id": "concept_1",
                            "name": "销售额",
                            "properties": {},
                            "type": "metric"
                          }
                        ],
                        "query_understanding": {
                          "intent": [
                            {
                              "confidence": 0.9,
                              "description": "数据分析意图",
                              "type": "analysis"
                            }
                          ],
                          "origin_query": "分析销售数据中的趋势",
                          "processed_query": "分析销售数据中的趋势"
                        }
                      },
                      "schema": {
                        "properties": {
                          "action": {
                            "default": "llm",
                            "description": "重排序方法",
                            "enum": [
                              "llm",
                              "vector"
                            ],
                            "type": "string"
                          },
                          "batch_size": {
                            "default": 128,
                            "description": "批处理大小",
                            "type": "integer"
                          },
                          "concepts": {
                            "description": "需要重排序的概念列表",
                            "items": {
                              "type": "object"
                            },
                            "type": "array"
                          },
                          "query_understanding": {
                            "description": "查询理解结果",
                            "properties": {
                              "intent": {
                                "description": "意图列表",
                                "items": {
                                  "properties": {
                                    "confidence": {
                                      "type": "number"
                                    },
                                    "description": {
                                      "type": "string"
                                    },
                                    "type": {
                                      "type": "string"
                                    }
                                  },
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "origin_query": {
                                "description": "原始查询文本",
                                "type": "string"
                              },
                              "processed_query": {
                                "description": "处理后的查询文本",
                                "type": "string"
                              }
                            },
                            "required": [
                              "origin_query"
                            ],
                            "type": "object"
                          }
                        },
                        "required": [
                          "query_understanding",
                          "concepts"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": [
                          {
                            "description": "产品的销售金额",
                            "id": "concept_1",
                            "name": "销售额",
                            "properties": {},
                            "rerank_score": 0.95,
                            "type": "metric"
                          }
                        ],
                        "schema": {
                          "description": "重排序后的概念列表",
                          "items": {
                            "properties": {
                              "description": {
                                "type": "string"
                              },
                              "id": {
                                "type": "string"
                              },
                              "name": {
                                "type": "string"
                              },
                              "properties": {
                                "type": "object"
                              },
                              "rerank_score": {
                                "type": "number"
                              },
                              "type": {
                                "type": "string"
                              }
                            },
                            "type": "object"
                          },
                          "type": "array"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925655195400,
            "update_time": 1760169948297918000,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "6a3f4823-b47d-4534-be90-db84144163b8",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "4aea0631-d615-4d24-b901-7629f5da04b7",
            "name": "close_sandbox",
            "description": "清理沙箱工作区，关闭沙箱连接",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "0f6e395f-b5d3-4234-9a46-7a9f8e3be59b",
              "summary": "close_sandbox",
              "description": "清理沙箱工作区，关闭沙箱连接",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/close_sandbox",
              "method": "POST",
              "create_time": 1760169925656577800,
              "update_time": 1760169925656577800,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "close_sandbox": {
                          "description": "清理沙箱工作区，关闭沙箱连接",
                          "summary": "清理工作区",
                          "value": {
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925657177000,
            "update_time": 1760169947152240400,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "0f6e395f-b5d3-4234-9a46-7a9f8e3be59b",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "e125f55a-de57-4474-97e3-e4c5e3c9de10",
            "name": "download_from_efast",
            "description": "从文档库(EFAST)下载文件到沙箱环境，支持批量下载多个文件。需要提供文件参数列表，格式为[{'id': '...', 'type': 'doc', 'name': '...', 'details': {'docid': 'gns://...', 'size': ...}}]",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "d93c4403-e406-49d9-8b6c-1caba4e76166",
              "summary": "download_from_efast",
              "description": "从文档库(EFAST)下载文件到沙箱环境，支持批量下载多个文件。需要提供文件参数列表，格式为[{'id': '...', 'type': 'doc', 'name': '...', 'details': {'docid': 'gns://...', 'size': ...}}]",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/download_from_efast",
              "method": "POST",
              "create_time": 1760169925657730600,
              "update_time": 1760169925657730600,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "multiple_files": {
                          "description": "从文档库(EFAST)批量下载多个文件",
                          "summary": "批量下载文件",
                          "value": {
                            "file_params": [
                              {
                                "details": {
                                  "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/5CB5AA515EBD4CB785918D43982FCE42",
                                  "size": 15635
                                },
                                "id": "5CB5AA515EBD4CB785918D43982FCE42",
                                "name": "新能源汽车产业分析 (10).docx",
                                "type": "doc"
                              },
                              {
                                "details": {
                                  "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/6CB5AA515EBD4CB785918D43982FCE43",
                                  "size": 24567
                                },
                                "id": "6CB5AA515EBD4CB785918D43982FCE43",
                                "name": "市场分析报告.pdf",
                                "type": "doc"
                              }
                            ],
                            "save_path": "",
                            "server_url": "",
                            "session_id": "test_session_123",
                            "timeout": 600,
                            "token": "1234567890"
                          }
                        },
                        "single_file": {
                          "description": "从文档库(EFAST)下载单个文件",
                          "summary": "下载单个文件",
                          "value": {
                            "efast_url": "https://efast.example.com",
                            "file_params": [
                              {
                                "details": {
                                  "docid": "gns://00328E97423F42AC9DEE87B4F4B4631E/83D893844A0B4A34A64DFFB343BEF416/5CB5AA515EBD4CB785918D43982FCE42",
                                  "size": 15635
                                },
                                "id": "5CB5AA515EBD4CB785918D43982FCE42",
                                "name": "新能源汽车产业分析 (10).docx",
                                "type": "doc"
                              }
                            ],
                            "save_path": "",
                            "server_url": "",
                            "session_id": "test_session_123",
                            "timeout": 300,
                            "token": "1234567890"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "efast_url": {
                            "description": "EFAST地址，可选，默认使用默认URL",
                            "type": "string"
                          },
                          "file_params": {
                            "description": "下载文件参数列表",
                            "items": {
                              "properties": {
                                "details": {
                                  "properties": {
                                    "docid": {
                                      "description": "完整的文档ID",
                                      "type": "string"
                                    },
                                    "size": {
                                      "description": "文件大小",
                                      "type": "integer"
                                    }
                                  },
                                  "required": [
                                    "docid"
                                  ],
                                  "type": "object"
                                },
                                "id": {
                                  "description": "文档ID",
                                  "type": "string"
                                },
                                "name": {
                                  "description": "文档名称",
                                  "type": "string"
                                },
                                "type": {
                                  "description": "文档类型",
                                  "type": "string"
                                }
                              },
                              "required": [
                                "details"
                              ],
                              "type": "object"
                            },
                            "type": "array"
                          },
                          "save_path": {
                            "description": "保存路径，可选，默认保存到会话目录",
                            "type": "string"
                          },
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 300,
                            "description": "超时时间(秒)，可选，默认300秒",
                            "type": "integer"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          },
                          "token": {
                            "description": "认证令牌",
                            "type": "string"
                          }
                        },
                        "required": [
                          "file_params"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925658324000,
            "update_time": 1760169946375514400,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "d93c4403-e406-49d9-8b6c-1caba4e76166",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "58c22262-b6c9-4965-83d3-572c94911023",
            "name": "knowledge_item",
            "description": "根据输入的文本，获取知识条目信息，知识条目可用于为其他工具提供背景知识",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "cf7be4b4-74d1-4318-a329-5a6c08c9f099",
              "summary": "knowledge_item",
              "description": "根据输入的文本，获取知识条目信息，知识条目可用于为其他工具提供背景知识",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/knowledge_item",
              "method": "POST",
              "create_time": 1760169925658930700,
              "update_time": 1760169925658930700,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "example": {
                        "data_source": {
                          "base_url": "https://xxxxx",
                          "data_item_ids": [
                            "data_item_id"
                          ],
                          "token": "",
                          "user_id": ""
                        },
                        "input": "用户需要查询的文本"
                      },
                      "schema": {
                        "properties": {
                          "config": {
                            "description": "工具配置参数",
                            "properties": {
                              "knowledge_item_limit": {
                                "default": 5,
                                "description": "知识条目个数限制，-1 代表不限制，默认 5",
                                "type": "integer"
                              },
                              "return_data_limit": {
                                "default": -1,
                                "description": "每个知识条目返回数据总量限制，-1 代表不限制",
                                "type": "integer"
                              },
                              "return_record_limit": {
                                "default": 30,
                                "description": "每个知识条目返回数据条数限制，-1 代表不限制",
                                "type": "integer"
                              }
                            },
                            "type": "object"
                          },
                          "data_source": {
                            "description": "数据源配置信息",
                            "properties": {
                              "base_url": {
                                "description": "服务器地址",
                                "type": "string"
                              },
                              "data_item_ids": {
                                "description": "知识条目ID列表",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "token": {
                                "description": "认证令牌",
                                "type": "string"
                              },
                              "user_id": {
                                "description": "用户ID",
                                "type": "string"
                              }
                            },
                            "required": [
                              "data_item_ids"
                            ],
                            "type": "object"
                          },
                          "input": {
                            "description": "用户需要查询的文本",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 30,
                            "description": "超时时间",
                            "type": "number"
                          }
                        },
                        "required": [
                          "data_source"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "output": [
                            {
                              "comment": "知识条目描述",
                              "data_summary": {
                                "real_data_num": 10,
                                "return_data_num": 2
                              },
                              "items": {
                                "key1": "value1",
                                "key2": "value2"
                              },
                              "name": "知识条目名称",
                              "type": "kv_dict"
                            },
                            {
                              "comment": "知识条目描述",
                              "data_summary": {
                                "real_data_num": 5,
                                "return_data_num": 1
                              },
                              "items": [
                                {
                                  "comment": "知识条目描述",
                                  "key": "知识条目名称",
                                  "value": "知识条目值"
                                }
                              ],
                              "name": "列表类型知识条目",
                              "type": "list"
                            }
                          ],
                          "time": "14.328890085220337",
                          "tokens": "100"
                        },
                        "schema": {
                          "properties": {
                            "output": {
                              "items": {
                                "properties": {
                                  "comment": {
                                    "description": "知识条目描述",
                                    "type": "string"
                                  },
                                  "data_summary": {
                                    "properties": {
                                      "real_data_num": {
                                        "description": "实际数据条数",
                                        "type": "integer"
                                      },
                                      "return_data_num": {
                                        "description": "返回数据条数",
                                        "type": "integer"
                                      }
                                    },
                                    "type": "object"
                                  },
                                  "items": {
                                    "oneOf": [
                                      {
                                        "additionalProperties": {
                                          "type": "string"
                                        },
                                        "description": "键值对类型知识条目",
                                        "type": "object"
                                      },
                                      {
                                        "description": "列表类型知识条目",
                                        "items": {
                                          "properties": {
                                            "comment": {
                                              "description": "知识条目描述",
                                              "type": "string"
                                            },
                                            "key": {
                                              "description": "知识条目键",
                                              "type": "string"
                                            },
                                            "value": {
                                              "description": "知识条目值",
                                              "type": "string"
                                            }
                                          },
                                          "type": "object"
                                        },
                                        "type": "array"
                                      }
                                    ]
                                  },
                                  "name": {
                                    "description": "知识条目名称",
                                    "type": "string"
                                  },
                                  "type": {
                                    "description": "知识条目类型",
                                    "type": "string"
                                  }
                                },
                                "type": "object"
                              },
                              "type": "array"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925659935000,
            "update_time": 1760169945686431700,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "cf7be4b4-74d1-4318-a329-5a6c08c9f099",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "bd2c5817-68da-436c-96e5-c5b212b967a5",
            "name": "text2sql",
            "description": "根据用户输入的文本和数据视图信息来生成 SQL 语句，并查询数据库。注意: input参数只接受问题，不接受SQL。工具具有更优秀的SQL生成能力，你只需要告诉工具需要查询的内容即可。有时用户只需要生成SQL，不需要查询，需要给出解释\n注意：为了节省 token 数，输出的结果可能不完整，这是正常情况。data_desc 对象来记录返回数据条数和实际结果条数",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "f7b196ad-9a97-41ef-ae77-e8bac88b83fa",
              "summary": "text2sql",
              "description": "根据用户输入的文本和数据视图信息来生成 SQL 语句，并查询数据库。注意: input参数只接受问题，不接受SQL。工具具有更优秀的SQL生成能力，你只需要告诉工具需要查询的内容即可。有时用户只需要生成SQL，不需要查询，需要给出解释\n注意：为了节省 token 数，输出的结果可能不完整，这是正常情况。data_desc 对象来记录返回数据条数和实际结果条数",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/text2sql",
              "method": "POST",
              "create_time": 1760169925660521700,
              "update_time": 1760169925660521700,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "example": {
                        "action": "gen_exec",
                        "config": {
                          "background": "",
                          "dimension_num_limit": 10,
                          "force_limit": 1000,
                          "get_desc_from_datasource": false,
                          "only_essential_dim": true,
                          "recall_mode": "keyword_vector_retrieval",
                          "retry_times": 3,
                          "return_data_limit": 1000,
                          "return_record_limit": 10,
                          "rewrite_query": false,
                          "session_id": "123",
                          "session_type": "in_memory",
                          "show_sql_graph": false,
                          "view_num_limit": 5
                        },
                        "data_source": {
                          "base_url": "https://xxxxx",
                          "kg": [
                            {
                              "fields": [
                                "regions",
                                "comments"
                              ],
                              "kg_id": "129"
                            }
                          ],
                          "kn_id": "",
                          "recall_mode": "keyword_vector_retrieval",
                          "search_scope": [
                            "object_types",
                            "relation_types",
                            "action_types"
                          ],
                          "token": "",
                          "user_id": "",
                          "view_list": [
                            "view_id"
                          ]
                        },
                        "infos": {
                          "action": "gen_exec",
                          "extra_info": "",
                          "knowledge_enhanced_information": {}
                        },
                        "inner_llm": {
                          "frequency_penalty": 0,
                          "id": "1935601639213895680",
                          "max_tokens": 1000,
                          "name": "doubao-seed-1.6-flash",
                          "presence_penalty": 0,
                          "temperature": 1,
                          "top_k": 1,
                          "top_p": 1
                        },
                        "input": "去年的业绩",
                        "llm": {
                          "max_tokens": 4000,
                          "model_name": "Model Name",
                          "openai_api_base": "http://xxxx",
                          "openai_api_key": "******",
                          "temperature": 0.1
                        }
                      },
                      "schema": {
                        "properties": {
                          "action": {
                            "default": "gen_exec",
                            "description": "工具行为类型",
                            "enum": [
                              "gen",
                              "gen_exec",
                              "show_ds"
                            ],
                            "type": "string"
                          },
                          "config": {
                            "description": "工具配置参数",
                            "properties": {
                              "background": {
                                "description": "背景信息",
                                "type": "string"
                              },
                              "dimension_num_limit": {
                                "default": 30,
                                "description": "维度数量限制，-1表示不限制, 系统默认为 30",
                                "type": "integer"
                              },
                              "force_limit": {
                                "default": 1000,
                                "description": "返回数据条数限制，-1表示不限制, 默认1000",
                                "type": "integer"
                              },
                              "get_desc_from_datasource": {
                                "default": true,
                                "description": "是否从数据源获取描述",
                                "type": "boolean"
                              },
                              "only_essential_dim": {
                                "default": true,
                                "description": "是否只展示必要的维度",
                                "type": "boolean"
                              },
                              "retry_times": {
                                "default": 3,
                                "description": "重试次数",
                                "type": "integer"
                              },
                              "return_data_limit": {
                                "default": -1,
                                "description": "返回数据总量限制，-1表示不限制",
                                "type": "integer"
                              },
                              "return_record_limit": {
                                "default": -1,
                                "description": "返回数据条数限制，-1表示不限制",
                                "type": "integer"
                              },
                              "rewrite_query": {
                                "default": false,
                                "description": "是否重写查询",
                                "type": "boolean"
                              },
                              "session_id": {
                                "description": "会话ID",
                                "type": "string"
                              },
                              "session_type": {
                                "default": "redis",
                                "description": "会话类型",
                                "enum": [
                                  "in_memory",
                                  "redis"
                                ],
                                "type": "string"
                              },
                              "show_sql_graph": {
                                "default": false,
                                "description": "是否显示SQL图",
                                "type": "boolean"
                              },
                              "view_num_limit": {
                                "default": 5,
                                "description": "引用视图数量限制，-1表示不限制",
                                "type": "integer"
                              }
                            },
                            "type": "object"
                          },
                          "data_source": {
                            "description": "视图配置信息",
                            "properties": {
                              "base_url": {
                                "description": "服务器地址",
                                "type": "string"
                              },
                              "kg": {
                                "description": "知识图谱配置参数，用于从知识图谱中获取数据源",
                                "items": {
                                  "properties": {
                                    "fields": {
                                      "description": "用户选中的实体字段列表",
                                      "items": {
                                        "type": "string"
                                      },
                                      "type": "array"
                                    },
                                    "kg_id": {
                                      "description": "知识图谱ID",
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "kg_id",
                                    "fields"
                                  ],
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "kn": {
                                "description": "知识网络配置参数",
                                "items": {
                                  "properties": {
                                    "knowledge_network_id": {
                                      "description": "知识网络ID",
                                      "type": "string"
                                    },
                                    "object_types": {
                                      "description": "知识网络对象类型",
                                      "items": {
                                        "type": "string"
                                      },
                                      "type": "array"
                                    }
                                  },
                                  "required": [
                                    "knowledge_network_id"
                                  ],
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "recall_mode": {
                                "default": "keyword_vector_retrieval",
                                "description": "召回模式，支持 keyword_vector_retrieval(默认), agent_intent_planning, agent_intent_retrieval",
                                "enum": [
                                  "keyword_vector_retrieval",
                                  "agent_intent_planning",
                                  "agent_intent_retrieval"
                                ],
                                "type": "string"
                              },
                              "search_scope": {
                                "description": "知识网络搜索范围，支持 object_types, relation_types, action_types",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "token": {
                                "description": "认证令牌",
                                "type": "string"
                              },
                              "user_id": {
                                "description": "用户ID",
                                "type": "string"
                              },
                              "view_list": {
                                "description": "逻辑视图ID列表",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "visitor_type": {
                                "default": "user",
                                "description": "调用者的类型，user 代表普通用户，app 代表应用账号",
                                "enum": [
                                  "user",
                                  "app"
                                ],
                                "type": "string"
                              }
                            },
                            "type": "object"
                          },
                          "infos": {
                            "description": "额外的输入信息, 包含额外信息和知识增强信息",
                            "properties": {
                              "action": {
                                "default": "gen_exec",
                                "description": "工具行为类型",
                                "enum": [
                                  "gen",
                                  "gen_exec",
                                  "show_ds"
                                ],
                                "type": "string"
                              },
                              "extra_info": {
                                "description": "额外信息(非知识增强)",
                                "type": "string"
                              },
                              "knowledge_enhanced_information": {
                                "description": "知识增强信息",
                                "type": "object"
                              }
                            },
                            "type": "object"
                          },
                          "inner_llm": {
                            "description": "内部语言模型配置",
                            "type": "object"
                          },
                          "input": {
                            "description": "用户输入的自然语言查询",
                            "type": "string"
                          },
                          "llm": {
                            "description": "语言模型配置",
                            "properties": {
                              "max_tokens": {
                                "description": "最大生成令牌数",
                                "type": "integer"
                              },
                              "model_name": {
                                "description": "模型名称",
                                "type": "string"
                              },
                              "openai_api_base": {
                                "description": "OpenAI API基础URL",
                                "type": "string"
                              },
                              "openai_api_key": {
                                "description": "OpenAI API密钥",
                                "type": "string"
                              },
                              "temperature": {
                                "description": "生成温度参数",
                                "type": "number"
                              }
                            },
                            "type": "object"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          }
                        },
                        "required": [
                          "data_source",
                          "input",
                          "action"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "output": {
                            "cites": [
                              {
                                "description": "XX 视图描述",
                                "id": "VIEW_ID",
                                "name": "XX 视图",
                                "type": "data_view"
                              }
                            ],
                            "data": [
                              {
                                "品牌": "XX 品牌",
                                "日期": "2024-01-01",
                                "销量": 200
                              }
                            ],
                            "data_desc": {
                              "real_records_num": 1,
                              "return_records_num": 1
                            },
                            "explanation": {
                              "XX 视图": [
                                {
                                  "指标": "XX 销量"
                                },
                                {
                                  "日期": "XX 日期范围"
                                },
                                {
                                  "品牌": "XX 品牌"
                                }
                              ]
                            },
                            "result_cache_key": "RESULT_CACHE_KEY",
                            "sql": "SELECT ... FROM ... WHERE ... LIMIT 100",
                            "title": "XX 标题"
                          },
                          "time": "14.328890085220337",
                          "tokens": "100"
                        },
                        "schema": {
                          "properties": {
                            "cites": {
                              "description": "引用的数据视图",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "data": {
                              "description": "查询结果数据",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "data_desc": {
                              "description": "数据描述信息",
                              "properties": {
                                "real_records_num": {
                                  "description": "实际记录数",
                                  "type": "integer"
                                },
                                "return_records_num": {
                                  "description": "返回记录数",
                                  "type": "integer"
                                }
                              },
                              "type": "object"
                            },
                            "explanation": {
                              "description": "SQL解释",
                              "type": "object"
                            },
                            "result_cache_key": {
                              "description": "结果缓存键",
                              "type": "string"
                            },
                            "sql": {
                              "description": "生成的SQL语句",
                              "type": "string"
                            },
                            "title": {
                              "description": "查询标题",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925661168400,
            "update_time": 1760169943288813000,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "f7b196ad-9a97-41ef-ae77-e8bac88b83fa",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "516120a0-845c-4ce6-82df-d7d04f50456a",
            "name": "execute_command",
            "description": "在沙箱环境中执行系统命令，如 ls、cat、grep 等 Linux 命令",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "c675be85-38f1-4d4b-8511-d2e1e9c4d233",
              "summary": "execute_command",
              "description": "在沙箱环境中执行系统命令，如 ls、cat、grep 等 Linux 命令",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/execute_command",
              "method": "POST",
              "create_time": 1760169925661645000,
              "update_time": 1760169925661645000,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "list_files": {
                          "description": "列出当前目录下的所有文件",
                          "summary": "列出文件",
                          "value": {
                            "args": [
                              "-la"
                            ],
                            "command": "ls",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        },
                        "search_content": {
                          "description": "在文件中搜索指定内容",
                          "summary": "搜索内容",
                          "value": {
                            "args": [
                              "-n",
                              "print",
                              "*.py"
                            ],
                            "command": "grep",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        },
                        "view_file": {
                          "description": "查看指定文件的内容",
                          "summary": "查看文件内容",
                          "value": {
                            "args": [
                              "hello.py"
                            ],
                            "command": "cat",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "args": {
                            "description": "命令参数列表",
                            "items": {
                              "type": "string"
                            },
                            "type": "array"
                          },
                          "command": {
                            "description": "要执行的系统命令",
                            "type": "string"
                          },
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "required": [
                          "command"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925662162000,
            "update_time": 1760169941776603600,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "c675be85-38f1-4d4b-8511-d2e1e9c4d233",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "b6a33035-fcc5-49d1-bba5-0cebd1de90c0",
            "name": "json2plot",
            "description": "根据绘图参数生成用于前端展示的 JSON 对象。如果包含此工具，则优先使用此工具绘图\n\n调用方法是 `json2plot(title, chart_type, group_by, data_field, tool_result_cache_key)`\n\n**注意：**\n- 你拿到结果后, 不需要给用户展示这个 JSON 对象, 前端会自动画图",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "189b62ec-bf6a-40a7-a7c4-b301497339c8",
              "summary": "json2plot",
              "description": "根据绘图参数生成用于前端展示的 JSON 对象。如果包含此工具，则优先使用此工具绘图\n\n调用方法是 `json2plot(title, chart_type, group_by, data_field, tool_result_cache_key)`\n\n**注意：**\n- 你拿到结果后, 不需要给用户展示这个 JSON 对象, 前端会自动画图",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/json2plot",
              "method": "POST",
              "create_time": 1760169925662649000,
              "update_time": 1760169925662649000,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "example": {
                          "chart_type": "Line",
                          "data": [],
                          "data_field": "营收收入指标",
                          "group_by": [
                            "报告时间(按年)"
                          ],
                          "session_id": "123",
                          "session_type": "in_memory",
                          "title": "2024年1月1日到2024年1月3日，每天的销售额",
                          "tool_result_cache_key": ""
                        },
                        "properties": {
                          "chart_type": {
                            "description": "图表的类型, 输出仅支持三种: Pie, Line, Column, 环形图也属于 Pie",
                            "enum": [
                              "Pie",
                              "Line",
                              "Column"
                            ],
                            "type": "string"
                          },
                          "data": {
                            "description": "图表数据",
                            "items": {
                              "additionalProperties": {
                                "type": [
                                  "string",
                                  "number"
                                ]
                              },
                              "type": "object"
                            },
                            "type": "array"
                          },
                          "data_field": {
                            "description": "数据字段，注意设置的 group_by 和 data_field 必须和数据匹配，不要自己生成，如果数据中没有，可以询问用户",
                            "type": "string"
                          },
                          "group_by": {
                            "description": "\n分组字段列表，支持多个字段，如果有时间字段，请放在第一位。另外:\n- 对于折线图, group_by 可能有1~2个值, 第一个是 x 轴, 第二个字段是 分组, data_field 是 y 轴\n- 对于柱状图, group_by 可能有1~3个值, 第一个是 x 轴, 第二个字段是 堆叠, 第三个字段是 分组, data_field 是 y 轴\n- 对于饼图, group_by 只有一个值, 即 colorField, data_field 是 angleField\n",
                            "items": {
                              "type": "string"
                            },
                            "type": "array"
                          },
                          "session_id": {
                            "description": "会话ID",
                            "type": "string"
                          },
                          "session_type": {
                            "default": "redis",
                            "description": "会话类型",
                            "enum": [
                              "in_memory",
                              "redis"
                            ],
                            "type": "string"
                          },
                          "timeout": {
                            "default": 30,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "和数据的 title 保持一致, 是一个字符串, **不是dict**",
                            "type": "string"
                          },
                          "tool_result_cache_key": {
                            "description": "text2metric 或 text2sql工具缓存 key, 其他工具的结果没有意义，key 是一个字符串, 与 data 不能同时设置",
                            "type": "string"
                          }
                        },
                        "required": [
                          "title",
                          "chart_type",
                          "group_by",
                          "data_field"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "output": {
                            "chart_config": {
                              "chart_type": "Column",
                              "groupField": "",
                              "seriesField": "报告类型",
                              "xField": "报告时间(按年)",
                              "yField": "营收收入指标"
                            },
                            "config": {
                              "angleField": "",
                              "chart_type": "Column",
                              "colorField": "",
                              "xField": "报告时间(按年)",
                              "yField": "营收收入指标"
                            },
                            "data_sample": [
                              {
                                "报告时间(按年)": "2015",
                                "报告类型": "一季报",
                                "营收收入指标": 12312312
                              }
                            ],
                            "result_cache_key": "CACHE_KEY",
                            "title": "2024年1月1日到2024年1月3日，每天的销售额"
                          }
                        },
                        "schema": {
                          "properties": {
                            "chart_config": {
                              "description": "详细图表配置",
                              "type": "object"
                            },
                            "config": {
                              "description": "基础图表配置",
                              "type": "object"
                            },
                            "data_sample": {
                              "description": "数据样例",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "result_cache_key": {
                              "description": "结果缓存键",
                              "type": "string"
                            },
                            "title": {
                              "description": "图表标题",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925665180400,
            "update_time": 1760169941069134600,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "189b62ec-bf6a-40a7-a7c4-b301497339c8",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "fdce657f-e11a-48d0-b144-e5abd2e24ed8",
            "name": "retrieval_tool",
            "description": "基于知识网络的智能检索工具，能够根据用户问题检索相关的知识网络、对象类型和关系类型",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "fd8db246-b37c-4bf7-a307-2def211b2bd7",
              "summary": "retrieval_tool",
              "description": "基于知识网络的智能检索工具，能够根据用户问题检索相关的知识网络、对象类型和关系类型",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/knowledge_retrieve",
              "method": "POST",
              "create_time": 1760169925665668900,
              "update_time": 1760169925665668900,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "x-user",
                    "in": "header",
                    "description": "用户标识符",
                    "required": true,
                    "schema": {
                      "type": "string"
                    }
                  },
                  {
                    "name": "Content-Type",
                    "in": "header",
                    "description": "内容类型",
                    "required": false,
                    "schema": {
                      "default": "application/json",
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "example": {
                        "query": "查询化工企业使用的催化剂信息",
                        "top_k": 10
                      },
                      "schema": {
                        "properties": {
                          "headers": {
                            "description": "HTTP请求头",
                            "nullable": true,
                            "type": "object"
                          },
                          "kn_id": {
                            "description": "指定的知识网络ID，如果不传则检索所有知识网络",
                            "nullable": true,
                            "type": "string"
                          },
                          "query": {
                            "description": "用户查询问题",
                            "type": "string"
                          },
                          "top_k": {
                            "default": 10,
                            "description": "返回最相关的概念类型数量",
                            "type": "integer"
                          }
                        },
                        "required": [
                          "query"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "answer": [
                            {
                              "concept_id": "chemical",
                              "concept_name": "物质物料",
                              "concept_type": "object_type",
                              "source_object_type_id": null,
                              "target_object_type_id": null
                            },
                            {
                              "concept_id": "catalyzer",
                              "concept_name": "催化剂",
                              "concept_type": "object_type",
                              "source_object_type_id": null,
                              "target_object_type_id": null
                            },
                            {
                              "concept_id": "chemical_2_catalyzer",
                              "concept_name": "可作为催化剂",
                              "concept_type": "relation_type",
                              "source_object_type_id": "chemical",
                              "target_object_type_id": "catalyzer"
                            }
                          ],
                          "time": 1.23
                        },
                        "schema": {
                          "properties": {
                            "answer": {
                              "description": "检索结果",
                              "items": {
                                "properties": {
                                  "concept_id": {
                                    "description": "概念ID",
                                    "type": "string"
                                  },
                                  "concept_name": {
                                    "description": "概念名称",
                                    "type": "string"
                                  },
                                  "concept_type": {
                                    "description": "概念类型: object_type 或 relation_type",
                                    "type": "string"
                                  },
                                  "source_object_type_id": {
                                    "description": "源对象类型ID（仅关系类型有）",
                                    "nullable": true,
                                    "type": "string"
                                  },
                                  "target_object_type_id": {
                                    "description": "目标对象类型ID（仅关系类型有）",
                                    "nullable": true,
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "concept_type",
                                  "concept_id",
                                  "concept_name"
                                ],
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "time": {
                              "description": "执行时间",
                              "type": "number"
                            }
                          },
                          "required": [
                            "answer",
                            "time"
                          ],
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925666198300,
            "update_time": 1760169940304347600,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "fd8db246-b37c-4bf7-a307-2def211b2bd7",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "547c38af-c3fd-4326-a3b5-66fc4eaf0ca2",
            "name": "text2metric",
            "description": "根据文本生成指标查询参数, 并查询指标数据",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "d824c093-798e-45d1-82ee-a6ce57e4c457",
              "summary": "text2metric",
              "description": "根据文本生成指标查询参数, 并查询指标数据",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/text2metric",
              "method": "POST",
              "create_time": 1760169925666643500,
              "update_time": 1760169925666643500,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "schema": {
                        "properties": {
                          "action": {
                            "default": "query",
                            "description": "操作类型：show_ds 显示数据源信息，query 执行查询（默认）",
                            "enum": [
                              "show_ds",
                              "query"
                            ],
                            "type": "string"
                          },
                          "config": {
                            "description": "工具配置参数",
                            "properties": {
                              "background": {
                                "description": "背景信息",
                                "type": "string"
                              },
                              "force_limit": {
                                "default": 1000,
                                "description": "返回数据条数限制，-1表示不限制, 系统默认为 1000",
                                "type": "integer"
                              },
                              "get_desc_from_datasource": {
                                "default": true,
                                "description": "是否从数据源获取描述",
                                "type": "boolean"
                              },
                              "return_data_limit": {
                                "default": 5000,
                                "description": "返回数据总量限制，-1表示不限制, 剩余的数据将通过缓存键获取, 系统默认为 5000",
                                "type": "integer"
                              },
                              "return_record_limit": {
                                "default": 100,
                                "description": "返回数据条数限制，-1表示不限制, 系统默认为 100",
                                "type": "integer"
                              },
                              "session_id": {
                                "description": "会话ID",
                                "type": "string"
                              },
                              "session_type": {
                                "default": "redis",
                                "description": "会话类型",
                                "enum": [
                                  "in_memory",
                                  "redis"
                                ],
                                "type": "string"
                              }
                            },
                            "type": "object"
                          },
                          "data_source": {
                            "description": "数据源配置信息",
                            "properties": {
                              "base_url": {
                                "description": "服务器地址",
                                "type": "string"
                              },
                              "kn": {
                                "description": "知识网络配置参数",
                                "items": {
                                  "properties": {
                                    "knowledge_network_id": {
                                      "description": "知识网络ID",
                                      "type": "string"
                                    },
                                    "object_types": {
                                      "description": "知识网络对象类型",
                                      "items": {
                                        "type": "string"
                                      },
                                      "type": "array"
                                    }
                                  },
                                  "required": [
                                    "knowledge_network_id"
                                  ],
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "metric_list": {
                                "description": "指标ID列表",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "recall_mode": {
                                "default": "keyword_vector_retrieval",
                                "description": "召回模式，支持 keyword_vector_retrieval(默认), agent_intent_planning, agent_intent_retrieval",
                                "enum": [
                                  "keyword_vector_retrieval",
                                  "agent_intent_planning",
                                  "agent_intent_retrieval"
                                ],
                                "type": "string"
                              },
                              "search_scope": {
                                "description": "知识网络搜索范围，支持 object_types, relation_types, action_types",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "token": {
                                "description": "认证令牌",
                                "type": "string"
                              },
                              "user_id": {
                                "description": "用户ID",
                                "type": "string"
                              },
                              "visitor_type": {
                                "default": "user",
                                "description": "调用者的类型，user 代表普通用户，app 代表应用账号",
                                "enum": [
                                  "user",
                                  "app"
                                ],
                                "type": "string"
                              }
                            },
                            "type": "object"
                          },
                          "infos": {
                            "description": "额外的输入信息, 包含额外信息和知识增强信息",
                            "properties": {
                              "extra_info": {
                                "description": "额外信息(非知识增强)",
                                "type": "string"
                              },
                              "knowledge_enhanced_information": {
                                "description": "知识增强信息",
                                "type": "object"
                              }
                            },
                            "type": "object"
                          },
                          "inner_llm": {
                            "description": "内部语言模型配置",
                            "type": "object"
                          },
                          "input": {
                            "description": "用户输入的自然语言查询",
                            "type": "string"
                          },
                          "llm": {
                            "description": "语言模型配置",
                            "properties": {
                              "max_tokens": {
                                "description": "最大生成令牌数",
                                "type": "integer"
                              },
                              "model_name": {
                                "description": "模型名称",
                                "type": "string"
                              },
                              "openai_api_base": {
                                "description": "OpenAI API基础URL",
                                "type": "string"
                              },
                              "openai_api_key": {
                                "description": "OpenAI API密钥",
                                "type": "string"
                              },
                              "temperature": {
                                "description": "生成温度参数",
                                "type": "number"
                              }
                            },
                            "type": "object"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          }
                        },
                        "required": [
                          "data_source",
                          "input"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "output": {
                            "cites": [
                              {
                                "description": "CPU使用率指标",
                                "id": "cpu_usage_metric",
                                "name": "CPU使用率",
                                "type": "metric"
                              }
                            ],
                            "data": [
                              {
                                "CPU使用率": 75.5,
                                "主机": "server-1",
                                "时间": "2024-01-01 10:00:00"
                              },
                              {
                                "CPU使用率": 78.2,
                                "主机": "server-1",
                                "时间": "2024-01-01 10:01:00"
                              }
                            ],
                            "data_desc": {
                              "real_records_num": 120,
                              "return_records_num": 2
                            },
                            "execution_result": {
                              "data_summary": {
                                "is_calendar": false,
                                "is_variable": false,
                                "step": "1m",
                                "total_data_points": 120
                              },
                              "model_info": {
                                "id": "cpu_usage_metric",
                                "metric_type": "atomic",
                                "name": "CPU使用率",
                                "query_type": "dsl",
                                "unit": "%"
                              },
                              "sample_data": [
                                {
                                  "index": 1,
                                  "labels": {
                                    "host": "server-1"
                                  },
                                  "sample_times": [
                                    1646360670123,
                                    1646360730123
                                  ],
                                  "sample_values": [
                                    75.5,
                                    78.2
                                  ],
                                  "time_points": 120,
                                  "value_points": 120
                                }
                              ],
                              "success": true
                            },
                            "explanation": {
                              "CPU使用率": [
                                {
                                  "指标": "使用 'CPU使用率' 指标，按 '时间' '最近1小时' 的数据，并设置过滤条件 '主机为server-1和server-2'"
                                },
                                {
                                  "时间": "从 2024-01-01 到 2024-01-02"
                                },
                                {
                                  "主机": "包含 server-1, server-2"
                                }
                              ]
                            },
                            "metric_id": "cpu_usage_metric",
                            "query_params": {
                              "end": 1646471470123,
                              "filters": [
                                {
                                  "name": "labels.host",
                                  "operation": "in",
                                  "value": [
                                    "server-1",
                                    "server-2"
                                  ]
                                }
                              ],
                              "instant": false,
                              "start": 1646360670123,
                              "step": "1m"
                            },
                            "result_cache_key": "cpu_usage_metric_1646360670123_1646471470123",
                            "title": "最近1小时CPU使用率"
                          },
                          "time": "2.5",
                          "tokens": "150"
                        },
                        "schema": {
                          "properties": {
                            "cites": {
                              "description": "引用的指标",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "data": {
                              "description": "查询结果数据",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "data_desc": {
                              "description": "数据描述信息",
                              "properties": {
                                "real_records_num": {
                                  "description": "实际记录数",
                                  "type": "integer"
                                },
                                "return_records_num": {
                                  "description": "返回记录数",
                                  "type": "integer"
                                }
                              },
                              "type": "object"
                            },
                            "execution_result": {
                              "description": "执行结果",
                              "type": "object"
                            },
                            "explanation": {
                              "description": "查询解释",
                              "type": "object"
                            },
                            "metric_id": {
                              "description": "选择的指标ID",
                              "type": "string"
                            },
                            "query_params": {
                              "description": "生成的查询参数",
                              "type": "object"
                            },
                            "result_cache_key": {
                              "description": "结果缓存键",
                              "type": "string"
                            },
                            "title": {
                              "description": "查询标题",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925667189000,
            "update_time": 1760169938671143700,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "d824c093-798e-45d1-82ee-a6ce57e4c457",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "6bc377c2-ab9b-46b5-bbe0-725963fa39e7",
            "name": "read_file",
            "description": "读取沙箱环境中的文件内容，支持文本文件和二进制文件",
            "status": "disabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "71e553e3-955f-4f4a-a1b3-08667736a8da",
              "summary": "read_file",
              "description": "读取沙箱环境中的文件内容，支持文本文件和二进制文件",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/read_file",
              "method": "POST",
              "create_time": 1760169925667724000,
              "update_time": 1760169925667724000,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "read_python_file": {
                          "description": "读取 Python 源代码文件",
                          "summary": "读取 Python 文件",
                          "value": {
                            "filename": "hello.py",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "filename": {
                            "description": "要读取的文件名",
                            "type": "string"
                          },
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "session_type": {
                            "description": "会话类型, 可选值为: redis, in_memory, 默认值为 redis",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "required": [
                          "filename"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925668168200,
            "update_time": 1766650947389239800,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "71e553e3-955f-4f4a-a1b3-08667736a8da",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "35aac0a2-127b-4a18-823b-bc810a8c1887",
            "name": "content_echo",
            "description": "获取固定信息工具，比如背景知识，业务规则等",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "180a057b-8c9e-4ab2-b539-d77e7813b25f",
              "summary": "content_echo",
              "description": "获取固定信息工具，比如背景知识，业务规则等",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/content_echo",
              "method": "POST",
              "create_time": 1760169925668597500,
              "update_time": 1760169925668597500,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "简单文本": {
                          "summary": "简单文本示例",
                          "value": {
                            "content": "Hello, World!"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "content": {
                            "description": "输入的内容",
                            "type": "string"
                          }
                        },
                        "required": [
                          "content"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful response",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "content": {
                              "description": "输出的内容",
                              "type": "string"
                            },
                            "success": {
                              "description": "是否成功",
                              "type": "boolean"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925670560000,
            "update_time": 1760169935928654000,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "180a057b-8c9e-4ab2-b539-d77e7813b25f",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "f585b926-8773-4ec7-9256-bdad4416dfc4",
            "name": "execute_code",
            "description": "在沙箱环境中执行 Python 代码，支持 pandas 等数据分析库，注意沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库。运行代码时，需要通过 print 输出结果，或者设置输出变量 output_params 参数，返回结果",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "723a7188-2a5e-4eb9-af00-69c7f0cd2ffd",
              "summary": "execute_code",
              "description": "在沙箱环境中执行 Python 代码，支持 pandas 等数据分析库，注意沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库。运行代码时，需要通过 print 输出结果，或者设置输出变量 output_params 参数，返回结果",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/execute_code",
              "method": "POST",
              "create_time": 1760169925671075300,
              "update_time": 1760169925671075300,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "basic_execution": {
                          "description": "执行简单的 Python 代码",
                          "summary": "基础代码执行",
                          "value": {
                            "content": "print('Hello World')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
                            "filename": "hello.py",
                            "output_params": [
                              "result"
                            ],
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        },
                        "data_analysis": {
                          "description": "使用 pandas 进行数据分析",
                          "summary": "数据分析示例",
                          "value": {
                            "content": "import pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    'name': ['Alice', 'Bob', 'Charlie'],\n    'age': [25, 30, 35],\n    'salary': [50000, 60000, 70000]\n}\ndf = pd.DataFrame(data)\n\n# 计算统计信息\nstats = {\n    'mean_age': df['age'].mean(),\n    'mean_salary': df['salary'].mean(),\n    'total_records': len(df)\n}\n\nprint('数据统计:')\nfor key, value in stats.items():\n    print(f'{key}: {value}')\n\nresult = stats",
                            "filename": "data_analysis.py",
                            "output_params": [
                              "result",
                              "df"
                            ],
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "args": {
                            "description": "代码执行参数",
                            "items": {
                              "type": "string"
                            },
                            "type": "array"
                          },
                          "content": {
                            "description": "要执行的 Python 代码内容",
                            "type": "string"
                          },
                          "filename": {
                            "description": "文件名，用于指定代码文件的名称",
                            "type": "string"
                          },
                          "output_params": {
                            "description": "输出参数列表，用于指定要返回的变量名",
                            "items": {
                              "type": "string"
                            },
                            "type": "array"
                          },
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "required": [
                          "content"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925671611000,
            "update_time": 1760169935081144800,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "723a7188-2a5e-4eb9-af00-69c7f0cd2ffd",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "85ac7b32-5386-4ce3-927f-3c74979119c3",
            "name": "get_status",
            "description": "获取沙箱环境的当前状态信息",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "002b9af2-c0b3-4e10-a59c-879c67bda8a0",
              "summary": "get_status",
              "description": "获取沙箱环境的当前状态信息",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/get_status",
              "method": "POST",
              "create_time": 1760169925672106200,
              "update_time": 1760169925672106200,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "get_sandbox_status": {
                          "description": "获取沙箱环境的当前状态信息",
                          "summary": "获取沙箱状态",
                          "value": {
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925672546000,
            "update_time": 1760169934062945000,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "002b9af2-c0b3-4e10-a59c-879c67bda8a0",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "e6e9353b-4127-4c08-bc01-5f09068c6eb4",
            "name": "create_file",
            "description": "在沙箱环境中创建新文件，支持文本内容或从缓存中获取内容",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "b3264b94-509e-43c9-ba46-81a0d0f49255",
              "summary": "create_file",
              "description": "在沙箱环境中创建新文件，支持文本内容或从缓存中获取内容",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/create_file",
              "method": "POST",
              "create_time": 1760169925672960800,
              "update_time": 1760169925672960800,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "create_from_cache": {
                          "description": "使用缓存中的数据创建文件",
                          "summary": "从缓存创建文件",
                          "value": {
                            "filename": "data.json",
                            "result_cache_key": "cached_data_123",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        },
                        "create_python_file": {
                          "description": "创建包含 Python 代码的文件",
                          "summary": "创建 Python 文件",
                          "value": {
                            "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 计算前10个斐波那契数\nfor i in range(10):\n    print(f'F({i}) = {fibonacci(i)}')",
                            "filename": "fibonacci.py",
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "content": {
                            "description": "文件内容, 如果 result_cache_key 参数不为空，则无需设置该参数",
                            "type": "string"
                          },
                          "filename": {
                            "description": "要创建的文件名",
                            "type": "string"
                          },
                          "result_cache_key": {
                            "description": "之前工具的结果缓存key，可以用于将结果写入到文件中，有此参数则无需设置 content 参数",
                            "type": "string"
                          },
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "session_type": {
                            "description": "会话类型, 可选值为: redis, in_memory, 默认值为 redis",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "required": [
                          "filename"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925673428000,
            "update_time": 1760169933460916500,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "b3264b94-509e-43c9-ba46-81a0d0f49255",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "8682fc39-1751-42ab-840f-4f413305470f",
            "name": "list_files",
            "description": "列出沙箱环境中的所有文件和目录",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "ccc91609-15df-43a4-9c59-e815b9b11d9c",
              "summary": "list_files",
              "description": "列出沙箱环境中的所有文件和目录",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/list_files",
              "method": "POST",
              "create_time": 1760169925673858000,
              "update_time": 1760169925673858000,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "list_all_files": {
                          "description": "列出沙箱环境中的所有文件和目录",
                          "summary": "列出所有文件",
                          "value": {
                            "server_url": "http://localhost:8080",
                            "session_id": "test_session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "server_url": {
                            "default": "http://sandbox-env:9101",
                            "description": "可选，沙箱服务器URL，默认使用配置文件中的 SANDBOX_URL",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "沙箱会话ID",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "对于当前操作的简单描述，便于用户理解",
                            "type": "string"
                          }
                        },
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "400",
                    "description": "Bad request",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "detail": {
                              "description": "详细错误信息",
                              "type": "string"
                            },
                            "error": {
                              "description": "错误信息",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  },
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "message": {
                              "description": "操作状态消息",
                              "type": "string"
                            },
                            "result": {
                              "description": "操作结果, 包含标准输出、标准错误输出、返回值",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925674314800,
            "update_time": 1760169931644547000,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "ccc91609-15df-43a4-9c59-e815b9b11d9c",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "3cb3e00b-6b2f-4880-9afb-3a7ec6872d28",
            "name": "sql_helper",
            "description": "专门用于调用 SQL 语句的工具，支持获取元数据信息和执行 SQL 语句。注意：此工具不生成 SQL 语句，只执行已提供的 SQL 语句。",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "5b827dfb-4789-455b-a394-70133439f5cf",
              "summary": "sql_helper",
              "description": "专门用于调用 SQL 语句的工具，支持获取元数据信息和执行 SQL 语句。注意：此工具不生成 SQL 语句，只执行已提供的 SQL 语句。",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/sql_helper",
              "method": "POST",
              "create_time": 1760169925674809300,
              "update_time": 1760169925674809300,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "example": {
                        "command": "execute_sql",
                        "config": {
                          "dimension_num_limit": 30,
                          "get_desc_from_datasource": false,
                          "return_data_limit": 1000,
                          "return_record_limit": 10,
                          "session_id": "123",
                          "session_type": "redis",
                          "view_num_limit": 5,
                          "with_sample": true
                        },
                        "data_source": {
                          "base_url": "https://xxxxx",
                          "kn": [
                            {
                              "knowledge_network_id": "129",
                              "object_types": [
                                "data_view",
                                "metric"
                              ]
                            }
                          ],
                          "recall_mode": "keyword_vector_retrieval",
                          "search_scope": [
                            "object_types",
                            "relation_types",
                            "action_types"
                          ],
                          "token": "",
                          "user_id": "",
                          "view_list": [
                            "view_id"
                          ],
                          "visitor_type": "user"
                        },
                        "sql": "SELECT * FROM table LIMIT 10",
                        "timeout": 120,
                        "title": "数据的标题"
                      },
                      "schema": {
                        "properties": {
                          "command": {
                            "default": "execute_sql",
                            "description": "命令类型: get_metadata(获取元数据信息)、execute_sql(执行 SQL 语句)",
                            "enum": [
                              "get_metadata",
                              "execute_sql"
                            ],
                            "type": "string"
                          },
                          "config": {
                            "description": "工具配置参数",
                            "properties": {
                              "dimension_num_limit": {
                                "default": 30,
                                "description": "维度数量限制",
                                "type": "integer"
                              },
                              "get_desc_from_datasource": {
                                "default": false,
                                "description": "是否从数据源获取工具的描述",
                                "type": "boolean"
                              },
                              "return_data_limit": {
                                "default": 1000,
                                "description": "返回数据总量限制",
                                "type": "integer"
                              },
                              "return_record_limit": {
                                "default": 10,
                                "description": "返回数据条数限制",
                                "type": "integer"
                              },
                              "session_id": {
                                "description": "会话ID",
                                "type": "string"
                              },
                              "session_type": {
                                "default": "redis",
                                "description": "会话类型",
                                "enum": [
                                  "in_memory",
                                  "redis"
                                ],
                                "type": "string"
                              },
                              "view_num_limit": {
                                "default": 5,
                                "description": "引用视图数量限制",
                                "type": "integer"
                              },
                              "with_sample": {
                                "default": true,
                                "description": "查询元数据时是否包含样例数据",
                                "type": "boolean"
                              }
                            },
                            "type": "object"
                          },
                          "data_source": {
                            "description": "数据源配置信息",
                            "properties": {
                              "base_url": {
                                "description": "认证服务URL",
                                "type": "string"
                              },
                              "kg": {
                                "description": "知识图谱配置参数",
                                "items": {
                                  "properties": {
                                    "fields": {
                                      "description": "用户选中的实体字段列表",
                                      "items": {
                                        "type": "string"
                                      },
                                      "type": "array"
                                    },
                                    "kg_id": {
                                      "description": "知识图谱ID",
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "kg_id",
                                    "fields"
                                  ],
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "kn": {
                                "description": "知识网络配置参数",
                                "items": {
                                  "properties": {
                                    "knowledge_network_id": {
                                      "description": "知识网络ID",
                                      "type": "string"
                                    },
                                    "object_types": {
                                      "description": "知识网络对象类型",
                                      "items": {
                                        "type": "string"
                                      },
                                      "type": "array"
                                    }
                                  },
                                  "required": [
                                    "knowledge_network_id"
                                  ],
                                  "type": "object"
                                },
                                "type": "array"
                              },
                              "recall_mode": {
                                "default": "keyword_vector_retrieval",
                                "description": "召回模式，支持 keyword_vector_retrieval(默认), agent_intent_planning, agent_intent_retrieval",
                                "enum": [
                                  "keyword_vector_retrieval",
                                  "agent_intent_planning",
                                  "agent_intent_retrieval"
                                ],
                                "type": "string"
                              },
                              "search_scope": {
                                "description": "知识网络搜索范围，支持 object_types, relation_types, action_types",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "token": {
                                "description": "认证令牌，如提供则无需用户名和密码",
                                "type": "string"
                              },
                              "user_id": {
                                "description": "用户ID",
                                "type": "string"
                              },
                              "view_list": {
                                "description": "逻辑视图ID列表",
                                "items": {
                                  "type": "string"
                                },
                                "type": "array"
                              },
                              "visitor_type": {
                                "default": "user",
                                "description": "调用者的类型，user 代表普通用户，app 代表应用账号",
                                "enum": [
                                  "user",
                                  "app"
                                ],
                                "type": "string"
                              }
                            },
                            "type": "object"
                          },
                          "sql": {
                            "description": "SQL语句",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          },
                          "title": {
                            "description": "数据的标题，获取元数据则必填",
                            "type": "string"
                          },
                          "with_sample": {
                            "default": true,
                            "description": "查询元数据时是否包含样例数据",
                            "type": "boolean"
                          }
                        },
                        "required": [
                          "data_source",
                          "command"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful operation",
                    "content": {
                      "application/json": {
                        "example": {
                          "output": {
                            "command": "execute_sql",
                            "data": [
                              {
                                "column1": "value1",
                                "column2": "value2"
                              }
                            ],
                            "data_desc": {
                              "real_records_num": 1,
                              "return_records_num": 1
                            },
                            "message": "SQL 执行成功",
                            "result_cache_key": "RESULT_CACHE_KEY",
                            "sql": "SELECT * FROM table LIMIT 10"
                          },
                          "time": "14.328890085220337",
                          "tokens": "100"
                        },
                        "schema": {
                          "properties": {
                            "command": {
                              "description": "执行的命令类型",
                              "type": "string"
                            },
                            "data": {
                              "description": "查询结果数据",
                              "items": {
                                "type": "object"
                              },
                              "type": "array"
                            },
                            "data_desc": {
                              "description": "数据描述信息",
                              "properties": {
                                "real_records_num": {
                                  "description": "实际记录数",
                                  "type": "integer"
                                },
                                "return_records_num": {
                                  "description": "返回记录数",
                                  "type": "integer"
                                }
                              },
                              "type": "object"
                            },
                            "message": {
                              "description": "执行结果消息",
                              "type": "string"
                            },
                            "result_cache_key": {
                              "description": "结果缓存键",
                              "type": "string"
                            },
                            "sql": {
                              "description": "执行的SQL语句",
                              "type": "string"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925677161200,
            "update_time": 1760169932353365200,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "5b827dfb-4789-455b-a394-70133439f5cf",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "479e7d1d-f948-46ab-89dc-d27190d98df3",
            "name": "text2ngql",
            "description": "将问题生成nGQL查询语句，并获取执行结果，复杂问题务必拆分子问题，工具一次只能解决一个子问题",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "634ff16b-604b-49e3-8e47-d03b8f4cec60",
              "summary": "text2ngql",
              "description": "将问题生成nGQL查询语句，并获取执行结果，复杂问题务必拆分子问题，工具一次只能解决一个子问题",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/text2ngql",
              "method": "POST",
              "create_time": 1760169925677781800,
              "update_time": 1760169925677781800,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "向量检索示例": {
                          "summary": "向量检索示例",
                          "value": {
                            "action": "keyword_retrieval",
                            "inner_kg": {
                              "fields": [
                                "orgnization",
                                "person",
                                "district"
                              ],
                              "kg_id": "5",
                              "output_fields": [
                                "orgnization"
                              ]
                            },
                            "inner_llm": {
                              "frequency_penalty": 0.5,
                              "max_tokens": 10000,
                              "name": "ali-deepseek-v3",
                              "presence_penalty": 0.5,
                              "temperature": 0.01,
                              "top_k": 2,
                              "top_p": 0.5
                            },
                            "query": "Rose是谁",
                            "retrieval_params": {
                              "keywords_extract": false,
                              "label_name": "*",
                              "score": 0
                            }
                          }
                        },
                        "图谱查询示例": {
                          "summary": "查询人物信息示例",
                          "value": {
                            "background": "",
                            "cache_cover": false,
                            "history": [
                              {
                                "content": "图谱存储了爱数公司所有的人和部门信息，当查询爱数总人数时，不需要指定部门名称，直接查询所有人即可。",
                                "role": "user"
                              }
                            ],
                            "inner_kg": {
                              "fields": [
                                "orgnization",
                                "person",
                                "district"
                              ],
                              "kg_id": "14",
                              "output_fields": [
                                "orgnization"
                              ]
                            },
                            "inner_llm": {
                              "frequency_penalty": 0.5,
                              "max_tokens": 10000,
                              "name": "deepseek-v3",
                              "presence_penalty": 0.5,
                              "temperature": 0.01,
                              "top_k": 2,
                              "top_p": 0.5
                            },
                            "query": "Rose是谁",
                            "retrieval": true,
                            "rewrite_query": "无"
                          }
                        },
                        "获取图谱schema示例": {
                          "summary": "向量检索示例",
                          "value": {
                            "action": "get_schema",
                            "inner_kg": {
                              "fields": [
                                "orgnization",
                                "person",
                                "district"
                              ],
                              "kg_id": "5",
                              "output_fields": [
                                "orgnization"
                              ]
                            }
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "action": {
                            "default": "nl2ngql",
                            "description": "操作类型，可选值: nl2ngql(自然语言转查询) 或 get_schema(获取schema)或 get_schema(获取schema) 或 keyword_retrieval（获取图谱检索结果）",
                            "enum": [
                              "nl2ngql",
                              "get_schema",
                              "keyword_retrieval"
                            ],
                            "type": "string"
                          },
                          "background": {
                            "default": "",
                            "description": "背景信息，如有，会加入prompt中",
                            "type": "string"
                          },
                          "cache_cover": {
                            "default": false,
                            "description": "是否覆盖缓存，如果True，会重新获取最新的schema或者数据",
                            "type": "boolean"
                          },
                          "history": {
                            "default": [],
                            "description": "对话历史记录，多轮对话时需要",
                            "items": {
                              "additionalProperties": true,
                              "type": "object"
                            },
                            "type": "array"
                          },
                          "inner_kg": {
                            "default": {},
                            "description": "知识图谱相关配置, 通用引用变量，使用self_config.data_source.kg[0] 获取",
                            "type": "object"
                          },
                          "inner_llm": {
                            "default": {},
                            "description": "大语言模型参数配置, 通用选择模型获取",
                            "type": "object"
                          },
                          "query": {
                            "default": "",
                            "description": "自然语言查询语句",
                            "type": "string"
                          },
                          "retrieval": {
                            "default": true,
                            "description": "是否启用检索增强，默认True，会做关键词抽取，向量召回，如果多轮对话时可以使用false，因为之前history带入了schema和检索信息",
                            "type": "boolean"
                          },
                          "retrieval_params": {
                            "default": {
                              "keywords_extract": true,
                              "label_name": "*",
                              "score": 0.9,
                              "select_num": 5
                            },
                            "description": "图谱检索相关配置",
                            "properties": {
                              "keywords_extract": {
                                "default": true,
                                "description": "是否用大模型对问题做关键词抽取",
                                "type": "boolean"
                              },
                              "label_name": {
                                "default": "*",
                                "description": "选中某个实体类型召回",
                                "type": "string"
                              },
                              "score": {
                                "default": 0.9,
                                "description": "opensearch向量召回阈值",
                                "type": "number"
                              },
                              "select_num": {
                                "default": 5,
                                "description": "召回数量",
                                "type": "integer"
                              }
                            },
                            "type": "object"
                          },
                          "rewrite_query": {
                            "default": "",
                            "description": "重写后的查询语句，如有，会加入prompt中",
                            "type": "string"
                          },
                          "timeout": {
                            "default": 120,
                            "description": "超时时间",
                            "type": "number"
                          }
                        },
                        "required": [
                          "inner_kg"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful response",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "full_result": {
                              "description": "完整版查询结果",
                              "properties": {
                                "data": {
                                  "description": "查询结果数据",
                                  "type": "object"
                                },
                                "messages": {
                                  "description": "交互过程中的消息记录",
                                  "items": {
                                    "type": "object"
                                  },
                                  "type": "array"
                                },
                                "sql": {
                                  "description": "生成的nGQL查询语句",
                                  "type": "string"
                                }
                              },
                              "type": "object"
                            },
                            "result": {
                              "description": "简化版查询结果",
                              "properties": {
                                "data": {
                                  "description": "查询结果数据",
                                  "type": "object"
                                },
                                "sql": {
                                  "description": "生成的nGQL查询语句",
                                  "type": "string"
                                }
                              },
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925678363400,
            "update_time": 1760169929865351200,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "634ff16b-604b-49e3-8e47-d03b8f4cec60",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          },
          {
            "tool_id": "83d4e9ba-ee52-4b36-a158-82aba7c475b7",
            "name": "jupyter_code_executor",
            "description": "在Jupyter内核中执行Python代码，支持会话保持变量池",
            "status": "enabled",
            "metadata_type": "openapi",
            "metadata": {
              "version": "6587248a-5bdc-4d93-86c2-9d2c879e3d93",
              "summary": "jupyter_code_executor",
              "description": "在Jupyter内核中执行Python代码，支持会话保持变量池",
              "server_url": "http://data-retrieval:9100",
              "path": "/tools/jupyter_code_executor",
              "method": "POST",
              "create_time": 1760169925679337200,
              "update_time": 1760169925679337200,
              "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
              "api_spec": {
                "parameters": [
                  {
                    "name": "stream",
                    "in": "query",
                    "description": "是否流式返回",
                    "required": false,
                    "schema": {
                      "default": false,
                      "type": "boolean"
                    }
                  },
                  {
                    "name": "mode",
                    "in": "query",
                    "description": "请求模式",
                    "required": false,
                    "schema": {
                      "default": "http",
                      "enum": [
                        "http",
                        "sse"
                      ],
                      "type": "string"
                    }
                  }
                ],
                "request_body": {
                  "description": "",
                  "content": {
                    "application/json": {
                      "examples": {
                        "变量保持": {
                          "summary": "变量保持示例",
                          "value": {
                            "code": "print(f'a的值是: {a}')",
                            "session_id": "session_123"
                          }
                        },
                        "简单计算": {
                          "summary": "简单计算示例",
                          "value": {
                            "code": "a = 10\nb = 20\nresult = a + b\nresult",
                            "session_id": "session_123"
                          }
                        }
                      },
                      "schema": {
                        "properties": {
                          "code": {
                            "description": "要执行的Python代码",
                            "type": "string"
                          },
                          "session_id": {
                            "description": "会话ID，用于保持变量池的一致性",
                            "type": "string"
                          }
                        },
                        "required": [
                          "code",
                          "session_id"
                        ],
                        "type": "object"
                      }
                    }
                  },
                  "required": false
                },
                "responses": [
                  {
                    "status_code": "200",
                    "description": "Successful response",
                    "content": {
                      "application/json": {
                        "schema": {
                          "properties": {
                            "full_result": {
                              "description": "完整执行结果",
                              "type": "object"
                            },
                            "result": {
                              "description": "执行结果",
                              "type": "object"
                            }
                          },
                          "type": "object"
                        }
                      }
                    }
                  }
                ],
                "components": {
                  "schemas": {}
                },
                "callbacks": null,
                "security": null,
                "tags": null,
                "external_docs": null
              }
            },
            "use_rule": "",
            "global_parameters": {
              "name": "",
              "description": "",
              "required": false,
              "in": "",
              "type": "",
              "value": null
            },
            "create_time": 1760169925679900700,
            "update_time": 1760169929115574800,
            "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "update_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
            "extend_info": {},
            "resource_object": "tool",
            "source_id": "6587248a-5bdc-4d93-86c2-9d2c879e3d93",
            "source_type": "openapi",
            "script_type": "",
            "code": ""
          }
        ],
        "create_time": 1760169925648020200,
        "update_time": 1765458921372065800,
        "create_user": "0ae82800-6f60-11f0-b0dc-36fa540cff80",
        "update_user": "488c973e-6f67-11f0-b0dc-36fa540cff80",
        "metadata_type": "openapi"
      }
    ]
  }
}