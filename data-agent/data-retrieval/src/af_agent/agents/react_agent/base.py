from __future__ import annotations

import re
from datetime import date
from typing import (
    Any,
    Dict,
    List,
    Optional,
    Sequence,
    Tuple,
    Union,
)

from langchain.agents.agent import Agent, AgentOutputParser
from langchain.agents.agent import AgentExecutor, BaseSingleActionAgent, BaseMultiActionAgent
from langchain.agents.structured_chat.base import StructuredChatAgent
from langchain.agents.structured_chat.prompt import FORMAT_INSTRUCTIONS, PREFIX, SUFFIX
from langchain.callbacks.base import BaseCallbackManager
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
    Callbacks,
)
from langchain.chains.llm import LLMChain
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.language_models import BaseLanguageModel
from langchain_core.prompts import BasePromptTemplate
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
    HumanMessage,
    AIMessage,
    SystemMessage
)
from langchain_core.tools import BaseTool

from af_agent.tools.toolkits.base import InstructionBookInsideToolkit
from af_agent.tools.base import ToolName
from af_agent.prompts.agent_prompts.react_agent_prompt.default import DefaultReactAgentPrompt
from af_agent.prompts.base import BasePrompt
from af_agent.utils.llm import deal_think_tags


HUMAN_MESSAGE_TEMPLATE = "{input}\n\n下面开始迭代:\n\n{agent_scratchpad}"
TOOLKIT_INSTRUCTIONS = '''
与此同时，你需要仔细阅读下面关于使用工具的说明书进行action的规划。

{toolkit_instruction}
'''
SYSTEM_BACK_GROUND_TEMPLATE = '''
你可能用到的背景知识如下:

{system_back_ground_info}
'''
DEFAULT_SYSTEM_BACK_GROUND_INFO = "今天的日期是：" + str(date.today())

class AfAgent(StructuredChatAgent):
    scratchpad_round_limit: int = 0
    @classmethod
    def create_prompt(
        cls,
        human_message_template,
        prompt_template: BasePrompt,
        input_variables: Optional[List[str]] = None,
        memory_prompts: Optional[List[BasePromptTemplate]] = None,
        without_system_prompt: bool = False,
        scratchpad_round_limit: int = 0
    ) -> BasePromptTemplate:
        
        # render 会把字符串中所有的 { 都替换成 {{, 但是我们希望 prompt 中还是包含 {chat_history} 所以，要重新替换回来
        template = prompt_template.render()
        # template = template.replace("{{chat_history}}", "{chat_history}")

        # if input_variables is None:
        #     input_variables = ["input", "agent_scratchpad"]
        _memory_prompts = memory_prompts or []

        if not without_system_prompt:
            messages = [
                SystemMessage(content=template) ,
                *_memory_prompts,
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessagePromptTemplate.from_template(human_message_template),
            ]
        else:
            messages = [
                *_memory_prompts,
                HumanMessage(content="下面是你的任务，请务必牢记:"),
                HumanMessage(content=template),
                AIMessage(content="好的，我会牢记的，我一定忠实用户的问题，也不会编造数据, 忠实工具的返回结果!"),
                MessagesPlaceholder(variable_name="chat_history"),
                HumanMessagePromptTemplate.from_template(human_message_template),
            ]
        return ChatPromptTemplate(input_variables=input_variables, messages=messages, validate_template=True)

    @classmethod
    def from_llm_and_instruction_book_inside_toolkit(
        cls,
        llm: BaseLanguageModel,
        toolkit: InstructionBookInsideToolkit,
        callback_manager: Optional[BaseCallbackManager] = None,
        output_parser: Optional[AgentOutputParser] = None,
        prompt_template: BasePrompt = None,
        human_message_template: str = HUMAN_MESSAGE_TEMPLATE,
        input_variables: Optional[List[str]] = None,
        memory_prompts: Optional[List[BasePromptTemplate]] = None,
        without_system_prompt: bool = False,
        **kwargs: Any
    ) -> Agent:
        """Construct an agent from an LLM and tools."""
        cls._validate_tools(toolkit.get_tools())
        prompt = cls.create_prompt(
            prompt_template=prompt_template,
            human_message_template=human_message_template,
            input_variables=input_variables,
            memory_prompts=memory_prompts,
            without_system_prompt=without_system_prompt
        )
        llm_chain = LLMChain(
            llm=llm,
            prompt=prompt,
            callback_manager=callback_manager,
        )
        tool_names = [tool.name for tool in toolkit.get_tools()]
        _output_parser = output_parser or cls._get_default_output_parser(llm=llm)
        return cls(
            llm_chain=llm_chain,
            allowed_tools=tool_names,
            output_parser=_output_parser,
            **kwargs,
        )

    @property
    def _agent_type(self) -> str:
        """Return Identifier of agent type."""
        return "用于AF的Agent多轮对话助手"
    

    def _construct_scratchpad(
        self, intermediate_steps: List[Tuple[AgentAction, str]]
    ) -> str:
        # add solution of dealing with deepseek agent of <think> tag
        if self.scratchpad_round_limit > 0:
            new_intermediate_steps = intermediate_steps[:self.scratchpad_round_limit]
            agent_scratchpad = super()._construct_scratchpad(new_intermediate_steps)
        else:
            agent_scratchpad = super()._construct_scratchpad(intermediate_steps)

        agent_scratchpad = super()._construct_scratchpad(intermediate_steps)

        if not agent_scratchpad:
            return agent_scratchpad
        
        agent_scratchpad = f"\n\n这是你的第 {len(intermediate_steps)} 轮迭代:\n\n" + agent_scratchpad

        before_think, think, after_think = deal_think_tags(agent_scratchpad)

        new_agent_scratchpad = before_think + after_think

        print(f"new_agent_scratchpad->>: {new_agent_scratchpad}")

        return new_agent_scratchpad


def reform_output_when_last_action_is_humaninput(intermediate_steps: List[Tuple[AgentAction, str]],
                                                 output_return_values: str) -> Dict:
    FINAL_ANSWER_PREFIX = "Final Answer: "
    return_result = {}
    try:
        before_final_answer, after_final_answer = re.split(FINAL_ANSWER_PREFIX, output_return_values)
    except:
        before_final_answer = ""
        after_final_answer = output_return_values
    intermediate_info = "之前我思考并执行得到了以下步骤与对应成果\n"
    if len(intermediate_steps) == 1:
        return_result["output"] = output_return_values
    else:
        for n, (action, observation) in enumerate(intermediate_steps[:-1]):
            intermediate_info += f"第{n + 1}步,我执行了名为\"{action.tool}\"的工具,得到了如下结果:\n{observation}\n\n"
        # intermediate_info += "最后："
        return_result["output"] = before_final_answer + FINAL_ANSWER_PREFIX + intermediate_info + after_final_answer
    return return_result


class AfSailorAgentExecutor(AgentExecutor):
    def __init__(
        self,
        agent: Union[BaseSingleActionAgent, BaseMultiActionAgent],
        tools: Sequence[BaseTool],
        callbacks: Callbacks = None,
        **kwargs: Any,
    ):
        super().__init__(agent=agent, tools=tools, **kwargs)

    @classmethod
    def from_agent_and_tools(
        cls,
        agent: Union[BaseSingleActionAgent, BaseMultiActionAgent],
        tools: Sequence[BaseTool],
        callbacks: Callbacks = None,
        **kwargs: Any,
    ) -> AfSailorAgentExecutor:
        """Create from agent and tools."""
        print(cls.__class__)
        return cls(
            agent=agent,
            tools=tools,
            callbacks=callbacks,
            **kwargs,
        )

    def _return(
        self,
        output: AgentFinish,
        intermediate_steps: list,
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        if run_manager:
            run_manager.on_agent_finish(
                output, color="green",
                verbose=self.verbose
            )
        # 未知原因无法直接取得继承了langchain basetool的类的类变量，需要实例化判断
        # a_af_human_input_tool = AfHumanInputTool()
        final_output = output.return_values
        if len(intermediate_steps) > 0:
            if (
                isinstance(intermediate_steps[-1][0], AgentAction) and
                # intermediate_steps[-1][0].tool == a_af_human_input_tool.name
                intermediate_steps[-1][0].tool == ToolName.from_human.value
            ):
                # 如果上一步是人类输入，那么将中间步骤拼接进回复里。
                final_output = reform_output_when_last_action_is_humaninput(
                    intermediate_steps,
                    output.return_values['output']
                )
        if self.return_intermediate_steps:
            final_output["intermediate_steps"] = intermediate_steps
        return final_output

    async def _areturn(
        self,
        output: AgentFinish,
        intermediate_steps: list,
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        if run_manager:
            await run_manager.on_agent_finish(
                output, color="green", verbose=self.verbose
            )
        from af_agent.tools import ToolName
        # 未知原因无法直接取得继承了langchain basetool的类的类变量，需要实例化判断
        # a_af_human_input_tool = AfHumanInputTool()
        final_output = output.return_values
        if len(intermediate_steps) > 0:
            # if isinstance(intermediate_steps[-1][0], AgentAction) and intermediate_steps[-1][0].tool == a_af_human_input_tool.name:
            if isinstance(intermediate_steps[-1][0], AgentAction) and intermediate_steps[-1][0].tool == ToolName.from_human.value:
                # 如果上一步是人类输入，那么将中间步骤拼接进回复里。
                final_output = reform_output_when_last_action_is_humaninput(
                    intermediate_steps,
                    output.return_values['output']
                )
        if self.return_intermediate_steps:
            final_output["intermediate_steps"] = intermediate_steps
        return final_output
