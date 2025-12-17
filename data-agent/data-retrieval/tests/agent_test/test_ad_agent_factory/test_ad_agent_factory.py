"""
@File: test_ad_agent_factory.py
@Date: 2025-02-27
@Author: Danny.gao
@Desc: 
"""

import json
import time
import requests

def debug():
    url = 'https://10.4.135.251:8444/api/agent-factory/v2/agent/test'
    data = {
        "release_config": {
            "input": {
                "fields": [
                    {
                        "name": "query",
                        "type": "string",
                        "id": 1
                    },
                    {
                        "name": "plot_title",
                        "type": "string",
                        "id": 2
                    }
                ],
                "augment": {
                    "enable": False,
                    "data_source": {
                        "kg": [
                            {
                                "fields": []
                            }
                        ]
                    }
                },
                "rewrite": {
                    "enable": False,
                    "llm_config": {
                        "id": "1888134581878657024",
                        "name": "transmit_14B",
                        "temperature": 1,
                        "top_p": 1,
                        "top_k": 1,
                        "frequency_penalty": 0,
                        "presence_penalty": 0,
                        "max_tokens": 1000
                    }
                }
            },
            "logic_block": [
                {
                    "id": "f4b7afcf-ea26-469f-b7c4-68c59e595e71",
                    "name": "LLM",
                    "type": "llm_block",
                    "output": [
                        {
                            "name": "text2sql_res",
                            "type": "text"
                        }
                    ],
                    "llm_config": {
                        "id": "1888852679493554176",
                        "name": "Tome-L",
                        "temperature": 1,
                        "top_p": 1,
                        "top_k": 1,
                        "frequency_penalty": 0,
                        "presence_penalty": 0,
                        "max_tokens": 1000
                    },
                    "mode": "expert",
                    "context_length": 8,
                    "dolphin": [
                        {
                            "name": "1",
                            "value": "import af_text2sql.text2sql\r\n\r\n@text2sql(query=$query) -> output"
                        }
                    ],
                    "tools": [
                        {
                            "tool_name": "text2sql",
                            "tool_box_name": "af_text2sql",
                            "tool_id": "1892389972246265856",
                            "tool_box_id": "1892389972242071552",
                            "tool_description": "将用户查询的问题文本转换成结构化查询语句SQL，并查询数据库，获得数据。"
                        }
                    ]
                },
                {
                    "id": "3efa8948-4278-4c9a-a539-2b2c1732248c",
                    "name": "函数",
                    "type": "function_block",
                    "function_id": "1893848650539335680",
                    "function_inputs": [
                        {
                            "key": "input_json",
                            "value": {
                                "name": "text2sql_res"
                            }
                        }
                    ],
                    "output": [
                        {
                            "name": "parse_text2sql_res",
                            "type": "text"
                        }
                    ]
                },
                {
                    "id": "58c86adf-fc7c-4473-9141-802273b54d70",
                    "name": "LLM1",
                    "type": "llm_block",
                    "output": [
                        {
                            "name": "res",
                            "type": "text"
                        }
                    ],
                    "llm_config": {
                        "id": "1888852679493554176",
                        "name": "Tome-L",
                        "temperature": 1,
                        "top_p": 1,
                        "top_k": 1,
                        "frequency_penalty": 0,
                        "presence_penalty": 0,
                        "max_tokens": 1000
                    },
                    "mode": "expert",
                    "context_length": 8,
                    "dolphin": [
                        {
                            "name": "1",
                            "value": "import af_json2plot.json2plot\r\n\r\n@json2plot(title=$plot_title, data=$parse_text2sql_res) -> res"
                        }
                    ],
                    "tools": [
                        {
                            "tool_name": "json2plot",
                            "tool_box_name": "af_json2plot",
                            "tool_id": "1892474511194849280",
                            "tool_box_id": "1892474511190654976",
                            "tool_description": "根据数据绘制图表的参数，返回一个可供前端生成图表的JSON"
                        }
                    ]
                }
            ],
            "output": {
                "answer": [
                    {
                        "name": "res",
                        "type": "text"
                    }
                ],
                "block_answer": []
            }
        },
        "input": {
            "query": "6月运量是多少",
            "plot_title": "6月运量饼图",
            "history": []
        }
    }
    headers = {
        'appid': 'OIZ6_KHCKIk-ASpNLg5'
    }

    st_time = time.time()
    response = requests.post(url=url, headers=headers, verify=False, data=json.dumps(data))
    print(f'总耗时：{time.time()-st_time}')
    # 接收流式内容
    for line in response.iter_lines():
        st_time = time.time()
        if line:
            # 处理接收到的一行内容
            print(line.decode('utf-8'))
        print(f'耗时：{time.time()-st_time}')


def run():
    url = 'https://10.4.135.251:8444/api/agent-factory/v2/agent/1892474997964800000'
    data = {
        "query": "6月运量是多少",
        "plot_title": "6月运量",
        "_options": {
            "debug": True
        }
    }
    headers = {
        'appid': 'OIZ6_KHCKIk-ASpNLg5'
    }
    st_time = time.time()
    response = requests.post(url=url, headers=headers, verify=False, data=json.dumps(data))
    print(f'总耗时：{time.time()-st_time}')
    # 接收流式内容
    for line in response.iter_lines():
        st_time = time.time()
        if line:
            # 处理接收到的一行内容
            print(line.decode('utf-8'))
        print(f'耗时：{time.time()-st_time}')

# debug()
run()