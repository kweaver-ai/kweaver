import asyncio
import time
import unittest

from app.common.config import Config
from app.logic.tool import run_func


class TestRunFunc(unittest.TestCase):
    def setUp(self):
        # enable_mock为False时可以测试agent的整体流程，需要修改config里的信息
        self.enable_mock = not Config.is_debug_mode()
        if not self.enable_mock:
            return
        pass

    def tearDown(self):
        pass

    async def run_func(self, *args):
        res = await run_func(*args)
        print("run_func result", res)
        # async for item in res:
        #     print('run_func_nl2ngql', item)

    def _test_run_func(self):
        start_time = time.time()
        tool_input = {
            "query": "最近5年内，为A股上市央企，尤其是银行业提供金融借款合同纠纷相关法律服务的案件有哪些？"
        }
        props = {
            "kg_id": "3",
            "schema_linking_res": {
                "concept": {
                    "entity_types": {
                        "customer": {
                            "alias": "客户",
                            "property": {
                                "catetory_parent": {
                                    "alias": "客户客户类型全路径",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "industry_parent": {
                                    "alias": "客户客户行业全路径",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "catetory": {
                                    "alias": "客户客户类型",
                                    "values": [
                                        "国有、上市（A股、H股）",
                                        "香港上市",
                                        "央企",
                                    ],
                                    "data_type": "string",
                                },
                                "industry": {
                                    "alias": "客户客户行业",
                                    "values": ["银行业", "金融", "商务服务业"],
                                    "data_type": "string",
                                },
                                "name": {
                                    "alias": "客户客户名",
                                    "values": [
                                        "诸多法律服务机构",
                                        "某国有企业（案件进行中，不便透露客户信",
                                    ],
                                    "data_type": "string",
                                },
                            },
                        },
                        "court": {
                            "alias": "法院",
                            "property": {
                                "location": {
                                    "alias": "法院地点",
                                    "values": ["上海金融法院"],
                                    "data_type": "string",
                                },
                                "name": {
                                    "alias": "法院法院名",
                                    "values": ["上海金融法院"],
                                    "data_type": "string",
                                },
                            },
                        },
                        "case": {
                            "alias": "案件",
                            "property": {
                                "time": {
                                    "alias": "案件结案时间",
                                    "values": [],
                                    "data_type": "date",
                                },
                                "id": {
                                    "alias": "案件案件号",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "amount": {
                                    "alias": "案件案件金额_千万元",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "performance_cate": {
                                    "alias": "案件业绩库分类",
                                    "values": ["国企改制"],
                                    "data_type": "string",
                                },
                                "bussiness_parentall": {
                                    "alias": "案件案件领域全路径",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "bussiness": {
                                    "alias": "案件案件领域",
                                    "values": [
                                        "境内A股上市",
                                        "境外发行上市",
                                        "银行业务",
                                        "金融",
                                        "合同纠纷",
                                        "争议纠纷",
                                        "法律顾问",
                                        "专项服务",
                                    ],
                                    "data_type": "string",
                                },
                                "name": {
                                    "alias": "案件案件名",
                                    "values": [
                                        "合同纠纷",
                                        "法律顾问",
                                        "专项服务",
                                        "诉讼案件",
                                    ],
                                    "data_type": "string",
                                },
                            },
                        },
                        "lawyer": {
                            "alias": "律师",
                            "property": {
                                "id": {
                                    "alias": "律师id",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "paper": {
                                    "alias": "律师论文",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "performance": {
                                    "alias": "律师业绩",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "description": {
                                    "alias": "律师简介",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "location": {
                                    "alias": "律师办公地点",
                                    "values": [],
                                    "data_type": "string",
                                },
                                "name": {
                                    "alias": "律师名字",
                                    "values": [],
                                    "data_type": "string",
                                },
                            },
                        },
                    },
                    "edge_types": {
                        "(v:case)-[e:case_2_customer]->(v2:customer)": {
                            "alias": "案件 关联 客户",
                            "property": {},
                        },
                        "(v:court)-[e:court_2_case]->(v2:case)": {
                            "alias": "法院 审理 案件",
                            "property": {},
                        },
                        "(v:lawyer)-[e:lawyer_2_case]->(v2:case)": {
                            "alias": "律师 代理 案件",
                            "property": {},
                        },
                    },
                }
            },
            "userid": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "llm": {
                "id": "1780110534704762881",
                "name": "Qwen2-72B-Chat",
                "temperature": 0,
                "top_p": 0.95,
                "top_k": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0,
                "max_tokens": 2000,
            },
            "verbose": True,
        }
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.run_func(tool_input, props))
        print("spent time", time.time() - start_time)
