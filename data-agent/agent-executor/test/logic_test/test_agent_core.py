import asyncio
import copy
import json
import unittest
from unittest import mock

from app.common.config import Config
from app.driven.ad.agent_factory_service import agent_factory_service
from app.driven.ad.model_factory_service import model_factory_service
from app.logic import file_service
from app.logic.agent_core_v1 import Agent
from app.logic.tool import tool_use
from app.resources.executors.logic_block import llm_block, retriever_block
from app.router.startup import load_executors
from app.utils.snow_id import snow_id


class TestAgentCore(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        load_executors()
        # enable_mock为False时可以测试agent的整体流程，需要修改config里的信息
        self.enable_mock = not Config.is_debug_mode()
        if not self.enable_mock:
            return
        # mock llm_block
        self.origin_ReActAgent = llm_block.ReActAgent
        self.origin_SimpleChatAgent = llm_block.SimpleChatAgent

        class MockReActAgent(llm_block.ReActAgent):
            async def chat(
                self,
                query_args: dict,
                stream: bool = False,
                conversation_id=None,
                debug=False,
            ):
                if debug:
                    debug_res = [
                        "<status_>Querying<_status>\n",
                        "<status_>Thingking<_status>\n",
                        "<status_>Thingking Result: 图谱召回的结果中包含了张三的信息，可以直接从图谱召回结果中找到答案。<_status>\n",
                        "<status_>Finished<_status>\n",
                        "<answer_>",
                        "张三的职位是前端开发。",
                        "<_answer>\n",
                        "<usage_>{'prompt_tokens': 842, 'total_tokens': 874, 'completion_tokens': 32}<_usage>\n",
                    ]
                    for item in debug_res:
                        yield item
                else:
                    yield "张三的职位是前端开发。"

        class MockSimpleChatAgent(llm_block.SimpleChatAgent):
            async def chat(
                self,
                query_args: dict,
                stream: bool = False,
                conversation_id=None,
                debug=False,
            ):
                if debug:
                    debug_res = [
                        "<status_>Querying<_status>\n",
                        "<status_>Thingking<_status>\n",
                        "<status_>Thingking Result: 图谱召回的结果中包含了张三的信息，可以直接从图谱召回结果中找到答案。<_status>\n",
                        "<status_>Finished<_status>\n",
                        "<answer_>",
                        "张三的职位是前端开发。",
                        "<_answer>\n",
                        "<usage_>{'prompt_tokens': 842, 'total_tokens': 874, 'completion_tokens': 32}<_usage>\n",
                    ]
                    for item in debug_res:
                        yield item
                else:
                    yield "张三的职位是前端开发。"

        llm_block.ReActAgent = MockReActAgent
        llm_block.SimpleChatAgent = MockSimpleChatAgent

        # mock tool_use
        self.origin_create_request_function = tool_use.create_request_function
        mock_tool_call = mock.MagicMock(return_value={"res": "success"})
        tool_use.create_request_function = mock.MagicMock(return_value=mock_tool_call)
        self.origin_nl2ngql_run_func = llm_block.nl2ngql_run_func
        llm_block.nl2ngql_run_func = mock.AsyncMock(return_value={"res": "success"})

        # mock retriever_block
        self.origin_Augment = retriever_block.Augment
        mock_augment = mock.MagicMock()
        mock_augment.ado_augment = mock.AsyncMock(return_value=[("augment_query",)])
        retriever_block.Augment = mock.MagicMock(return_value=mock_augment)
        self.origin_Retrival = retriever_block.Retrival
        mock_retrival = mock.MagicMock()
        mock_retrival.ado_retrival = mock.AsyncMock(return_value=[])
        retriever_block.Retrival = mock.MagicMock(return_value=mock_retrival)
        self.origin_kbqa_retrieve = retriever_block.kbqa_retrieve
        retriever_block.kbqa_retrieve = mock.AsyncMock(
            return_value={"text": [{"content": "", "meta": {"score": 0}}], "data": {}}
        )

        # mock model_factory_service
        self.origin_call = model_factory_service.call
        model_factory_service.call = mock.AsyncMock(return_value="success")
        self.origin_get_llm_config = model_factory_service.get_llm_config
        model_factory_service.get_llm_config = mock.AsyncMock(
            return_value={"max_tokens_length": 32000}
        )

        # mock open_doc_service
        self.origin_EcoIndexClient = file_service.EcoIndexClient
        mock_ecoindex_client = mock.MagicMock()
        file_service.EcoIndexClient = mock.MagicMock(return_value=mock_ecoindex_client)
        mock_ecoindex_client.get_full_text = mock.AsyncMock(return_value="")

        # mock opensearch_engine
        self.origin_opensearch_engine = file_service.opensearch_engine
        mock_opensearch_engine = mock.MagicMock()
        file_service.opensearch_engine = mock_opensearch_engine
        mock_opensearch_engine.get_doc_by_ids = mock.AsyncMock(
            return_value=[
                {
                    "doc_name": "《2024加拿大留学报告》发布.txt",
                    "doc_md5": "e96e3dd2e32c1f6380d7d48d5c9a6504",
                    "content": "作为世界上领土面积第二大的国家，加拿大的总人口4100万，约为中国广东省人口的三分之一。加拿大拥有世界上最长的海岸线、最高的森林覆盖率和最高的国民受教育程度。加拿大移民局数据显示，选择去加拿大留学的国际学生人数已超过100万，中国内地每年选择去加拿大留学的学生人数也稳定在10万以上。\r\n\r\n　　2024年7月21日，启德教育在北京发布《2024加拿大留学报告》。《2024加拿大留学报告》通过精选最新的加拿大官方数据，梳理启德留学客户服务数据，整理不同学段赴加留学概况与申请指南、名校录取攻略，以及留学后的就业与移民政策，为计划赴加留学、就业和生活的中国学生提供参考与指引。\r\n\r\n\r\n　　加拿大大学按照不同的培养目的，主要分为医学博士类大学、综合类大学、基础类大学三种类型。其中医学博士类大学提供广泛的研究课程及医学院课程，学校规模普遍比较大，可颁授本科、硕士及博士学位。综合类大学规模上较医博类大学次之，可颁授本科学士学位及硕士学位，部分大学也可授予博士学位。基础类大学以本科课程为主，以特色小班教学为主，少部分基础类大学也可颁授硕士或博士学位。\r\n\r\n\r\n　　学院（Colleges）、专业学院（Institutes）、理工学院（Polytechnics）以及普通及职业教育学院（CEGEPs，魁北克省独有）也是加拿大的公立高等教育机构，主要向以就业为目标的学生提供职业技能导向型课程。学院可提供本科学士学位、证书课程、研究生文凭课程、与大学合作的联合学士学位等。\r\n\r\n\r\n　　加拿大大学以公立大学为主，本科学制为三至四年，授课型硕士学习时长通常为一至两年，研究型硕士学习时长通常为两年，博士研究生整个学习时长通常为三年。加拿大每年的生活费用为6万至14万人民币，本科阶段学费为8万至25万人民币，研究生阶段学费为10万至30万人民币，学院每年的学费最低，为5万至15万人民币。\r\n\r\n\r\n　　作为加拿大政府和企业合作的带薪实习项目，Co-op“带薪实习课程/项目”（Cooperative Education Program）起源于1970年加拿大的滑铁卢大学。目前，在加拿大的200多所大学与学院中，约有90%的院校开设Co-op课程。帮助学生在学术学习和职业实践之间建立桥梁，为未来的职业生涯打下坚实的基础。\r\n\r\n\r\n　　数据显示， 2024年加拿大留学生中，硕博的申请占比最大（43%），其次是本科（38%）和中小学（14%）。商科与经济学在本科与硕士申请中占比最高，特别是在硕士阶段，商科中申请排名前三的专业分别是工商管理、金融和管理类；工科中申请排名前三的专业分别是电子与计算机工程、数据科学、工业与系统工程。\r\n\r\n\r\n　　在加拿大麦克林杂志的医博类大学排名中，位居前三的是：麦吉尔大学、多伦多大学和英属哥伦比亚大学（UBC）。麦吉尔大学已经连续18年排名第一，一直是加拿大公认最好的大学。麦吉尔大学作为加拿大连续霸榜第一的医博类大学，其申请要求、录取平均分和课程难度均位于全加高校前列。该校不仅拥有加拿大最高的博士生比例，还培养了加拿大最多的诺贝尔奖得主。此外，麦吉尔大学毕业生获得“青年诺贝尔奖”美誉的“罗德学者奖”人数，远远超过其他高校，位居世界第四。\r\n\r\n\r\n　　数据显示，多伦多大学和英属哥伦比亚大学的申请量位居前列。作为加拿大最大的大学，多伦多大学拥有18个学术部门，700多个本科课程和200多个研究生课程。《多伦多大学2023-24学年招生报告》显示，多伦多大学在读的中国内地学生共有15,846人，在所有学生中的占比为17.87%。其中，2023-24年度录取的中国内地新生中，本科生与研究生的人数分别为3,051与1,277。《英属哥伦比亚大学2023/24年度招生报告》显示，英属哥伦比亚大学阶段在读的中国内地学生共有5,978名，在所有学生中的占比为8.21%，其中本科生4,647名，研究生1,331名。\r\n\r\n\r\n　　申请加拿大本科，高中成绩平均分（GPA）不低于85，单科不低于80，班级排名前10%的学生较有优势；部分名校要求提供高考成绩。语言成绩方面，一般要求雅思总分6.5，单科不低于6.0，或托福总分90，单科不低于20。如果学生的托福或雅思成绩未达到直接入读专业课的要求，可以申请语言+本科专业的双录取，学生到达加拿大后，需先在大学的语言中心或指定学院修读语言课程，完成后无需再考托福或雅思即可直接进入本科专业学习。\r\n\r\n\r\n　　如果学生希望进入加拿大本科名校但成绩未达到要求，可以申请加拿大学院的转学分课程。在学院完成2-3年课程后，只要成绩达到要求，就可转学分进入大学相关专业，继续完成大三、大四，毕业后获得大学颁发的学士学位。\r\n\r\n\r\n　　加拿大硕士课程只接受四年制本科生申请，GPA要求不低于80%，部分专业还需提供GMAT或GRE成绩。雅思要求总分6.5，单科不低于6.0；部分商科和教育类专业要求雅思总分不低于7.0。如果学生的学术条件已达到直接入读硕士课程的标准，但语言成绩不足，可以申请语言+硕士专业的双录取。学生到达加拿大后，需先在大学的语言中心或指定学院修读语言课程，完成后无需再考托福或雅思即可直接进入硕士课程学习。\r\n\r\n\r\n　　加拿大毕业工签（Post-graduation Work Permit）是留学生从高等院校毕业后可获得的1-3年开放式工作签证，无雇主限制。留学生在高等院校学习八个月以上即有资格申请毕业工签（PGWP）。根据加拿大统计局（Statistics Canada）公布的2023年数据，截止到2023年第四季度，加拿大总职缺超过46万，各岗位缺口依旧很大。其中，销售和服务类职业，贸易、运输和设备操作员及相关职业，商业、金融和行政职业的缺口位列前三，缺口持续居高不下。\r\n\r\n\r\n　　据报告介绍，作为留学生最稳定、最靠谱的移民方式之一，加拿大经验类移民（CEC）广受欢迎。该项目为在加拿大拥有合法工作经验的人士提供永久居留身份。申请人需要在加拿大境内有合法的工作经验，并获得较高的综合评分才有可能成功获得永久居留身份。所有CEC申请人必须通过快速通道EE系统（Express Entry）进行申请。\r\n\r\n　　在EE系统中申请加拿大经验类移民（CEC）的申请人需满足以下基本要求：毕业于加拿大DLI院校（经加拿大省或地区政府批准可以接收国际学生的学校）的所有高等学历，包括大专、研究生文凭、本科、硕士和博士；在过去三年内至少有一年加拿大工作经验，可以是累计的工作经验，工作类别需为B类（TEER 3类）以上；雅思成绩至少达到CLB-5，即雅思G类四项中，阅读4分，其他三项5分。",
                    "token_size": 1832,
                    "upload_time": "2024-10-15T16:03:49",
                }
            ]
        )

    def tearDown(self):
        if not self.enable_mock:
            return
        llm_block.ReActAgent = self.origin_ReActAgent
        llm_block.SimpleChatAgent = self.origin_SimpleChatAgent

        tool_use.create_request_function = self.origin_create_request_function
        llm_block.nl2ngql_run_func = self.origin_nl2ngql_run_func

        retriever_block.Augment = self.origin_Augment
        retriever_block.Retrival = self.origin_Retrival
        retriever_block.kbqa_retrieve = self.origin_kbqa_retrieve

        model_factory_service.call = self.origin_call
        model_factory_service.get_llm_config = self.origin_get_llm_config

        file_service.EcoIndexClient = self.origin_EcoIndexClient
        file_service.opensearch_engine = self.origin_opensearch_engine

    async def run_agent(self, agent, inputs, headers):
        _ = asyncio.create_task(agent.run(inputs, headers))
        res = ""
        async for res in agent.yield_result():
            # print('data: ', res)
            pass
        print("data: ", res)
        res = json.loads(res)
        # self.assertIn('final_answer', res['answer'])
        self.assertEqual(res["status"], "True")

    async def debug_agent(self, agent, inputs, headers):
        _ = asyncio.create_task(agent.debug(inputs, headers))
        res = ""
        async for res in agent.yield_result(debug_mode=True):
            # print('data: ', res)
            pass
        print("data: ", res)
        res = json.loads(res)
        # self.assertIn('final_answer', res['answer'])
        self.assertEqual(res["status"], "True")
        self.assertIn("debug_info", res)

    @staticmethod
    def get_agent_kbqa_template() -> Agent:
        """KBQA agent 模板"""
        from test.logic_test.agent_configs.kbqa_template import agent_config

        event_key = "agent-executor_" + str(snow_id())
        return Agent(copy.deepcopy(agent_config), event_key)

    async def test_run_kbqa_template(self):
        """运行 KBQA agent 模板"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "0",
            "tool_name": "NL2NGQL",
            "tool_path": "",
            "tool_desc": "",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query",
                    "input_type": "string",
                    "input_desc": "用户问题的自然语言",
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )

        agent = self.get_agent_kbqa_template()
        inputs = {
            "query": "最近5年内，为A股上市央企，尤其是银行业提供金融借款合同纠纷相关法律服务的案件有哪些？"
        }
        # inputs = {"query": "批发业公司知识产权已结案的案件"}
        headers = {
            "userid": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "host": "intelli-qa:8887",
            "user-agent": "Go-http-client/1.1",
            "content-length": "148",
            "appid": "O4cavE_A7csVG7zunPP",
            "appkey": "M2JkNGYyM2Y3YzI2ZmJkZTBmZmFjYjE2YzQwNTk4YzAzNzdjNjdjYjAyZTZhNmJmNjcyYzdiMjA2NTVmOWQ0Yw==",
            "as-client-id": "7ea25bb4-1eec-4fa6-93ff-b2ba9c973ad4",
            "as-client-type": "web",
            "as-user-id": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "as-user-ip": "XXX",
            "as-visitor-type": "realname",
            "timestamp": "1724395721",
            "accept-encoding": "gzip",
        }

        await self.run_agent(agent, inputs, headers)
        agent_factory_service.get_tool_info = origin_get_tool_info

    async def test_kbqa_template_debug(self):
        """调试 KBQA agent 模板"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "0",
            "tool_name": "NL2NGQL",
            "tool_path": "",
            "tool_desc": "",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query",
                    "input_type": "string",
                    "input_desc": "用户问题的自然语言",
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )

        agent = self.get_agent_kbqa_template()
        inputs = {"query": "在杭州市上班的律师"}
        headers = {
            "userid": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "host": "intelli-qa:8887",
            "user-agent": "Go-http-client/1.1",
            "content-length": "145",
            "appid": "O28PdxT1DV0aQnmV4dT",
            "appkey": "OGM2ZDI1ZjhkN2IzODQwYzJiNWYzYTRiYjQzZWI1M2FmMTI2N2Q0NWRhMWI4ZjkxNDMwMTRmMjdhMjM2Yzc2Mw==",
            "as-client-id": "34126adb-867b-458f-8b11-aecc771cdc4f",
            "as-client-type": "web",
            "as-user-id": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "as-user-ip": "XXX",
            "as-visitor-type": "realname",
            "timestamp": "1724121626",
            "accept-encoding": "gzip",
        }
        await self.debug_agent(agent, inputs, headers)

        agent_factory_service.get_tool_info = origin_get_tool_info

    @staticmethod
    def get_agent_docqa_template() -> Agent:
        """文档文档 agent 模板
        开 rewrite augment"""
        from test.logic_test.agent_configs.docqa_template import agent_config

        event_key = "agent-executor_" + str(snow_id())
        return Agent(copy.deepcopy(agent_config), event_key)

    async def test_run_docqa_template(self):
        """运行 文档问答 agent 模板"""
        agent = self.get_agent_docqa_template()
        inputs = {
            "query": "怎么预定会议室",
            "history": [{"content": "怎么预定会议室", "role": "user"}],
        }
        headers = {
            "host": "agent-executor:30778",
            "user-agent": "Go-http-client/1.1",
            "content-length": "2564",
            "cache-control": "no-cache",
            "connection-type": "keep-alive",
            "token": "ory_rt_9zpZjbeS7mHPzIRC8br9jfyNcH2gvlqWthKzsEwOqjM.UDHIOC_GERRefOYFxaONIb4KJO5Iv8XDpzZtxc_BWXc",
            "userid": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "x-accel-buffering": "no",
            "accept-encoding": "gzip",
        }

        await self.run_agent(agent, inputs, headers)

    async def test_debug_docqa_template(self):
        """调试 文档问答 agent 模板"""
        agent = self.get_agent_docqa_template()
        query = "它的价值有哪些"
        inputs = {
            "query": query,
            # "query": "聚焦大数据产业发展的阻碍，提升了非结构化数据管理夯实大数据治理基座建设的重要地位的有哪两点?,",
            # "query": "数据驱动型组织的特点是什么?",
            # "query": "《GBT 39784-2021电子档案管理系统通用功能要求》中对于系统安全可靠性功能要求的规定是什么?",
            # "query": "企业内容门户架构有哪些优势",
            # "query": "面对非结构化数据引入的新挑战，为什么企业现有架构通常无法应对非结构化数据的管理与应用?",
            # "query": "内容数据湖有哪些关键优势",
            # "query": "大模型AI应用有哪些具体方向？在AS中有什么应用？",
            "history": [
                {"content": "多文档域的核心特征", "role": "user"},
                {
                    "content": """引用参考文档的ID：第1个参考信息
多文档域的核心特征包括：
独立完整的文档管理系统：每个文档域是一套独立完整的文档管理系统，意味着每个文档域都有自己的用户及组织、存储及内容服务，以及独立的安全策略和访问规则。
文档库同步及策略管控：多套文档域之间可以进行文档库同步，以实现数据的互通和同步。同时，文档域之间可以进行策略管控，实现策略的统一管理和灵活配置。
总公司与子公司的独立运营：总公司和子公司之间相对独立，各自运营各自维护，只有一部分数据需要互通和同步，体现了多文档域在大型企业集团中的应用。
总部对分支机构的强管控：总部组织对分支机构的管控性比较强，可以统一分支机构的用户组织以及管理策略，体现了多文档域在垂直管理的公检法行业上下级政府单位中的应用。
数据安全与冗余：单个文档域故障不影响其他文档域的运行，重要文档数据可以在其他文档域做异地冗余，本地数据丢失后可找回，保证了数据的安全性和业务连续性。
网络隔离与带宽限制下的高效同步：多文档域管理支持网络物理隔离下的文档交换，以及带宽有限网络下的文档数据高效同步，通过制定同步策略，实现数据就近访问和错峰同步。
策略管理的灵活性：在父子域关系的多文档域中，父域可统一管理子域的策略；在平级域关系的多文档域中，每个域可灵活管理各自的策略，体现了策略管理的灵活性。
文档访问的独立性与统一性：各文档域的访问地址和用户视图独立，部分数据互通需要同步传输，存在时延；而在多对象存储服务中，各区域访问唯一地址，用户视图统一，不同区域的用户可对某一文档进行共享协作，无需同步传输。
适用行业广泛：多文档域适用于大型企业集团、跨国企业集团、金融、党委、政府、企业研发（多网络的场景）以及垂直管理的公检法行业上下级政府单位，体现了其在不同行业场景中的应用价值。
技术优势：AnyShare Family 7的多文档域管理特性解读，体现了其在技术实现上的优势，包括文档域之间的高效同步、策略管控、数据安全等方面的优化
""",
                    "role": "assistant",
                },
                {"content": query, "role": "user"},
            ],
        }
        headers = {
            "host": "agent-executor:30778",
            "user-agent": "Go-http-client/1.1",
            "content-length": "2564",
            "cache-control": "no-cache",
            "connection-type": "keep-alive",
            "token": "ory_rt_9zpZjbeS7mHPzIRC8br9jfyNcH2gvlqWthKzsEwOqjM.UDHIOC_GERRefOYFxaONIb4KJO5Iv8XDpzZtxc_BWXc",
            "userid": "44554144-5dd8-11ef-9f40-923eb954c1e0",
            "x-accel-buffering": "no",
            "accept-encoding": "gzip",
        }

        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_llm_simple_chat() -> Agent:
        """只有LLM块，LLM 不调用工具"""
        from test.logic_test.agent_configs.llm_simple_chat import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_llm_simple_chat(self):
        """只有LLM块，LLM 不调用工具"""
        agent = self.get_agent_llm_simple_chat()
        inputs = {
            "query": "我想从节约成本的方面入手进行建筑材料采购，请问推荐哪种模板呢？",
            "content": "[1] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### 较高的回收价值，可以一直循环利用，铝合金模板符合低碳环保、绿色建筑的国家 政策。 节能环保 ：减少建筑垃圾和施工污染 铝 模 配 合 CL 结 构 保 温 一 体 化 、 ALC 板施工，现场施工材料定尺定量工厂化加工，减少了主体及砌体施工阶段建筑垃圾 的产生，同时因为工艺上避免了粉刷作业，大大减少了施工扬尘。 铝合金模板易于实现工地的文明施工，施工现场整洁，不会出现废旧木模板堆积如 山的现象。 在成本上， 铝合金模板也低于木模板 虽然单次来看，铝合金模板材料费远高于木模板，但铝合金模板至少300次的周转 率，接近0的损耗率和80%以上的标准化率，使得建筑层数较高时，铝模板具有较 大优势。 成本对比分析 ：以百米高层建筑为例 以一栋 100 米 33 层高层建筑为例，进行铝模和木模的成本对比分析，如下表： \n[2] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### ▲ 铝合金模板与木模的性能优势对比表 在环保方面， 铝合金模板也有不可多得的优点 回收价值高 ：循环利用，低碳环保 铝合金建筑模板残值高，均摊成本优势明显。铝模周转材料及支撑体系损耗率几乎 为 0 ， 模 板 中 标 准 构 件 约 占 铝 模 板 全 部 构 件 80% ， 正 常 使 用 周 转 次 数 为 300 次 以 上 ， 残 值 回 收 率 达 到 30%，在高层或超高层建筑的使用中相比木模板体系有明显的成本优势。由于具有 \n[3] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### 不可控的因素大、总体效率低、劳动力成本很高的粗放模式，显示已经不适合新 时代的需求。 有什么新的方式可以更好地代替木模板？ 早在1962年，美国就出现了铝合金模板，近几年引入中国过后，迅速在先进的地产 企业中得到了广泛的应用。铝合金模板相对木模板，最显著的优点，即是实现了 建筑施工工厂化。 建筑施工工厂化，即把传统上发生在建筑工地的问题和许多由工地现场处理的工作 ，尽量多地在工厂处理、完成，可以有效节约施工现场工时成本。模数化之后，模 板 本 身 可 以 反 复 使 用 ， 非 常 适 合 标 准 化 程 度 较 高 的 建 筑 —— 建筑标准化程度越高，越能体现施工工厂化的优势。 铝合金模板在施工工艺、环保和成本等方面均全面超越木模板。 （铝模板总体施工工艺流程） 在施工工艺方面，铝模板具有多重优点",
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}

        await self.run_agent(agent, inputs, headers)

    async def test_debug_llm_simple_chat(self):
        """只有LLM块，LLM 不调用工具"""
        agent = self.get_agent_llm_simple_chat()
        # inputs = {
        #     'query': '我想从节约成本的方面入手进行建筑材料采购，请问推荐哪种模板呢？',
        #     'content': '[1] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### 较高的回收价值，可以一直循环利用，铝合金模板符合低碳环保、绿色建筑的国家 政策。 节能环保 ：减少建筑垃圾和施工污染 铝 模 配 合 CL 结 构 保 温 一 体 化 、 ALC 板施工，现场施工材料定尺定量工厂化加工，减少了主体及砌体施工阶段建筑垃圾 的产生，同时因为工艺上避免了粉刷作业，大大减少了施工扬尘。 铝合金模板易于实现工地的文明施工，施工现场整洁，不会出现废旧木模板堆积如 山的现象。 在成本上， 铝合金模板也低于木模板 虽然单次来看，铝合金模板材料费远高于木模板，但铝合金模板至少300次的周转 率，接近0的损耗率和80%以上的标准化率，使得建筑层数较高时，铝模板具有较 大优势。 成本对比分析 ：以百米高层建筑为例 以一栋 100 米 33 层高层建筑为例，进行铝模和木模的成本对比分析，如下表： \n[2] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### ▲ 铝合金模板与木模的性能优势对比表 在环保方面， 铝合金模板也有不可多得的优点 回收价值高 ：循环利用，低碳环保 铝合金建筑模板残值高，均摊成本优势明显。铝模周转材料及支撑体系损耗率几乎 为 0 ， 模 板 中 标 准 构 件 约 占 铝 模 板 全 部 构 件 80% ， 正 常 使 用 周 转 次 数 为 300 次 以 上 ， 残 值 回 收 率 达 到 30%，在高层或超高层建筑的使用中相比木模板体系有明显的成本优势。由于具有 \n[3] 文件名：[搜建筑] - 2018-09-04 铝模施工的技术和节点做法！！.pdf--内容： ##### 不可控的因素大、总体效率低、劳动力成本很高的粗放模式，显示已经不适合新 时代的需求。 有什么新的方式可以更好地代替木模板？ 早在1962年，美国就出现了铝合金模板，近几年引入中国过后，迅速在先进的地产 企业中得到了广泛的应用。铝合金模板相对木模板，最显著的优点，即是实现了 建筑施工工厂化。 建筑施工工厂化，即把传统上发生在建筑工地的问题和许多由工地现场处理的工作 ，尽量多地在工厂处理、完成，可以有效节约施工现场工时成本。模数化之后，模 板 本 身 可 以 反 复 使 用 ， 非 常 适 合 标 准 化 程 度 较 高 的 建 筑 —— 建筑标准化程度越高，越能体现施工工厂化的优势。 铝合金模板在施工工艺、环保和成本等方面均全面超越木模板。 （铝模板总体施工工艺流程） 在施工工艺方面，铝模板具有多重优点'
        # }
        inputs = {
            "query": "它的多文档域优惠政策的优势是什么?",
            "content": """第1个参考信息 AnyShare 7.0.0.3 POC 测试框架 -- 跨区域间物理带宽有限，而且需承载较多业务系统，多文档域方案可利用有限的网络条件，去最大化完成多地文档数据的同步。 跨国网络防火墙限制跨国企业总部与分支机构之间，文档流转难，协作难，可通过多文档域方案一站式解决。 内外部文档共享与协作网络物理隔离的情况下，生产网络与办公网络之间可以通过多文档域方案合规高效地进行文档流转与协作。
跨地域组织管理文档交换自动化
-----""",
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}

        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_nl2ngql() -> Agent:
        """只有LLM块 LLM块可以使用工具 使用的工具是NL2NGQL"""
        from test.logic_test.agent_configs.nl2ngql import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_nl2ngql(self):
        """只有LLM块 LLM块可以使用工具 使用的工具是NL2NGQL"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "0",
            "tool_name": "NL2NGQL",
            "tool_path": "",
            "tool_desc": "",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query",
                    "input_type": "string",
                    "input_desc": "用户问题的自然语言",
                    "in": 3,
                    "required": True,
                },
                {
                    "input_name": "schema_linking_res",
                    "input_type": "string",
                    "input_desc": "图谱召回的信息",
                    "in": 3,
                    "required": True,
                },
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )

        agent = self.get_agent_nl2ngql()
        inputs = {
            "retriver_output": {
                "data": {
                    "entity_types": {
                        "publisher": {
                            "alias": "出版社",
                            "property": {
                                "name": {
                                    "alias": "publisher_name",
                                    "data_type": "string",
                                }
                            },
                        },
                        "book": {
                            "alias": "书",
                            "property": {
                                "name": {"alias": "书名", "data_type": "string"}
                            },
                        },
                        "person": {
                            "alias": "人",
                            "property": {
                                "name": {"alias": "姓名", "data_type": "string"},
                                "position": {"alias": "职位", "data_type": "string"},
                            },
                        },
                    },
                    "edge_types": {
                        "(v:publisher)-[e:publisher_2_book]->(v:book)": {
                            "alias": "publisher 出版 book",
                            "property": {
                                "publish_time": {
                                    "alias": "出版时间",
                                    "data_type": "string",
                                }
                            },
                        }
                    },
                },
                "data": [
                    {
                        "property": {"name": "石家庄市"},
                        "meta": {"id": "vid", "class": "district"},
                    },
                    {
                        "property": {"name": "李明", "position": "后端开发"},
                        "meta": {"id": "vid", "class": "person"},
                    },
                    {
                        "property": {"name": "张三", "position": "前端开发"},
                        "meta": {"id": "vid", "class": "person"},
                    },
                ],
                "path": [
                    [
                        {
                            "id": "vid1",
                            "class": "publisher",
                            "type": "entity",
                            "property": {"name": "中国大百科出版社"},
                        },
                        {
                            "class": "publisher_2_book",
                            "type": "edge",
                            "start_entity_id": "vid1",
                            "end_entity_id": "vid2",
                        },
                        {
                            "id": "vid2",
                            "class": "book",
                            "type": "entity",
                            "property": {"name": "Wild About Books"},
                        },
                    ],
                    [
                        {
                            "id": "vid1",
                            "class": "publisher",
                            "type": "entity",
                            "property": {"name": "中国人民大学出版社"},
                        },
                        {
                            "class": "publisher_2_book",
                            "type": "edge",
                            "start_entity_id": "vid1",
                            "end_entity_id": "vid2",
                        },
                        {
                            "id": "vid2",
                            "class": "book",
                            "type": "entity",
                            "property": {"name": "中国时代"},
                        },
                    ],
                ],
            }
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}

        # 使用了工具
        inputs["query"] = "李四的职位是什么？"
        await self.run_agent(agent, inputs, headers)

        # 可以直接回答，不使用工具
        agent = self.get_agent_nl2ngql()
        inputs["query"] = "张三的职位是什么？"
        await self.run_agent(agent, inputs, headers)

        # 上面两个问题的回答只要一个token就吐出了，流式的效果体现不出来
        agent = self.get_agent_nl2ngql()
        inputs["query"] = "中国大百科出版社出版过什么书？"
        await self.run_agent(agent, inputs, headers)

        agent_factory_service.get_tool_info = origin_get_tool_info

    async def test_debug_nl2ngql(self):
        """只有LLM块 LLM块可以使用工具 使用的工具是NL2NGQL"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "0",
            "tool_name": "NL2NGQL",
            "tool_path": "",
            "tool_desc": "",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query",
                    "input_type": "string",
                    "input_desc": "用户问题的自然语言",
                    "in": 3,
                    "required": True,
                },
                {
                    "input_name": "schema_linking_res",
                    "input_type": "string",
                    "input_desc": "图谱召回的信息",
                    "in": 3,
                    "required": True,
                },
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )

        agent = self.get_agent_nl2ngql()
        inputs = {
            "retriver_output": {
                "data": {
                    "entity_types": {
                        "publisher": {
                            "alias": "出版社",
                            "property": {
                                "name": {
                                    "alias": "publisher_name",
                                    "data_type": "string",
                                }
                            },
                        },
                        "book": {
                            "alias": "书",
                            "property": {
                                "name": {"alias": "书名", "data_type": "string"}
                            },
                        },
                        "person": {
                            "alias": "人",
                            "property": {
                                "name": {"alias": "姓名", "data_type": "string"},
                                "position": {"alias": "职位", "data_type": "string"},
                            },
                        },
                    },
                    "edge_types": {
                        "(v:publisher)-[e:publisher_2_book]->(v:book)": {
                            "alias": "publisher 出版 book",
                            "property": {
                                "publish_time": {
                                    "alias": "出版时间",
                                    "data_type": "string",
                                }
                            },
                        }
                    },
                },
                "data": [
                    {
                        "property": {"name": "石家庄市"},
                        "meta": {"id": "vid", "class": "district"},
                    },
                    {
                        "property": {"name": "李明", "position": "后端开发"},
                        "meta": {"id": "vid", "class": "person"},
                    },
                    {
                        "property": {"name": "张三", "position": "前端开发"},
                        "meta": {"id": "vid", "class": "person"},
                    },
                ],
                "path": [
                    [
                        {
                            "id": "vid1",
                            "class": "publisher",
                            "type": "entity",
                            "property": {"name": "中国大百科出版社"},
                        },
                        {
                            "class": "publisher_2_book",
                            "type": "edge",
                            "start_entity_id": "vid1",
                            "end_entity_id": "vid2",
                        },
                        {
                            "id": "vid2",
                            "class": "book",
                            "type": "entity",
                            "property": {"name": "Wild About Books"},
                        },
                    ],
                    [
                        {
                            "id": "vid1",
                            "class": "publisher",
                            "type": "entity",
                            "property": {"name": "中国人民大学出版社"},
                        },
                        {
                            "class": "publisher_2_book",
                            "type": "edge",
                            "start_entity_id": "vid1",
                            "end_entity_id": "vid2",
                        },
                        {
                            "id": "vid2",
                            "class": "book",
                            "type": "entity",
                            "property": {"name": "中国时代"},
                        },
                    ],
                ],
            }
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}

        # 使用了工具
        inputs["query"] = "李四的职位是什么？"
        await self.debug_agent(agent, inputs, headers)

        # 可以直接回答，不使用工具
        agent = self.get_agent_nl2ngql()
        inputs["query"] = "张三的职位是什么？"
        await self.debug_agent(agent, inputs, headers)

        # 上面两个问题的回答只要一个token就吐出了，流式的效果体现不出来
        agent = self.get_agent_nl2ngql()
        inputs["query"] = "中国大百科出版社出版过什么书？"
        await self.debug_agent(agent, inputs, headers)

        agent_factory_service.get_tool_info = origin_get_tool_info

    @staticmethod
    def get_agent_api_tool() -> Agent:
        """只有LLM块 LLM块可以使用工具 使用的工具是api"""
        from test.logic_test.agent_configs.api_tool import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_api_tool(self):
        """只有LLM块 LLM块可以使用工具 使用的工具是api"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "1",
            "tool_name": "fulltext_search",
            "tool_path": "https://mock.anydata.aishu.cn:8444/api/search-engine/v1/open/services/b3264bda37114355ab8211af5463354a",
            "tool_desc": "在图谱中搜索相关实体",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query_text",
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )
        origin_get_tool_box_info = agent_factory_service.get_tool_box_info
        mock_res_tool_box_info = {
            "box_id": "1",
            "box_name": "ad_search",
            "box_desc": "认知搜索应用",
            "box_svc_url": "https://mock.anydata.aishu.cn:8444",
            "box_icon": "",
            "tools": [mock_res_tool_info],
            "global_headers": {"appid": "Ns7-FjcWuecW9-s_PZl"},
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间",
        }
        agent_factory_service.get_tool_box_info = mock.AsyncMock(
            return_value=mock_res_tool_box_info
        )
        origin_create_request_function = tool_use.create_request_function
        mock_tool_call = mock.AsyncMock(
            return_value={
                "res": {
                    "full_text": {
                        "count": 1000,
                        "vertexs": [
                            {
                                "id": "000eb685acf8771065b77c39ed60ac03",
                                "color": "rgba(80,160,106,1)",
                                "icon": "graph-movie",
                                "alias": "电影",
                                "default_property": {
                                    "n": "NAME",
                                    "v": "当她醒来 - 电影",
                                    "a": "电影名称",
                                },
                                "score": 53.02,
                                "classfication": "全部资源",
                                "kg_name": '"电影知识图谱"',
                                "tags": ["movies"],
                                "properties": [
                                    {
                                        "tag": "movies",
                                        "props": [
                                            {
                                                "name": "YEAR",
                                                "value": "2019",
                                                "alias": "上映年份",
                                                "type": "string",
                                            },
                                            {
                                                "name": "NAME",
                                                "value": "当她醒来 - 电影",
                                                "alias": "电影名称",
                                                "type": "string",
                                            },
                                        ],
                                    }
                                ],
                            }
                        ],
                    }
                }
            }
        )
        tool_use.create_request_function = mock.AsyncMock(return_value=mock_tool_call)

        agent = self.get_agent_api_tool()
        inputs = {
            "query": "电影《当她醒来》的上映年份是什么时候？",
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.run_agent(agent, inputs, headers)

        agent_factory_service.get_tool_info = origin_get_tool_info
        agent_factory_service.get_tool_box_info = origin_get_tool_box_info
        tool_use.create_request_function = origin_create_request_function

    async def test_debug_api_tool(self):
        """只有LLM块 LLM块可以使用工具 使用的工具是api"""
        # mock
        origin_get_tool_info = agent_factory_service.get_tool_info
        mock_res_tool_info = {
            "tool_id": "1",
            "tool_name": "fulltext_search",
            "tool_path": "https://mock.anydata.aishu.cn:8444/api/search-engine/v1/open/services/b3264bda37114355ab8211af5463354a",
            "tool_desc": "在图谱中搜索相关实体",
            "tool_method": "POST",
            "tool_input": [
                {
                    "input_name": "query_text",
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
        agent_factory_service.get_tool_info = mock.AsyncMock(
            return_value=mock_res_tool_info
        )
        origin_get_tool_box_info = agent_factory_service.get_tool_box_info
        mock_res_tool_box_info = {
            "box_id": "1",
            "box_name": "ad_search",
            "box_desc": "认知搜索应用",
            "box_svc_url": "https://mock.anydata.aishu.cn:8444",
            "box_icon": "",
            "tools": [mock_res_tool_info],
            "global_headers": {"appid": "Ns7-FjcWuecW9-s_PZl"},
            "create_user": "创建者",
            "create_time": "创建时间",
            "update_user": "编辑者",
            "update_time": "编辑时间",
        }
        agent_factory_service.get_tool_box_info = mock.AsyncMock(
            return_value=mock_res_tool_box_info
        )
        origin_create_request_function = tool_use.create_request_function
        mock_tool_call = mock.AsyncMock(
            return_value={
                "res": {
                    "full_text": {
                        "count": 1000,
                        "vertexs": [
                            {
                                "id": "000eb685acf8771065b77c39ed60ac03",
                                "color": "rgba(80,160,106,1)",
                                "icon": "graph-movie",
                                "alias": "电影",
                                "default_property": {
                                    "n": "NAME",
                                    "v": "当她醒来 - 电影",
                                    "a": "电影名称",
                                },
                                "score": 53.02,
                                "classfication": "全部资源",
                                "kg_name": '"电影知识图谱"',
                                "tags": ["movies"],
                                "properties": [
                                    {
                                        "tag": "movies",
                                        "props": [
                                            {
                                                "name": "YEAR",
                                                "value": "2019",
                                                "alias": "上映年份",
                                                "type": "string",
                                            },
                                            {
                                                "name": "NAME",
                                                "value": "当她醒来 - 电影",
                                                "alias": "电影名称",
                                                "type": "string",
                                            },
                                        ],
                                    }
                                ],
                            }
                        ],
                    }
                }
            }
        )
        tool_use.create_request_function = mock.AsyncMock(return_value=mock_tool_call)

        agent = self.get_agent_api_tool()
        inputs = {
            "query": "电影《当她醒来》的上映年份是什么时候？",
        }
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.debug_agent(agent, inputs, headers)

        agent_factory_service.get_tool_info = origin_get_tool_info
        agent_factory_service.get_tool_box_info = origin_get_tool_box_info
        tool_use.create_request_function = origin_create_request_function

    @staticmethod
    def get_agent_2llm_block() -> Agent:
        """2个LLM块，LLM 不调用工具"""
        from test.logic_test.agent_configs.two_llm_block import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_2llm_block(self):
        """2个LLM块，LLM 不调用工具"""
        agent = self.get_agent_2llm_block()
        inputs = {"query": "这里是问题的示例"}
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.run_agent(agent, inputs, headers)

    async def test_debug_2llm_block(self):
        """2个LLM块，LLM 不调用工具"""
        agent = self.get_agent_2llm_block()
        inputs = {"query": "这里是问题的示例"}
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_retriever_nl2ngql() -> Agent:
        """魏旺: 一个召回块 一个NL2NGQL的LLM块"""
        from test.logic_test.agent_configs.retriever_nl2ngql import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_retriever_nl2ngql(self):
        agent = self.get_agent_retriever_nl2ngql()
        inputs = {"query": "北京有哪些在军工制造领域有丰富经验的测试？"}
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.run_agent(agent, inputs, headers)

    async def test_debug_retriever_nl2ngql(self):
        agent = self.get_agent_retriever_nl2ngql()
        inputs = {"query": "北京有哪些在军工制造领域有丰富经验的测试？"}
        headers = {"userid": "44554144-5dd8-11ef-9f40-923eb954c1e0"}
        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_as_file() -> Agent:
        """AS 文档"""
        from test.logic_test.agent_configs.as_file import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_as_file(self):
        agent = self.get_agent_as_file()
        inputs = {
            "query": "提取出这篇文章的摘要",
            "history": [{"content": "提取出这篇文章的摘要", "role": "user"}],
            "doc": [
                {
                    "ds_id": "2",
                    "file_source": "as",
                    "fields": [
                        {
                            "name": "《2024加拿大留学报告》发布.txt",
                            "path": "测试数据/单文档问答/txt-20240723/《2024加拿大留学报告》发布.txt",
                            "source": "gns://A123F3C38C7B48B09C5C24C06ABD098F/7D212A53E71041E9821C02F455C2B518/A75A2F2837D4486DB34EEC030F3407CE/CA967C88C8BA446CB99FE2F7F8C570B6",
                        }
                    ],
                    "address": "https://XXX",
                    "port": 443,
                    "datasets": None,
                    "as_user_id": "44554144-5dd8-11ef-9f40-923eb954c1e0",
                }
            ],
        }
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
            "token": "ory_at_hbXq1yoUzaRZQQqYRMGCrXHWEjuIrZJBQj7xgT5y5NU.EFc2DPDkaecMf_heFgAE5gjTZdC6lJElhnm--zF9JY4",
        }
        await self.run_agent(agent, inputs, headers)

    async def test_debug_as_file(self):
        agent = self.get_agent_as_file()
        inputs = {
            "query": "提取出这篇文章的摘要",
            "history": [{"content": "提取出这篇文章的摘要", "role": "user"}],
            "doc": [
                {
                    "file_source": "as",
                    "ds_id": "1",
                    "address": "https://XXX",
                    "port": "443",
                    "fields": [
                        {
                            "name": "科技期刊低被引论文的界定与评价方法探究——以《期刊引用报告》凝聚态物理学65种期刊为例.pdf",
                            "path": "path",
                            "source": "gns://A123F3C38C7B48B09C5C24C06ABD098F/C802CD2F0E594857B3A0851C557812B7/525F15FAA5A14428B43D40DC9FFD5E23",
                        }
                    ],
                }
            ],
        }
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
            "token": "ory_at_5P4zHbYdWNKc9KXJwM2oe5JBlXbGdb8uozybCcUxI9E.IYHu3cLqttxYD9lEjpKk3fBGRx9ywB3iZJO2r34dgFU",
        }
        await self.debug_agent(agent, inputs, headers)

    async def test_run_as_file_over_length(self):
        origin_get_llm_config = model_factory_service.get_llm_config
        model_factory_service.get_llm_config = mock.AsyncMock(
            return_value={"max_tokens_length": 32}
        )

        agent = self.get_agent_as_file()
        inputs = {
            "query": "提取出这篇文章的摘要",
            "history": [{"content": "提取出这篇文章的摘要", "role": "user"}],
            "doc": [
                {
                    "file_source": "as",
                    "ds_id": "1",
                    "address": "https://XXX",
                    "port": "443",
                    "fields": [
                        {
                            "name": "科技期刊低被引论文的界定与评价方法探究——以《期刊引用报告》凝聚态物理学65种期刊为例.pdf",
                            "path": "path",
                            "source": "gns://A123F3C38C7B48B09C5C24C06ABD098F/C802CD2F0E594857B3A0851C557812B7/525F15FAA5A14428B43D40DC9FFD5E23",
                        }
                    ],
                }
            ],
        }
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
            "token": "ory_at_aTTW86UspTYrr8omlC9DUo5DJUXLqNxVYVD-674fvyk.nrCVQXLZlMMNmrwFdognloQnec2qcImD_29G6MJa8Ss",
        }
        await self.run_agent(agent, inputs, headers)

        model_factory_service.get_llm_config = origin_get_llm_config

    @staticmethod
    def get_agent_multi_input() -> Agent:
        """多个string类型的input"""
        from test.logic_test.agent_configs.multi_input import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_multi_input(self):
        agent = self.get_agent_multi_input()
        inputs = {"language": "英文", "text": "as研发线都有哪些人"}
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
        }
        await self.run_agent(agent, inputs, headers)

    async def test_debug_multi_input(self):
        agent = self.get_agent_multi_input()
        inputs = {"language": "英文", "text": "as研发线都有哪些人"}
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
        }
        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_local_file() -> Agent:
        """本地文档"""
        from test.logic_test.agent_configs.local_file import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_local_file(self):
        agent = self.get_agent_local_file()
        inputs = {
            "query": "提取出这篇文章的摘要",
            "history": [{"content": "提取出这篇文章的摘要", "role": "user"}],
            "doc": [
                {
                    "file_source": "local",
                    "id": "e96e3dd2e32c1f6380d7d48d5c9a6504",
                    "name": "《2024加拿大留学报告》发布.txt",
                }
            ],
        }
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
        }
        await self.run_agent(agent, inputs, headers)

    async def test_debug_local_file(self):
        agent = self.get_agent_local_file()
        inputs = {
            "query": "提取出这篇文章的摘要",
            "history": [{"content": "提取出这篇文章的摘要", "role": "user"}],
            "doc": [
                {
                    "file_source": "local",
                    "id": "e96e3dd2e32c1f6380d7d48d5c9a6504",
                    "name": "《2024加拿大留学报告》发布.txt",
                }
            ],
        }
        headers = {"userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00"}
        await self.debug_agent(agent, inputs, headers)

    @staticmethod
    def get_agent_function_block() -> Agent:
        """本地文档"""
        from test.logic_test.agent_configs.function_block import agent_config

        event_key = "agent-executor_" + str(snow_id())
        agent = Agent(copy.deepcopy(agent_config), event_key)
        return agent

    async def test_run_function_block(self):
        agent = self.get_agent_function_block()
        inputs = {"query": "test", "history": [{"content": "test", "role": "user"}]}
        headers = {
            "userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00",
        }
        await self.run_agent(agent, inputs, headers)

    async def test_debug_function_block(self):
        agent = self.get_agent_function_block()
        inputs = {"query": "test", "history": [{"content": "test", "role": "user"}]}
        headers = {"userid": "6a87ee26-5e90-11ef-ad78-16ebd2721c00"}
        await self.debug_agent(agent, inputs, headers)
