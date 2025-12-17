import time
from textwrap import dedent
from uuid import uuid4
import os

from langchain_community.chat_models import ChatOpenAI
from pydantic import BaseModel, Field

from af_agent.agents.react_agent.react_agent import ReactAgent
from af_agent.datasource import AFIndicator
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.sessions.base import GetSessionId
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolName
from af_agent.tools import Json2Plot
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from af_agent.tools.base_tools.text2metric import Text2MetricTool
from af_agent.tools.base_tools.analyzer_with_code import AnalyzerWithCodeTool
# from af_agent.tools.text2metric_by_func import Text2MetricToolByFunc
from af_agent.tools.base_tools.text2sql import Text2SQLTool
from af_agent.tools.base_tools.get_tool_cache import GetToolCacheTool
from af_agent.tools.base_tools.af_sailor import AfSailorTool
from af_agent.tools.base_tools.datasource_filter import DataSourceFilterTool
from af_agent.tools.sandbox_tools.shared_all_in_one import SandboxTool
from af_agent.tools.toolkits import InstructionBookInsideToolkit
from af_agent.api.auth import get_authorization

from af_agent.utils.repl import astart_repl
from af_agent.utils.llm import CustomChatOpenAI
from af_agent.utils.model_types import ModelType4Prompt

from af_agent.api.ad_api import AD_CONNECT


from af_agent.settings import set_value, get_settings
from af_agent.prompts.manager.base import BasePromptManager

base_session = RedisHistorySession(history_num_limit=20, history_max=5000)

def get_chat_history(
    session_id,
    session: RedisHistorySession = base_session
):
    history = session.get_chat_history(
        session_id=session_id
    )
    return history


def get_toolkit(
    parameter,
    chat,
    prompt_manager,
    **kwargs
):
    chat_history = get_chat_history(parameter.get("session_id"))

    # sailor_tool = AfSailorTool(parameter=parameter, **kwargs)
    # human_tool = AfHumanInputTool(parameter=parameter, **kwargs)
    # chat2plot = ChatToPlotTool(
    #     session_id=parameter.get("session_id"),
    #     chat=chat,
    #     session=base_session,
    # )
    chat2plot = Json2Plot(
        session_id=parameter.get("session_id"),
        session=base_session,
    )

    # knowledge_enhanced = KnowledgeEnhancedTool(
    #     word_id="10",
    #     synonym_id="11",
    #     kg_id="2623",
    # )
    # knowledge_enhanced = KnowledgeEnhancedTool(
    #     kg_id="2623",
    #     synonym_id="11",
    #     word_id="10"
    # )

    analyzer_with_code = AnalyzerWithCodeTool(
        llm=chat,
        session_id=parameter.get("session_id"),
        session=base_session,
        retry_times=1,
        prompt_manager=prompt_manager
    )

    get_tool_cache = GetToolCacheTool(
        session_id=parameter.get("session_id"),
        session=base_session,
        retry_times=5,
        prompt_manager=prompt_manager
    )

    sandbox = SandboxTool(
        session_id=parameter.get("session_id"),
        session=base_session,
        retry_times=1,
        prompt_manager=prompt_manager,
        server_url=parameter.get("server_url")
    )
    
    tools = []
    tools.append(chat2plot)
    # tools.append(knowledge_enhanced)
    # tools.append(analyzer_with_code)
    # tools.append(get_tool_cache)
    tools.append(sandbox)

    af_indicator = AFIndicator(
        indicator_list=parameter.get("indicator_list"),
        # indicator_list=[],
        token=parameter.get("token"),
    )

    # text2metric = Text2MetricTool.from_indicator(
    text2metric = Text2MetricTool.from_indicator(
        indicator=af_indicator,
        llm=chat,
        # with_execution=True,
        retry_times=2,
        enable_yoy_or_mom=True,
        session_id=parameter.get("session_id"),
        session=base_session,
        background=parameter.get("background"),
        return_record_limit=parameter.get("return_record_limit"),
        return_data_limit=parameter.get("return_data_limit"),
        prompt_manager=prompt_manager,
        dimension_num_limit=parameter.get("dimension_num_limit"),
        recall_top_k=parameter.get("view_num_limit"),
        # only_essential_dim=True,
        # rewrite_query=True
    )

    af_datasource = VegaDataSource(
        view_list=parameter.get("view_list"),
        # view_list=[],
        token=parameter.get("token"),
        user_id=parameter.get("user_id"),
        prompt_manager=prompt_manager,
        vega_type="af"
    )
    text2sql = Text2SQLTool(
        data_source=af_datasource,
        llm=chat,
        retry_times=2,
        session_id=parameter.get("session_id"),
        session=base_session,
        background=parameter.get("background"),
        only_essential_dim=True,
        return_record_limit=parameter.get("return_record_limit"),
        return_data_limit=parameter.get("return_data_limit"),
        dimension_num_limit=parameter.get("dimension_num_limit"),
        view_num_limit=parameter.get("view_num_limit"),
        prompt_manager=prompt_manager,
        rewrite_query=False,
        show_sql_graph=True
    )

    tools.append(text2sql)
    # tools.append(text2metric)


    # 添加 af_sailor 工具
    if text2sql in tools:
        asset_type = 3
    elif text2metric in tools:
        asset_type = 4
    
    if text2metric in tools and text2sql in tools:
        asset_type = -1

    from_af_sailor_service_params = {
        "ad_appid": "OIZ6_KHCKIk-ASpNLg5",
        "af_editions": "resource",
        "entity2service": {},
        "direct_qa": True,
        "filter": {
            "asset_type": [
                asset_type
            ],
            "data_kind": "0",
            "department_id": [
                -1
            ],
            "end_time": "1800122122",
            "info_system_id": [
                -1
            ],
            "owner_id": [
                -1
            ],
            "publish_status_category": [
                -1
            ],
            "shared_type": [
                -1
            ],
            "start_time": "0",
            "stop_entity_infos": [],
            "subject_id": [
                -1
            ],
            "update_cycle": [
                -1
            ]
        },
        "kg_id": 19425,
        "limit": 100,
        "required_resource": {
            "lexicon_actrie": {
                "lexicon_id": "40"
            },
            "stopwords": {
                "lexicon_id": "41"
            }
        },
        # "resources": [
        #     {
        #         "id": "5c0c818d-bcf0-49fa-adf8-44c16ddbfb76",
        #         "type": "3"
        #     },
        #     {
        #         "id": "f28d9390-e3a6-4f9a-8b72-edba1aece703",
        #         "type": "3"
        #     },

        # ],
        "roles": [
            "normal",
            "data-owner",
            "data-butler",
            "data-development-engineer",
            "tc-system-mgm"
        ],
        "session_id": parameter.get("session_id"),
        "stop_entities": [],
        "stopwords": [],
        "stream": False,
        "subject_id": parameter.get("user_id"),
        "subject_type": "user",
        "token": parameter.get("token"),
    }

    af_sailor = AfSailorTool(
        parameter=from_af_sailor_service_params,
        session_id=parameter.get("session_id"),
        session=base_session,
        **kwargs
    )
    datasource_filter = DataSourceFilterTool(
        llm=chat,
        session_id=parameter.get("session_id"),
        session=base_session,
        prompt_manager=prompt_manager,
        token=parameter.get("token"),
        user_id=parameter.get("user_id"),
        data_source_num_limit= -1,
        dimension_num_limit= 100,
    )

    # tools.append(af_sailor)
    # tools.append(datasource_filter)

    toolkit = InstructionBookInsideToolkit()
    toolkit.set_tools(tools)

    toolkit.set_toolkit_instruction("")
#     toolkit.set_toolkit_instruction(dedent(f"""
# - 如果包含 {ToolName.from_sailor.value} 工具，先用它查找数据资源，然后再调用其他工具
# - 如果包含 {ToolName.from_knowledge_enhanced.value} 工具，它会寻找问题中的同义词及分析维度，再传给工具，知识增强为空也没有关系
# - 调用 {ToolName.from_analyzer_with_code.value} 工具前，必须先使用其他工具查到必要的数据才行
# - 当用户提到写代码时，请直接调用 {ToolName.from_analyzer_with_code.value} 工具，不要尝试自己生成代码
# - 需要进行数值计算时，请调用 {ToolName.from_analyzer_with_code.value} 工具
# - 如果 {ToolName.from_text2sql.value} 能进行查询，则不需要调用代码分析工具，请务必选择好调用工具的时机
# - 一个工具不要重复调用3次以上
#     """))
    # - 如果你判断需要使用 {ToolName.from_chat2plot.value} 工具，生成 Final Answer 时, 直接告诉用户i已经生成, 不需要生成 markdown 任何占位符（即不要生成类似 ![](chart_placeholder)），不需要返回配置。
    # - 当用户没有提到具体的时间约束，默认是今年
    # toolkit.set_toolkit_instruction(f"""如果用户问到了同环比，可以通过两次调用工具获取获取不同统计周期的结果，在进行计算
# """)

    return toolkit


def get_llms():

    # llm = ChatOpenAI(
    qwen_72b = CustomChatOpenAI(
        model_name="Qwen-72B-Chat",
        # openai_api_key="EMPTY",
        openai_api_base="http://192.168.173.19:8304/v1",
        # openai_api_base="http://10.4.117.180:8304/v1",
        # model_name="Qwen2.5-14B-Chat",
        openai_api_key="EMPTY",
        # openai_api_base="http://192.168.173.19:8503/v1",
        temperature=0.5,
        # max_tokens=10000,        # 减小 token 限制以提高响应速度
        # request_timeout=60,     # 添加请求超时设置
        # top_p=0.95,             # 添加 top_p 采样
        # presence_penalty=0.01,   # 添加存在惩罚以减少重复
        # frequency_penalty=0.01,  # 添加频率惩罚以增加多样性
    )

    qwen_72b_tool = CustomChatOpenAI(
        model_name="Qwen-72B-Chat",
        openai_api_key="EMPTY",
        openai_api_base="http://10.4.117.180:8304/v1",
        temperature=0.99,
    )

    # deepseek
    # deepseek = CustomChatOpenAI(
    #     model_name="qwen32b-distill-r1",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://10.4.118.205:8000/v1"
    # )
    deepseek = CustomChatOpenAI(
        model_name="deepseek_r1_vol",
        openai_api_key="OIZ6_KHCKIk-ASpNLg5",
        openai_api_base="https://10.4.135.251:8444/api/model-factory/v1/",
        verify_ssl=False,
        temperature=0.5
    )

    deepseek_v3 = CustomChatOpenAI(
        model_name="deepseek_v3_vol",
        openai_api_key="OIZ6_KHCKIk-ASpNLg5",
        openai_api_base="https://10.4.135.251:8444/api/model-factory/v1/",
        verify_ssl=False,
        temperature=0.5
    )

    deepseek_distill = CustomChatOpenAI(
        model_name="r1-32",
        openai_api_key="EMPTY",
        openai_api_base="http://192.168.102.250:13522/v1/",
        verify_ssl=False,
        temperature=0.5
    )

    # agent_llm = deepseek_v3
    # tool_llm = deepseek_v3
    agent_llm = qwen_72b
    tool_llm = qwen_72b

    # GGUF
    # agent_llm = CustomChatOpenAI(
    #     model_name="Tome-max",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.102.250:3523/v1",
    #     max_tokens=8092,        # 减小 token 限制以提高响应速度
    #     temperature=0.2,        # 降低温度使输出更确定性
    #     request_timeout=60,     # 添加请求超时设置
    #     top_p=0.95,             # 添加 top_p 采样
    #     presence_penalty=0.1,   # 添加存在惩罚以减少重复
    #     frequency_penalty=0.1,  # 添加频率惩罚以增加多样性
    # )

    #  qwen25_14_model
    # agent_llm = CustomChatOpenAI(
    #     model_name="Qwen2.5-14B-Chat",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8503/v1",
    #     max_tokens=8092,
    #     temperature=0.02,
    #     request_timeout=60,
    #     top_p=0.95,
    #     presence_penalty=0.1,
    #     frequency_penalty=0.1,
    # )

    # Qwen2.5-Coder-14B
    # agent_llm = CustomChatOpenAI(
    #     model_name="Qwen2.5-Coder-14B-Chat",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8505/v1",
    #     max_tokens=10000,  # 减小 token 限制以提高响应速度
    #     temperature=0.2,  # 降低温度使输出更确定性
    #     request_timeout=60,  # 添加请求超时设置
    #     top_p=0.95,  # 添加 top_p 采样
    #     presence_penalty=0.1,  # 添加存在惩罚以减少重复
    #     frequency_penalty=0.1,  # 添加频率惩罚以增加多样性
    # )

    # qwen25_32b_model
    # agent_llm = CustomChatOpenAI(
    #     model_name="Qwen2.5-32B-Chat",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.173.19:8504/v1",
    #     max_tokens=8092,
    #     temperature=0.2,
    #     request_timeout=60,
    #     top_p=0.95,
    #     presence_penalty=0.1,
    #     frequency_penalty=0.1,
    # )

    # llama cpp
    # agent_llm = ChatOpenAI(
    #     model_name="Tome-max",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.102.250:3522/v1",
    #     temperature=0.2,
    # )

    # ollama
    # agent_llm = ChatOpenAI(
    #     model_name="qwen2-5-14b",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.102.250:3523/v1",
    #     temperature=0.2,
    #     request_timeout=60,
    #     max_tokens=10000,
    # )

    # GUFF Tome
    # agent_llm = CustomChatOpenAI(
    #     model_name="Tome-max",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.102.250:3521/v1",
    #     max_tokens=8092,
    #     temperature=0.2,
    #     request_timeout=60,
    #     top_p=0.95,
    #     presence_penalty=0.1,
    #     frequency_penalty=0.1,
    # )

    # tool_llm = CustomChatOpenAI(
    #     model_name="Tome-pro-14B",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.152.11:8342/v1",
    #     max_tokens=4096,        # 减小 token 限制以提高响应速度
    #     temperature=0.2,        # 降低温度使输出更确定性
    #     request_timeout=60,     # 添加请求超时设置
    #     top_p=0.95,             # 添加 top_p 采样
    #     presence_penalty=0.1,   # 添加存在惩罚以减少重复
    #     frequency_penalty=0.1,  # 添加频率惩罚以增加多样性
    # )
    # agent_llm = CustomChatOpenAI(
    #     model_name="Tome-L",
    #     openai_api_key="EMPTY",
    #     openai_api_base="http://192.168.152.11:8303/v1",
    # )

    # llm = ChatOpenAI(
    # ad_connect = AD_CONNECT()
    # appid = "Ns7-6d2LMDc5UlxEjaz"
    # agent_llm = CustomChatOpenAI(
    #     model_name="GPT4o",
    #     openai_api_key=appid,
    #     openai_api_base="https://pre.anydata.aishu.cn:8444/api/model-factory/v1/",
    #     # max_tokens=4096,
    #     # temperature=0.2,
    #     # top_p=0.95,
    #     # presence_penalty=0.1,
    #     # frequency_penalty=0.1,
    #     verify_ssl=False
    # )

    # tool_llm = agent_llm

    return agent_llm, tool_llm

def get_parameter():

#     task_desc = dedent(f"""
# - 回答问题前，最优先的是帮助用户找到数据资源，并引导用户问出正确的问题
# - 如果 {ToolName.from_knowledge_enhanced.value} 工具没有返回结果，不要着急结束问答，不要着急反问用户，先使用 {ToolName.from_sailor.value} 搜索数据资源，确认我们是否有相关的资源，并尽量给用户提供可用的数据资源
# - 反问用户前，记得先使用 {ToolName.from_sailor.value} 搜索数据资源，确认我们是否有相关的资源，并尽量给用户提供可用的数据资源，别忘了把搜索结果告诉给用户
# - 如果 {ToolName.from_sailor.value} 搜索后没有找打合适的资源，不需要调用工具进行查询
# - 如果用户的问题不明确或有歧义的，你要根据数据表的描述来反问用户引导用户补全条件，并根据描述信息提示用户可以根据哪些字段和维度进行提问
# - 当用户问题不明确或有歧义的时，不要调用 {ToolName.from_text2sql.value} 工具或 {ToolName.from_text2metric.value} 工具，根据规则反问用户，等待用户补充问题
# - 当用户需要对 {ToolName.from_sailor.value} 搜索到的数据资源进行过滤时，请调用 {ToolName.from_datasource_filter.value} 工具
# - 你可以进行多次反问，并且在任何阶段都可以反问用户
# - 如果你不能理解用户问题中的某些成分时，需要反问用户，该成分属于什么实体
# - 如果搜索工具返回的结果为空，你需要反问用户
# - 如果缓存的数据资源不能支持回答用户的问题，要重新搜索
# - 你需要判断当前拿到的数据资源能否支持回答用户的问题，如果不能回答则需要重新调用 {ToolName.from_sailor.value} 工具，如果可以支持回答用户的问题，则使用已有的资源回答，不需要在调用 {ToolName.from_sailor.value} 工具
# - 切记不能捏造数据进行反问，否则会误导用户并导致毁灭性灾难
# - 如果你发现缺少必要字段或视图结构问题，请停止当前Action，并反问用户，引导用户补充必要条件
# - 有的问题可以通过多次调用工具的方式来回答，不需要通过写一个复杂的 SQL 来回答
# - 你非常的聪明和热心，当每次回答完后，你都要根据上下文主动问下用户还是否需要别的帮助或者建议后续的查询
# """)
    task_desc = dedent(f"""
必须遵循以下规则：

### search 工具使用规则

* 所有搜索类问题必须调用 `search` 工具，**禁止编造回答或直接作答**。
* 每当用户提出新的问题，先判断是否需要搜索，**如需搜索必须调用 `search`**。
* 如果 `search` 工具返回为空，可以再尝试一次后再考虑是否反问用户。

---

###  datasource_filter 使用规则

* 仅在用户明确要求在搜索结果基础上做筛选时，才使用 `datasource_filter`。
* 如果用户不是基于已有结果提问，**不要使用该工具**。

---

### 反问用户的情况

* 在以下情况中，应该终止当前操作并反问用户：
  * 问题不明确或存在歧义；
  * 问题中缺少必要字段；
  * 当前数据资源无法支持问题；
  * 多次搜索无结果；
  * 不清楚用户意图或语义成分；
  * 出现字段或视图结构问题。
* 反问内容必须基于已有数据资源的描述，**严禁捏造字段或数据示例**。
* 可以提供案例帮助用户明确问题，例如：

  > 你是否想问：
  >
  > 1. 去年 XXX 公司的营业收入是多少？
  > 2. XXX 公司的证券代码是什么？
  > 3. 今年一季度每月销量是多少？

---

### 禁止事项

* **禁止编造任何数据或字段用于回答或反问**。
                       

### 沙箱环境工具使用规则
                       
* 如果用 {ToolName.from_text2sql.value} 或 {ToolName.from_text2metric.value} 获取了数据，需要用沙箱进行分析，请先判断结果的大小，如果内容较大，例如超过了 10 行或者 100 字符，则使用 {ToolName.sandbox.value} 的 `create_file` action 将结果写入到文件中，然后再使用 `execute_code` action 执行代码
* 如果已经保存文件，则生成代码调用  `execute_code` 时，直接读取文件即可，不需要把大量数据带入到代码中
* 注意字符编码问题，如果返回结果是中文，请使用 `utf-8` 编码

    """)

    parameter = {
        "session_id": str(uuid4()),
        "ad_gateway_url": "https://192.168.181.27:8444",
        # 234
        # "AF_DEBUG_IP": "http://10.4.109.234",
        # "view_list": ["8113d24a-9d56-4eb3-8da1-95bf339007d8"],
        # "indicator_list": ["532179399886306706", "532180019821215122", "532179886694006162", "532179603914030482"],
        # # "indicator_list": ["532179603914030482"],
        # "token": get_authorization("https://10.4.109.234", "liberly", "111111"),
        # "user_id": "bc1e5d48-cfbf-11ee-ac16-f26894970da0",  # 234 用户

        # 201
        # "AF_DEBUG_IP": "http://10.4.109.201",
        # 化工
        # "indicator_list": ["536341918896915159", "536342027512611543", "536342444980077271", "536342689256342231"],
        # 立白
        # "view_list": ["be45a345-d9a4-4505-bbaa-e65fa36bfe78"],
        # "indicator_list": ["535772491461722839", "536195966831723223", "536195625633481431", "536196205823165143"],
        # "token": get_authorization("http://10.4.109.201", "liberly", "111111"),
        # "user_id": "e3e51a0a-0f30-11ef-a09c-62fb8b52b81d",

        # 142
        # "AF_DEBUG_IP": "http://10.4.109.142",
        # "AD_GATEWAY_USER": "liberly",
        # "AD_GATEWAY_PASSWORD": "eisoo.com123",
        # "view_list": ["3dc503a6-827d-40a3-b78c-9e28087c9cfc"],
        # "indicator_list": ["541569060106716947", "541569242810599187", "541569417713075987", "541569516732204819"],
        # "token": get_authorization("http://10.4.109.142", "liberly", "111111"),
        # "user_id": "1a5df062-e2e9-11ee-bc25-de01d9e8c5c1",
# 

        # 192.168.181.27
        # "AF_DEBUG_IP": "https://192.168.181.27",
        # "AD_GATEWAY_USER": "zyh",
        # "AD_GATEWAY_PASSWORD": "111111",
        # # "view_list": ["0e28edb1-b309-44e2-81b5-bc4aac870de9"],
        # # "indicator_list": ["540407952356457333", "540407838573378421", "545485743628270359", "545485327620422423"],
        # # "token": get_authorization("https://192.168.181.27", "zyh", "111111"),
        # # "user_id": "bd807fd6-a2f5-11ef-8cb2-ee22f1c9e319",
        # "view_list": ["0e28edb1-b309-44e2-81b5-bc4aac870de9"],
        # "indicator_list": ["545474270982093591", "545473147613264663"],
        # "token": get_authorization("https://192.168.181.27", "zyh", "111111"),
        # "user_id": "bd807fd6-a2f5-11ef-8cb2-ee22f1c9e319",

        # 10.4.111.246
        # "ad_gateway_url": "https://10.4.135.251:8444",
        # "AF_DEBUG_IP": "https://10.4.111.246",
        # "AD_GATEWAY_USER": "liberly",
        # "AD_GATEWAY_PASSWORD": "eisoo.com123",
        # "view_list": ["f68c61a7-d7ec-4c05-9406-ab53e140dd01", "f645ad34-a28b-4b92-960d-89acea67a96e"],
        # "indicator_list": ["550553203188496077", "550553625571686093", "550553311317653197", "550553544386737869"],
        # # "indicator_list": ["550553203188496077"],
        # "token": get_authorization("https://10.4.111.246", "xia", "eisoo.com123"),
        # "user_id": "a979abfa-d952-11ef-8ef0-faff6bb8d829",

        # 10.4.134.26
        "ad_gateway_url": "https://10.4.135.251:8444",
        "AF_DEBUG_IP": "https://10.4.134.26",
        "AD_GATEWAY_USER": "liberly",
        "AD_GATEWAY_PASSWORD": "eisoo.com123",
        "view_list": ["621c6638-64cc-4a70-9743-dc140f759d3e", "7a695eb6-668a-4f16-9e8b-5228f6f1b510"],
        "indicator_list": ["559105028636286450", "564359530884898217"],
        "token": get_authorization("https://10.4.134.26", "liberly", "111111"),
        "user_id": "ada5427e-e8ee-11ef-b48e-721bec4b5bed",
        # "ad_gateway_url": "https://10.4.135.251:8444",
        # "AF_DEBUG_IP": "https://10.4.111.247",
        # "AD_GATEWAY_USER": "liberly",
        # "AD_GATEWAY_PASSWORD": "eisoo.com123",
        # "view_list": ["4830f9d6-ebab-4cd2-badf-8cdae6c723b8", "377c0c72-c8de-46c3-a46e-69b40dbc993a"],
        # "indicator_list": ["564216184304588723", "564216333806360499"],
        # "token": get_authorization("https://10.4.111.247", "liberly", "111111"),
        # # "user": "liberly",
        # "user_id": "efc8fb64-1b61-11f0-a751-be5477dce711",

        "query": "基于工时日期（按季度）和部门名称显示近三年的项目个数。",
        "background": "- 有的问题可以通过多次调用工具的方式来回答，不需要通过写一个复杂的sql来回答",
        "task_description": task_desc,
        # "tool_list": ["2"],
        "work_mode": "1",
        "return_record_limit": 20,
        "return_data_limit": 5000,
        "dimension_num_limit": 20,
        "view_num_limit": 4,
        "server_url": "http://127.0.0.1:9101"
    }

    if not parameter["session_id"]:
        session_id = GetSessionId.from_user_id(parameter["user_id"])
        parameter["session_id"] = session_id
        print("session_id", session_id)

    # if parameter.get("AF_DEBUG_IP"):
    #     os.environ["AF_DEBUG_IP"] = parameter["AF_DEBUG_IP"]
    # if parameter.get("ad_gateway_url"):
    #     os.environ["AD_GATEWAY_URL"] = parameter["ad_gateway_url"]
    set_value("AF_DEBUG_IP", parameter["AF_DEBUG_IP"])
    set_value("AD_GATEWAY_URL", parameter["ad_gateway_url"])
    set_value("AD_GATEWAY_USER", parameter["AD_GATEWAY_USER"])
    set_value("AD_GATEWAY_PASSWORD", parameter["AD_GATEWAY_PASSWORD"])
    # set_value("AF_DEBUG_IP", parameter["AF_DEBUG_IP"])

    return parameter


def get_executor(parameter):
    agent_llm, tool_llm = get_llms()
    # prompt_manager = PromptManager(language="en")
    prompt_manager = BasePromptManager()

    toolkit = get_toolkit(parameter, tool_llm, prompt_manager)
    executor = ReactAgent(
        llm=agent_llm,
        toolkits=toolkit,
        session=base_session,
        background=parameter.get("task_description"),
        # model_type=ModelType4Prompt.DEEPSEEK_R1.value,
        prompt_manager=prompt_manager,
    )

    return executor


if __name__ == '__main__':
    import asyncio
    import traceback

    parameter = get_parameter()

    print(get_settings())

    def agent_getter():
        try:
            return get_executor(parameter)
        except Exception as e:
            traceback.print_exc()
            return None

    asyncio.run(astart_repl(parameter["session_id"], agent_getter=agent_getter))

