import asyncio
import unittest
from unittest import mock

from app.resources.executors.logic_block import retriever_block
from app.resources.executors.logic_block.retriever_block import run_func


class TestRetrieverBlock(unittest.TestCase):
    def setUp(self):
        # enable_mock为False时可以测试agent的整体流程，需要修改config里的信息
        self.enable_mock = True
        if not self.enable_mock:
            return
        self.origin_Retrival = retriever_block.Retrival
        mock_retrival = mock.MagicMock()
        mock_retrival.ado_retrival = mock.AsyncMock(return_value=[])
        retriever_block.Retrival = mock.MagicMock(return_value=mock_retrival)

    def tearDown(self):
        if not self.enable_mock:
            return

    async def run_retriever_block(self, *args):
        async for item in run_func(*args):
            print("data:", item)
            self.assertIn("retriever_output", item["outputs"])

    def test_doc_qa(self):
        # 召回 文档问答
        logic_block = {
            "id": "1",
            "name": "Retriever_Block",
            "type": "retriever_block",
            "input": [{"name": "query", "type": "text", "from": "input"}],
            "data_source": {
                "doc": [
                    {
                        "ds_id": 1,
                        "ds_name": "部门文档库",
                        "fields": [
                            {
                                "name": "AnyDATA研发线",
                                "path": "部门文档库1/AnyDATA研发线",
                                "source": "gns://CBBB3180731847DA9CE55F262C7CD3D8/AEC0E4D9BD224763BC5BEF8D72D5866D",
                            }
                        ],
                    }
                ]
            },
            "output": [{"name": "retriever_output", "type": "object"}],
            "llm_config": {
                "id": "1780110534704762881",
                "name": "l20-qwen2",
                "temperature": 0,
                "top_p": 0.95,
                "top_k": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "max_tokens": 500,
            },
            "knowledge_augment": {
                "enable": True,
                "data_source": {
                    "kg": [
                        {
                            "kg_id": "4",
                            "kg_name": "人物关系图谱",
                            "fields": ["custom_subject"],
                        }
                    ]
                },
            },
        }
        headers = {
            "userid": "7a5c9324-44cd-11ef-b4dc-663f094b27c2",
            "host": "intelli-qa:8887",
            "user-agent": "Go-http-client/1.1",
            "content-length": "145",
            "appid": "O28PdxT1DV0aQnmV4dT",
            "appkey": "OGM2ZDI1ZjhkN2IzODQwYzJiNWYzYTRiYjQzZWI1M2FmMTI2N2Q0NWRhMWI4ZjkxNDMwMTRmMjdhMjM2Yzc2Mw==",
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
            "as-client-type": "web",
            "as-user-id": "7a5c9324-44cd-11ef-b4dc-663f094b27c2",
            "as-user-ip": "XXX",
            "as-visitor-type": "realname",
            "timestamp": "1724121626",
            "accept-encoding": "gzip",
        }
        props = {
            "data_source": logic_block["data_source"],
            "llm_config": logic_block.get("llm_config", {}),
            "output": logic_block["output"][0]["name"],
            "headers": headers,
            "advanced_config": logic_block.get("advanced_config", {}),
            "knowledge_augment": logic_block.get("knowledge_augment", {}),
        }
        inputs = {"query": "它的多文档域优惠政策的优势是什么?"}
        context = {
            "variables": {"query": "它的多文档域优惠政策的优势是什么?"},
            "query_process": {
                "origin_query": "它的多文档域优惠政策的优势是什么?",
                "rewrite_query": "AnyShareFamily 7的多文档域优惠政策的优势是什么?",
            },
        }
        asyncio.run(self.run_retriever_block(inputs, props, None, None, context))
