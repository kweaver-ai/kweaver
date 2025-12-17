import unittest
from test import MockResponse, MockSession, MockStreamContent
from unittest import mock
from unittest.mock import patch

from app.logic.tool import tool_use


class TestGetAgentTool(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.origin_agent_factory_service = tool_use.agent_factory_service
        tool_use.agent_factory_service = mock.MagicMock()
        tool_info = {
            "tool_id": "1",
            "tool_name": "fulltext_search",
            "tool_path": "https://pre.anydata.aishu.cn:8444/api/search-engine/v1/open/services/b3264bda37114355ab8211af5463354a",
            "tool_desc": "在图谱中搜索相关实体",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 3,
                    "required": True,
                }
            ],
            "tool_output": [
                {
                    "output_name": "res",
                    "output_type": "object",
                    "output_desc": "搜索到的实体或关系",
                }
            ],
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间",
        }
        tool_use.agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=tool_info
        )
        tool_box_info = {
            "box_id": "1",
            "box_name": "ad_search",
            "box_desc": "认知搜索应用",
            "box_svc_url": "https://pre.anydata.aishu.cn:8444",
            "box_icon": "",
            "tools": [tool_info],
            "global_headers": {"appid": "Ns7-FjcWuecW9-s_PZl"},
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间",
        }
        tool_use.agent_factory_service.get_tool_box_info = mock.AsyncMock(
            return_value=tool_box_info
        )

    def tearDown(self):
        tool_use.agent_factory_service = self.origin_agent_factory_service

    async def test_get_agent_tool_1(self):
        """获取NL2NGQL工具"""
        tools = [
            {
                "tool_id": "0",
                "tool_name": "NL2NGQL",
                "tool_description": "将用户问题的自然语言转为图数据库查询语句，并返回查询结果。",
                "tool_box_id": "",
                "tool_box_name": "",
                "config": {
                    "kg_id": "3",
                    "llm_config": {
                        "id": "1780110534704762881",
                        "name": "Qwen2-72B-Chat",
                        "temperature": 0,
                        "top_p": 0.95,
                        "top_k": 1,
                        "frequency_penalty": 0,
                        "presence_penalty": 0,
                        "max_tokens": 2000,
                    },
                    "schema_linking_res": {
                        "name": "retriever_output.data",
                        "from": "Retriever_Block",
                    },
                },
                "tool_use_description": "将用户问题的自然语言转为图数据库查询语句，并返回查询结果。若图谱中存在用户问题需要的信息，但现有召回结果中没有，须进一步查询图数据库。",
            }
        ]
        headers = {"userid": "1"}
        res = await tool_use.get_agent_tool(tools, headers)

    async def test_get_agent_tool_2(self):
        """获取api工具"""
        tool_info = {
            "tool_id": "1",
            "tool_name": "fulltext_search",
            "tool_path": "https://pre.anydata.aishu.cn:8444/api/search-engine/v1/open/services/b3264bda37114355ab8211af5463354a",
            "tool_desc": "在图谱中搜索相关实体",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "path_arg",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 0,
                    "required": True,
                },
                {
                    "input_name": "query_arg",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 1,
                    "required": True,
                },
                {
                    "input_name": "header_arg",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 2,
                    "required": True,
                },
                {
                    "input_name": "body_arg",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 3,
                    "required": True,
                    "children": [
                        {
                            "input_name": "body_arg_child",
                            "input_type": "string",
                            "input_desc": "搜索关键词",
                            "in": 3,
                            "required": True,
                        }
                    ],
                },
                {
                    "input_name": "cookie_arg",
                    "input_type": "string",
                    "input_desc": "搜索关键词",
                    "in": 4,
                    "required": True,
                },
            ],
            "tool_output": [
                {
                    "output_name": "res",
                    "output_type": "object",
                    "output_desc": "搜索到的实体或关系",
                    "children": [
                        {
                            "output_name": "res_child",
                            "output_type": "object",
                            "output_desc": "搜索到的实体或关系",
                        }
                    ],
                }
            ],
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间",
        }
        tool_use.agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=tool_info
        )
        tools = [
            {
                "tool_id": "1",
                "tool_name": "fulltext_search",
                "tool_description": "在图谱中搜索相关实体",
                "tool_box_id": "1",
                "tool_box_name": "",
                "tool_use_description": "在图谱中搜索相关实体",
            }
        ]
        headers = {"userid": "1"}
        res = await tool_use.get_agent_tool(tools, headers)
        # 工具的运行
        tool_instance = res["fulltext_search"]["instance"]
        tool_input = {"path_arg": "", "query_arg": "", "body_arg": ""}
        # 非流式调用
        data = {"res": {}}
        with patch("aiohttp.ClientSession", return_value=MockSession(200, data)):
            # 异步
            res = await tool_instance.arun(tool_input, {})
            self.assertEqual(res, data)

            # 同步
            res = tool_instance.run(tool_input, {})
            self.assertEqual(res, data)

        # 流式调用
        stream_data = ["1", "2", "3"]
        with patch(
            "aiohttp.ClientSession",
            return_value=MockSession(200, content=MockStreamContent(stream_data)),
        ):
            # 异步
            res = []
            async for item in tool_instance.arun_stream(tool_input, {}):
                res.append(item)
            self.assertEqual(res, [1, 2, 3])

        with patch("requests.request", return_value=MockResponse(200, stream_data)):
            # 同步
            res = []
            for item in tool_instance.run_stream(tool_input, {}):
                res.append(item)
            self.assertEqual(res, [1, 2, 3])
