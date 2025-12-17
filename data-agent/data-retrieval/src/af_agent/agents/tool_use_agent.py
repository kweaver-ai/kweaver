# -*- coding: utf-8 -*-
# @Author:  Xavier.chen@aishu.cn
# @Date: 2024-5-21

""" Implement base class of AF agent.

    Currently, AF agent is not a true agent.
    Only tools selection is implemented.
"""
import json
from operator import itemgetter
from typing import List, Callable, Dict, Any, Optional, Type

from langchain_core.messages import BaseMessage
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import (
    RunnablePassthrough,
    RunnableLambda
)
from langchain_core.chat_history import BaseChatMessageHistory

from langchain.tools import BaseTool
from langchain.pydantic_v1 import PrivateAttr
from langchain.pydantic_v1 import BaseModel, Field

from af_agent.agents.base import BaseAgent
from af_agent.tools.base import AFTool
from af_agent.logs.logger import logger
from af_agent.parsers.agent_parser import StrAgentParser
from af_agent.prompts import ToolUsePrompt
from af_agent.sessions.redis_session import RedisHistorySession
from af_agent.tools import ToolResult, ToolName, LogResult, construct_final_answer, async_construct_final_answer
from af_agent.tools.base_tools.knowledge_enhanced import KnowledgeEnhancedTool
from langchain.tools import BaseTool
from langchain.pydantic_v1 import BaseModel, Field, PrivateAttr
from af_agent.prompts.manager.base import BasePromptManager
from af_agent.settings import get_settings
from af_agent.utils.model_types import ModelType4Prompt, get_standard_model_type
from af_agent.parsers.base import BaseJsonParser

_SETTINGS = get_settings()

class SimpleTextToolArgs(BaseModel):
    input: str = Field(description="输入文本")


class SimpleTextTool(BaseTool):
    name = "simple_text"
    description = "返回文本原样。"
    args_schema: Type[BaseModel] =  SimpleTextToolArgs

    def _run(self, input: str, *args, **kwargs):
        logger.debug(f"simple_text -> 输入: {input}")
        return input

    async def _arun(self, input: str, *args, **kwargs):
        logger.debug(f"simple_text -> 输入: {input}")
        return input

# @tool
# def simple_text(*args, **kwargs):
#     """return text as it is.
#     """
#     logger.debug(f"simple_text -> args: {args}")
#     logger.debug(f"simple_text -> kwargs: {kwargs}")

#     return args[0]


not_found_tool_name = "chatter"
not_found_answer = "如果无法找到合适的工具，请尝试修改问题，并进行再次问答。"


def render_text_description_and_args(
    tools: list[BaseTool]
) -> str:
    text = ""
    for i, tool in enumerate(tools):
        text += (
            f"{i + 1}. **{tool.name}**"
            + "\n"
            + f"- 工具描述：{tool.description}"
            + "\n"
            + f"- 工具参数：{tool.args}"
            + "\n\n"
        )
    return text


class ToolUseAgent(BaseAgent):
    tools: List[Callable] = []
    lang: str = "cn"
    personality: str = ""
    background: str = ""
    llm: Any = None
    choose_tool_chain: Callable = None
    prompt: ToolUsePrompt = None
    with_chatter: bool = False
    session: Any = None
    kg_id: str = ""
    synonym_id: str = ""
    word_id: str = ""
    knowledge_tool: KnowledgeEnhancedTool = None

    _model_type: str = PrivateAttr(None)
    
    def __init__(
        self,
        tools,
        llm,
        personality="",
        background="",
        with_chatter=False,
        session=None,
        model_type: str = _SETTINGS.MODEL_TYPE,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.tools = tools
        self.llm = llm
        self.personality = personality
        self.background = background
        self.prompt = None
        self.knowledge_tool = KnowledgeEnhancedTool(
            kg_id=self.kg_id,
            synonym_id=self.synonym_id,
            word_id=self.word_id
        )
        self.session = session or RedisHistorySession()
        self._model_type = get_standard_model_type(model_type)

    def _get_chat_history(
        self,
        session_id,
    ):
        history = self.session.get_chat_history(
            session_id=session_id
        )
        # history = str(history)
        return history.messages

    def call_tool(self, model_output: dict):
        """Call tool based on model output.

        Args:
            model_output (dict): model output.
        """
        tool_map = {tool.name: tool for tool in self.tools}
        tool_map["chatter"] = SimpleTextTool()
        tool_name = model_output.get("name", "")

        if tool_name == "" or tool_name is None or tool_name not in tool_map:
            return "没有找到合适的工具。"

        chosen_tool = tool_map[tool_name]

        def tool_name_setter_func(x):
            x["name"] = tool_name
            return x

        # Add tool name to tool result
        tool_name_setter = RunnableLambda(tool_name_setter_func)

        return RunnablePassthrough.assign(name=tool_name_setter) | itemgetter("arguments") | chosen_tool

    def _initialize_prompt_and_chain(self, session_id):
        if self.prompt is None:
            self.prompt = ToolUsePrompt(
                lang=self.lang,
                tools=render_text_description_and_args(self.tools),
                personality=self.personality,
                background=self.background,
                # chat_history=self._get_chat_history(session_id),
                with_chatter=self.with_chatter,
                prompt_manager=self.prompt_manager
            )

            system_prompt = self.prompt.render() \
                .replace("{", "{{").replace("}", "}}")
            
            if self._model_type == ModelType4Prompt.DEEPSEEK_R1.value:
                system_prompt = "下面是你的人设以及功能, 请务必牢记，并根据用户的反馈问答问题\n" + system_prompt
                prompt = ChatPromptTemplate.from_messages(
                    [
                        ("user", system_prompt),
                        MessagesPlaceholder("chat_history", optional=True),
                        ("user", "{input}")
                    ]
                )
            else:
                prompt = ChatPromptTemplate.from_messages(
                    [
                        ("system", system_prompt),
                        MessagesPlaceholder("chat_history", optional=True),
                        ("user", "{input}")
                    ]
                )

            self.choose_tool_chain = (
                prompt
                | self.llm
                | StrAgentParser()
                | BaseJsonParser()
            )

    def _base_chain(self):
        """Make a long chain for invoking tool.
        """

        def modify_params_func(data: Dict):
            logger.debug(f"modify_params_func -> data: {data}")

            # 使用 tool_choice 中的数据
            tool_choice = data.get("tool_choice", {})
            knowledge_enhanced_info = data.get(
                "knowledge_enhanced_information", "{}"
            )

            if not tool_choice.get("name"):
                # TODO 这里直接设置为 chatter 工具，后续名字变动可能会出问题
                tool_choice["name"] = "chatter"
                return {
                    "name": not_found_tool_name,
                    "arguments": {
                        "input": not_found_answer,
                        "knowledge_enhanced_information": knowledge_enhanced_info
                    }
                }

            # 解析知识增强信息
            try:
                knowledge_enhanced_info = json.loads(knowledge_enhanced_info)
            except json.JSONDecodeError:
                logger.warning("无法解析知识增强信息")
                knowledge_enhanced_info = {}

            # 构建新的参数
            arguments = tool_choice.get("arguments", {})
            input = arguments.get("input", "")
            if not input:
                input = arguments.get("text", "")

            result = {
                "name": tool_choice.get("name"),
                "arguments": {
                    "input": input,
                    "knowledge_enhanced_information": knowledge_enhanced_info
                }
            }

            logger.debug(f"modify data: {result}")
            return result

        def extract_input_for_knowledge_tool(x):
            logger.debug(f"extract_input_for_knowledge_tool -> x: {x}")
            res = x.get("arguments", {}).get("input", "")
            if not res:
                res = x.get("arguments", {}).get("text", "")
            logger.debug(f"extract_input_for_knowledge_tool -> res  : {res}")
            return res

        input_extractor = RunnableLambda(extract_input_for_knowledge_tool)
        param_modifier = RunnableLambda(modify_params_func)

        res_chain = (
            self.choose_tool_chain
            # TODO 找寻问题：上一步的结果经过下面时，出现解析错误，其中 name 错误， 主要在流式中出现
            | RunnablePassthrough.assign(
                tool_choice=RunnablePassthrough(),
                knowledge_enhanced_information=input_extractor | self.knowledge_tool
            )
            | param_modifier
            | RunnablePassthrough.assign(output=self.call_tool)
        )

        return res_chain

    @construct_final_answer
    def invoke(self, *args, **kwargs):
        session_id = args[0].get("session_id")
        self._initialize_prompt_and_chain(session_id)
        chain = self._base_chain()

        # if "chat_history" in args[0]:
        #     chat_history = args[0].get("chat_history")
        # else:
        #     chat_history = self._get_chat_history(session_id)
        
        # if isinstance(chat_history, BaseChatMessageHistory):
        #     chat_history = chat_history.messages

        # add human input to chat history
        question = args[0].get("input", "")
        self.session.add_chat_history(
            session_id,
            types="human",
            content=question
        )

        chain_result = chain.invoke(
            *args,
            **kwargs
        )
        res = self._parse_result(chain_result, session_id)

        # TODO: 怎么存储 agent 输出
        self.session.add_chat_history(
            session_id,
            types="ai",
            content=json.dumps(res)
        )
        return {
            "ans": res,
            "session_id": session_id,
            "logs": self._parse_logs(chain_result)
        }

    @async_construct_final_answer
    async def ainvoke(self, *args, **kwargs):
        """Select tool based on question, and invoke it asynchronously.
        """
        session_id = args[0].get("session_id", "")
        if "chat_history" in args[0]:
            chat_history = args[0].get("chat_history")
        else:
            chat_history = self._get_chat_history(session_id)

        if isinstance(chat_history, BaseChatMessageHistory):
            chat_history = chat_history.messages

        self._initialize_prompt_and_chain(session_id)
        chain = self._base_chain()

        # add human input to chat history
        question = args[0].get("input")
        self.session.add_chat_history(
            session_id,
            types="human",
            content=question
        )

        chain_result = await chain.ainvoke(
            {
                "input": question,
                "chat_history": chat_history
            },
            **kwargs
        )
        res = self._parse_result(chain_result, session_id)

        # TODO: 怎么存储 agent 输出
        self.session.add_chat_history(
            session_id,
            types="ai",
            content=json.dumps(res)
        )

        return {
            "ans": res,
            "session_id": session_id,
            "logs": self._parse_logs(chain_result)
        }

    def _parse_result(self, tool: AFTool, session_id: str):
        output = ToolResult()
        output.session_id = session_id

        if tool.name == ToolName.from_text2sql.value:
            tool_res = self.session.get_agent_logs(
                tool._result_cache_key
            )
            if tool_res:
                output.table = tool_res["res"]
                output.new_table = {"title": tool_res["title"], "data": tool_res["res"]}
                output.cites = tool_res.get("cites", [])                
                output.explain = {
                    "sql": tool_res["sql"],
                    "explanation": tool_res["explanation"]
                }

        elif tool.name == ToolName.from_json2plot.value:
            tool_res = self.session.get_agent_logs(
                tool._result_cache_key
            )
            if tool_res:
                output.chart = tool_res["res"]  # 图数据
                output.new_chart = {"title": tool_res["title"], "data": {"data": tool_res["data"], "config": tool_res["config"]}}

        elif tool.name == ToolName.from_text2metric.value:
            tool_res = self.session.get_agent_logs(
                tool._result_cache_key
            )
            if tool_res:
                output.table = tool_res["res"]
                output.new_table = {"title": tool_res["title"], "data": tool_res["res"]}
                output.cites = tool_res.get("cites", [])
                output.explain = {
                    "explanation": tool_res["explanation"]
                }

        elif tool.name == ToolName.from_sailor.value:
            tool_res = self.session.get_agent_logs(
                tool._result_cache_key
            )
            if tool_res:
                output.cites = tool_res["cites"]
                output.table = tool_res["table"]
                output.df2json = tool_res["df2json"]
                output.text = tool_res["text"]
                output.explain = tool_res["explain"]
        else:
            tool_res = {}

        # TODO 优化这一块 @zkn
        return output.to_json(), tool_res

    @staticmethod
    def _parse_logs(chain_result: Dict):
        arguments = chain_result.get("arguments", {})

        if isinstance(arguments, dict):
            thought = arguments.get("input", "")
        else:
            thought = ""
        logger.debug(f"thought: {thought}")
        logger.debug(f"arguments: {arguments}")
        log = {
            "tool_name": chain_result.get("name", ""),
            "tool_input": arguments,
            "thought": thought,
            "result": chain_result.get("output", ""),
            "time": str(chain_result.get("time", "")),
            "tokens": str(chain_result.get("tokens", ""))
        }

        logger.debug(f"生成的日志: {log}")
        return log

    async def astream_events(
        self,
        input,
        session_id,
        *args,
        **kwargs
    ):
        if "chat_history" in kwargs:
            chat_history = kwargs["chat_history"]
        else:
            chat_history = self._get_chat_history(session_id)

        if isinstance(chat_history, BaseChatMessageHistory):
            chat_history = chat_history.messages

        # add human input to chat history
        self.session.add_chat_history(
            session_id,
            types="human",
            content=input
        )
        self._initialize_prompt_and_chain(session_id)
        chain = self._base_chain()

        ans = ToolResult()
        logs = []
        tool_name_list = [
            member.value
            for member in ToolName
            if member.value != ToolName.from_knowledge_enhanced.value
        ]

        async for event in chain.astream_events(
            {
                "input": input,
                "chat_history": chat_history
            },
            version="v1"
        ):
            # if the event is on_parser_end and the parser is JsonOutputParser, then we know the tool
            if event["event"] == "on_tool_end" and event["name"] in tool_name_list:
                logger.debug(f"event: {event}")
                
                # find the tool
                tool = None
                for t in self.tools:
                    if t.name == event["name"]:
                        tool = t
                        break
                if not tool:
                    raise Exception(f"tool not found: {event['name']}")

                res, tool_res = self._parse_result(tool, session_id)

                if logs:
                    log = logs[-1]
                    log["result"] = tool_res  # @zkn
                    log["tokens"] = tool_res.get("tokens", "")
                    log["time"] = tool_res.get("time", "")
                    if not tool_res:
                        res = ToolResult(
                            text="抱歉，我没有找到这个问题的答案，可尝试更改问题关键词后重新发起搜索。").to_json()

                # TODO: 怎么存储 agent 输出
                # TODO: 暂时先不存储，节约问题总结工具的token
                self.session.add_chat_history(
                    session_id,
                    types="ai",
                    content=json.dumps(res.get("result", {}).get("res", {}).get("explain", ""), ensure_ascii=False)
                )

                result = {
                    "ans": res,
                    "session_id": session_id,
                    "logs": logs
                }
                logger.debug(
                    f"tool use -> ans: {json.dumps(result, ensure_ascii=False)}")
                yield json.dumps(result, ensure_ascii=False)

            elif event["event"] == "on_tool_end" and event["name"] == "simple_text":
                logger.debug(f"event: {event}")
                res = ToolResult(text=event["data"]["output"]).to_json()
                result = {
                    "ans": res,
                    "session_id": session_id,
                    "logs": logs
                }
                logger.debug(
                    f"tool use -> ans: {json.dumps(result, ensure_ascii=False)}")

                self.session.add_chat_history(
                    session_id,
                    types="ai",
                    content=json.dumps(res.get("result", {}).get("res", {}).get("text", ""), ensure_ascii=False)
                )
                yield json.dumps(result, ensure_ascii=False)

        # 增加一个 停止标识：tool_name == ending
        logger.debug("stop")
        logs.append(LogResult(tool_name="ending").to_json())
        res = {
            "ans": res,
            "session_id": session_id,
            "logs": logs
        }
        logger.debug(json.dumps(res, ensure_ascii=False))
        yield json.dumps(res, ensure_ascii=False)
