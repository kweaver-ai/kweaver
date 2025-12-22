from textwrap import dedent
from typing import Callable, Optional, Any

from langchain_community.tools import HumanInputRun
from langchain_core.callbacks import CallbackManagerForToolRun

from data_retrieval.sessions.redis_session import RedisHistorySession
from data_retrieval.tools.base import ToolName, ToolResult, LogPrefix


def web_input_func(query):
    # 从聊天窗口表单获取一个用户输入，并且加载服务端对应的对话状态管理内的对话记录到memory
    rebut_query = dedent(
        f"""
        《{query}》
        上面《》内的内容是一个回复给用户的问句，请将《》内的内容在其前面加上Final Answer: 回复给用户。
        """
    )
    return ToolResult(text=[rebut_query]).to_json()


class AfHumanInputTool(HumanInputRun):
    name: str = ToolName.from_human.value
    description = dedent(
        """
        当通过观察 observation 后，你觉得难以难以得出下一步 action，或者难以回答问题，或者需要补充信息，你可以询问用户来协助指引你思考。
        该工具的输入参数是一个你希望向人类提的用来协助引导你思考下一步Action的问题。
        每当使用此工具后，请一定在下一步 Action 中将上一步 Action 的 Observation 作为一个回复人类的最终回答原原本本地输出出来并结束对话。
        """
    )
    input_func: Callable = web_input_func
    session: Any
    parameter: Any
    prefix: Any

    def __init__(
        self,
        parameter: dict,
        session: RedisHistorySession = RedisHistorySession(),
        prefix: LogPrefix = LogPrefix,
    ):
        super().__init__()
        self.session = session
        self.parameter = parameter
        self.prefix = prefix

    def _run(
        self,
        query: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Use the Human input tool."""
        self.prompt_func(query)
        output = self.input_func(query)
        self.session.add_agent_logs(
            self._result_cache_key,
            logs=ToolResult(text=[query]).to_json()
        )
        return output
