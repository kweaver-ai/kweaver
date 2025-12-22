import json
import re
from datetime import date
import traceback
from typing import Any, Dict, List
from data_retrieval.tools import ToolMultipleResult, LogResult

from langchain.pydantic_v1 import PrivateAttr

import langchain_core.exceptions
from langchain.agents.output_parsers import ReActJsonSingleInputOutputParser
from langchain.agents.structured_chat.output_parser import StructuredChatOutputParser
from langchain_core.agents import AgentAction
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.tools import ToolException
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser
from data_retrieval.agents.base import BaseAgent
from data_retrieval.agents.react_agent.base import AfAgent, AfSailorAgentExecutor
from data_retrieval.callbacks.agent_callbacks import AfAgentActionCallbackHandler
from data_retrieval.logs.logger import logger
from data_retrieval.parsers.agent_parser import AfAgentParserErrorHandler
# from data_retrieval.prompts.agent_prompts.react_agent_prompt import (
#     SUFFIX,
#     FORMAT_INSTRUCTIONS,
#     PREFIX,
#     TOOLKIT_INSTRUCTIONS,
#     SYSTEM_BACK_GROUND_TEMPLATE
# )
from data_retrieval.sessions.redis_session import RedisHistorySession
from data_retrieval.tools import ToolResult, ToolName, LogResult, ToolMultipleResult
from data_retrieval.tools import construct_final_answer, async_construct_final_answer
from data_retrieval.tools.toolkits import InstructionBookInsideToolkit
from data_retrieval.tools.base import is_tool_message

from data_retrieval.settings import get_settings
from data_retrieval.tools.base import is_tool_message

from data_retrieval.prompts.agent_prompts.react_agent_prompt import (
    DefaultReactAgentPrompt,
    LangchainReactAgentPrompt,
    DeepSeekR1ReactAgentPrompt
)
from data_retrieval.prompts.manager.base import BasePromptManager
from data_retrieval.utils.model_types import ModelType4Prompt, get_standard_model_type
from data_retrieval.utils.llm import deal_think_tags


# 用 list 为了符合大模型的输出格式
not_find_answer = ["抱歉，发生了内部错误。您可以尝试更改关键词后重新提问。错误为: {}"]
use_knowledge_enhanced_tool = {
    "cn": f"记得每轮都使用 `{ToolName.from_knowledge_enhanced.value}` 工具，如果没有返回结果，请继续流程",
    "en": f"Remember to use `{ToolName.from_knowledge_enhanced.value}` before each other tool calling"
}
use_sailor_tool = {
    "cn": f"务必每轮都要先验证`当前对话上下文的引用的数据资源缓存`，如果不存在就必须使用 `{ToolName.from_sailor.value}` 工具进行搜索; 如果存在，则判断时需要考虑 title 和 description，如果不能，则使用 `{ToolName.from_sailor.value}` 工具重新搜索，请在 Thoughts 中输出验证结果",
    "en": f"Remember to judge whether the current Question can be answered by the referenced data resources, if not, use `{ToolName.from_sailor.value}` tool to search again, please output the verification result in Thoughts"
}

_PROMPT_CLASS = {
    ModelType4Prompt.DEFAULT.value: DefaultReactAgentPrompt,
    ModelType4Prompt.GPT4O.value: LangchainReactAgentPrompt,
    ModelType4Prompt.LANGCHAIN.value: LangchainReactAgentPrompt,
    ModelType4Prompt.DEEPSEEK_R1.value: DeepSeekR1ReactAgentPrompt
}

settings = get_settings()

class ReactAgent(BaseAgent):
    data_retrieval_executor_with_chat_history: AfSailorAgentExecutor | None = None
    # data_retrieval_executor_with_chat_history = None
    _tool_kits: InstructionBookInsideToolkit = PrivateAttr(None)
    _model_type: str = PrivateAttr(None)
    show_old_think_content: bool = False
    scratchpad_round_limit: int = 0

    def __init__(
        self,
        llm: ChatOpenAI,
        toolkits: InstructionBookInsideToolkit,
        session: RedisHistorySession = RedisHistorySession(),
        output_parser: StructuredChatOutputParser = StructuredChatOutputParser(),
        tool_name: ToolName = ToolName,
        background: str = "",
        model_type: str = settings.MODEL_TYPE,
        max_iterations: int = settings.AGENT_MAX_ITERATIONS,
        max_execution_time: int = settings.AGENT_MAX_EXECUTION_TIME,
        show_old_think_content: bool = settings.SHOW_OLD_THINK_CONTENT,
        scratchpad_round_limit: int = settings.SCRATCHPAD_ROUND_LIMIT,
        *args, **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.session = session
        self.tool_name = tool_name
        self._tool_kits = toolkits
        self.show_old_think_content = show_old_think_content
        self.scratchpad_round_limit = scratchpad_round_limit
        input_variables: list = ["input", "chat_history", "agent_scratchpad"]
        system_background_info = f"今天的日期是：{date.today()}"

        if background:
            system_background_info = f"{background}\n{system_background_info}"
        # choose the prompt based on the model type
        self._model_type = get_standard_model_type(model_type)

        # create prompt
        prompt_class = {
            ModelType4Prompt.DEFAULT.value: DefaultReactAgentPrompt,
            ModelType4Prompt.GPT4O.value: LangchainReactAgentPrompt,
            ModelType4Prompt.LANGCHAIN.value: LangchainReactAgentPrompt,
            ModelType4Prompt.DEEPSEEK_R1.value: DeepSeekR1ReactAgentPrompt
        }

        prompt_template = prompt_class[self._model_type](
            tools=toolkits.get_tools(),
            toolkit_instruction=toolkits.get_toolkit_instruction(),
            system_back_ground_info=system_background_info,
            language=self.lang,
            prompt_manager=self.prompt_manager
        )

        # deepseek don't need system prompt
        without_system_prompt = True if self._model_type == ModelType4Prompt.DEEPSEEK_R1.value else False

        # TODO:
        # 这个做法太狠了
        if ToolName.from_sailor.value in toolkits.get_tool_names():
            prompt_template.templates[prompt_template.language] += "\n\n" + use_sailor_tool[self.lang]

        if ToolName.from_knowledge_enhanced.value in toolkits.get_tool_names():
            prompt_template.templates[prompt_template.language] += "\n\n" + use_knowledge_enhanced_tool[self.lang]

        agent = AfAgent.from_llm_and_instruction_book_inside_toolkit(
            llm=llm,
            toolkit=toolkits,
            prompt_template=prompt_template,
            system_back_ground_info=system_background_info,
            input_variables=input_variables,
            output_parser=output_parser,
            without_system_prompt=without_system_prompt,
            scratchpad_round_limit=scratchpad_round_limit
        )
        agent_executor = AfSailorAgentExecutor.from_agent_and_tools(
            agent=agent,
            tools=toolkits.get_tools(),
            callbacks=[AfAgentActionCallbackHandler()],
            return_intermediate_steps=True,
            max_iterations=max_iterations,
            max_execution_time=max_execution_time,
            handle_parsing_errors=AfAgentParserErrorHandler,
            verbose=True
        )
        self.agent_executor_with_history = RunnableWithMessageHistory(
            agent_executor,
            session.get_chat_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            return_intermediate_steps=True
        )

    def _handle_chat_model_start(
            self,
            event: Dict[str, Any],
            ans_multiple: ToolMultipleResult,
            logs: List[Dict[str, Any]],
            session_id: str
    ):
        output = event['data']['input']['messages'][0][-1].content
        try:
            splits = output.split('\n')
            observation = ''
            for split in splits:
                if split.startswith('Observation: '):
                    # {"output": [{"六月份货运总量": 450.17}], "tokens": "2997", "time": "15.168721199035645"}
                    observation = split.replace('Observation: ', '')
                    break

            try:
                observation = json.loads(observation)
                output = observation.get('output', [])
                time_ = observation.get('time', '')
                tokens = observation.get('tokens', '')
            except:
                output = observation
                time_ = ''
                tokens = ''
            log = LogResult(
                observation=output,
                time=time_,
                tokens=tokens,
            )

            logs.append(log.to_json())
            return self._create_response(ans_multiple, session_id, logs)
        except Exception as e:
            logger.error(e)

    def _handle_chat_model_end(
        self,
        event: Dict[str, Any],
        parser: Any,
        ans_multiple: ToolMultipleResult,
        logs: List[Dict[str, Any]],
        session_id: str
    ):
        
        # 通过在工具的第一条增加了特殊属性，来判断是否是工具调用，message.additional_kwargs["tool_type"] 不为空
        first_message = event["data"]["input"]["messages"][0][0]
        if is_tool_message(first_message):
            return None

        try:    
            output = event["data"]["output"]["generations"][0][0]["message"].content
        except Exception as e:
            logger.info(f"正常这里不会被调用到")
            logger.error(f"Handle chat model end error: {e}")
            logger.error(traceback.format_exc())
            logger.info(event)
            return None
        try:
            # Deepseek 的 <think> tag 要处理
            # if self._model_type == ModelType4Prompt.DEEPSEEK_R1.value:
            _, think_content, answer_content = deal_think_tags(output)
            output = answer_content

            parsed_output = parser.invoke(output)
        except langchain_core.exceptions.OutputParserException as e:
            logger.info(f"this might be a tool ouptut, so we skip it: {output}")
            logger.error(e)
            # TODO 这里也会捕捉到工具内部的大模型输出，比如text2sql，所有这里尝试去解析为json，如果成功，大概就是工具内部的不模型输出，就不返回
            # TODO 这里需要优化
            try:
                JsonOutputParser().invoke(output)
                return None
            except:
                pass

            # 如果解析失败，则认为没有工具调用，则认为 Final Answer 是输出
            output = "Thought: " + output + "\nFinal Answer: " + output
            parsed_output = parser.invoke(output)

        try:
            pattern = r"(?<=Thought:)([\s\S]*?)(?=\n)"

            match = re.search(pattern, parsed_output.log)
            if match:
                thought= match.group(1).strip()
            else:
                thought = parsed_output.log.strip().split("\n")[0]

            if "Final Answer" in output:
                thought = parsed_output.return_values["output"]
                if logs and logs[-1]["tool_name"] == ToolName.from_sailor.value:
                    if ans_multiple.text:
                        # TODO: 暂时先用搜索的结果
                        # ans_multiple.text = [*ans_multiple.text]
                        # ans_multiple.text = [thought]
                        pass
                    else:
                        ans_multiple.text = [thought]
                else:
                    ans_multiple.text = [thought]

            if think_content:
                logger.debug(f"think_content: {think_content}")
            
                if self.show_old_think_content:
                    thought = f'Reasoning: {think_content}\n\nResult:{thought}'
                
            log = LogResult(
                tool_name=getattr(parsed_output, 'tool', ''),
                tool_input=getattr(parsed_output, 'tool_input', ''),
                thought=thought,
                result={}
            )

            logs.append(log.to_json())
            return self._create_response(ans_multiple, session_id, logs)
        except Exception as e:
            logger.error(e)

    def _handle_tool_end(
        self,
        event: Dict[str, Any],
        ans_multiple: ToolMultipleResult,
        logs: List[Dict[str, Any]],
        session_id: str
    ):
        if not logs:
            return None

        event_res = event.get("data", {}).get("output", {})

        try:
            if isinstance(event_res, str):
                event_res = json.loads(event_res)
        except ValueError:
            pass
        time = 0
        tokens = 0
        if isinstance(event_res, dict):
            time = event_res.get("time", 0)
            tokens = event_res.get("tokens", 0)

        log = logs[-1]
        log["time"] = time
        log["tokens"] = tokens

        # Using tools' handle result method
        tool_name = log["tool_name"]
        tool = self._tool_kits.get_tool(tool_name)
        if tool:
            if hasattr(tool, "handle_result"):
                handler = tool.handle_result
        
            if handler:
                handler(log, ans_multiple)
        return self._create_response(ans_multiple, session_id, logs)

    def _create_response(self, ans_multiple, session_id, logs):
        res = json.dumps({
            "ans": ans_multiple.to_json(),
            "session_id": session_id,
            "logs": logs
        }, ensure_ascii=False)
        logger.info(f"_create_response -> res: {res}")

        return res

    # @construct_final_answer
    # def invoke(
    #     self,
    #     input: str,
    #     session_id: str
    # ):
    #     """Select tool based on question, and invoke it.
    #     """
    #     self.session.add_chat_history(
    #         session_id,
    #         types="human",
    #         content=input
    #     )
    #     response = self.agent_executor_with_history.invoke(
    #         {"input": input}, config={
    #             "configurable": {"session_id": session_id}
    #         }
    #     )
    #     logs = []
    #     if response["intermediate_steps"]:
    #         logs = self.parse_logs(response["intermediate_steps"])
    #         print(json.dumps(logs, indent=4, ensure_ascii=False))
    #     logger.info(f"\n{response}\n")
    #     output = self.parse_output(response, session_id)

    #     return {
    #         "ans": output,
    #         "session_id": session_id,
    #         "logs": logs
    #     }

    def _add_ai_message_to_history(self, session_id: str, output: dict):
        msgs = output.get("output", {}).get("messages", [])
        # only add ai final answer to history
        added_msgs = []
        for msg in msgs:
            if msg.type != "ai":
                continue
            # 如果 Final Answer 不存在，则添加 Final Answer 前缀
            if msg.content.find("Final Answer") == -1:
                if msg.content.find("Thought") > -1 or msg.content.find("Action") > -1:
                    continue
                else:
                    msg.content = "Final Answer: " + msg.content

            msg_dict = {
                "type": msg.type,
                "content": msg.content.split("Final Answer: ")[-1]
            }
            added_msgs.append(msg_dict)
            self.session.add_chat_history(session_id, types=msg_dict["type"], content=msg_dict["content"])
        
        return {
            "session_id": session_id,
            "ai_messages": added_msgs,
        }

    # @async_construct_final_answer
    # async def ainvoke(
    #     self,
    #     input: str,
    #     session_id: str
    # ):
    #     """Select tool based on question, and invoke it asynchronously.
    #     """
    #     self.session.add_chat_history(
    #         session_id,
    #         types="human",
    #         content=input
    #     )
    #     response = await self.agent_executor_with_history.ainvoke(
    #         {"input": input}, config={
    #             "configurable": {"session_id": session_id}
    #         })
    #     logs = []
    #     if response["intermediate_steps"]:
    #         logs = self.parse_logs(response["intermediate_steps"])
    #         print(json.dumps(logs, indent=4, ensure_ascii=False))
    #     logger.info(f"\n{response}\n")
    #     output = self.parse_output(response, session_id)

    #     return {
    #         "ans": output,
    #         "session_id": session_id,
    #         "logs": logs
    #     }

    # @async_construct_final_answer
    async def astream_events(
        self,
        input: str,
        session_id: str
    ):
        """Select tool based on question, and astream_events it asynchronously.
        """
        parser = ReActJsonSingleInputOutputParser()
        ans_multiple = ToolMultipleResult()
        logs = []
        try:
            # self.session.add_chat_history(session_id, types="human", content=input)
            response = self.agent_executor_with_history.astream_events(
                {"input": input},
                config={"configurable": {"session_id": session_id}},
                version="v1",
            )

            # TODO: Caculate time and tokens
            prompt_printed = False
            tool_name_list = [member.value for member in ToolName]

            prompt_printed = False
            async for event in response:
                try:
                    if event["event"] == "on_chat_model_start":
                        logger.debug("on_chat_model_start")
                        if not prompt_printed:
                            logger.debug(event["data"]["input"]["messages"][0][0])
                            prompt_printed = True

                    elif event["event"] == "on_chat_model_end":
                        logger.info("on_chat_model_end")
                        # logger.info(event)
                        res = self._handle_chat_model_end(event, parser, ans_multiple, logs, session_id)
                        if res:
                            yield res
                    # elif event['event'] == 'on_chat_model_start':
                    #     logger.info('on_chat_model_start')
                    #     logger.info(event)
                    #     res = self._handle_chat_model_start(event=event, ans_multiple=ans_multiple, logs=logs, session_id=session_id)
                    #     if res:
                    #         yield res
                    elif event["event"] == "on_tool_start" and event["name"] in tool_name_list:
                        logger.info("on_tool_start")
                    elif event["event"] == "on_tool_end" and event["name"] in tool_name_list:
                        logger.info("on_tool_end")
                        yield self._handle_tool_end(event, ans_multiple, logs, session_id)
                    # elif event["event"] == "on_chat_model_stream":
                    #     print(event, end="|", flush=True)
                    # elif event["event"] == "on_chain_end" and event["name"] == "RunnableWithMessageHistory":
                    #     logger.info("on_chain_end - RunnableWithMessageHistory")
                    #     self._add_ai_message_to_history(session_id, event.get("data", {}))
                    # elif event["event"] == "on_chain_end" and event["name"] == "RunnableWithMessageHistory":
                    #     logger.info("on_chain_end - RunnableWithMessageHistory")
                    #     logger.info(event)
                    #     yield self._add_ai_message_to_history(session_id, event.get("data", {}))
                    # else:
                    #     logger.info(event)
                    elif event["event"] == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        if chunk:
                            print(chunk.content, end="", flush=True)
                except Exception as e:
                    if not ans_multiple.text:
                        ans_multiple.text = [not_find_answer[0].format(str(e))]
                    logger.error(traceback.format_exc())
                    break

        except Exception as e:
            if not ans_multiple.text:
                ans_multiple.text = [not_find_answer[0].format(str(e))]
            logger.error(traceback.format_exc())
            
        # 添加结束标识
        logs.append(LogResult(tool_name="ending").to_json())

        # 增加对话历史记录
        self.session.add_chat_history(session_id, types="human", content=input)

        if ans_multiple.text:
            self.session.add_chat_history(
                session_id,
                types="ai",
                content="\n".join(ans_multiple.text)
            )
        
        # 上下文中添加工具缓存
        if ans_multiple.cache_keys:
            self.session.add_chat_history(
                session_id,
                types="ai",
                content=f'当前对话上下文的工具缓存: {json.dumps(ans_multiple.cache_keys, ensure_ascii=False)}'
            )

        # 上下文中添加引用的数据资源缓存
        # 这里要和引用的数据分开，否则可能会导致调用工具前不在进行搜索了
        if ans_multiple.sailor_search_result:
            self.session.add_chat_history(
                session_id,
                types="ai",
                content=f'当前对话上下文的引用的数据资源缓存: {json.dumps(ans_multiple.sailor_search_result, ensure_ascii=False)}'
            )

        yield self._create_response(ans_multiple, session_id, logs)
