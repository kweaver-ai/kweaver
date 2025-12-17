from typing import Any, AsyncGenerator, Dict, Optional
from DolphinLanguageSDK import flags
from DolphinLanguageSDK.utils.tools import ToolInterrupt
from DolphinLanguageSDK.constant import KEY_SESSION_ID, KEY_USER_ID
from DolphinLanguageSDK.exceptions import (
    ModelException,
    SkillException,
    DolphinException,
)

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.common.errors import DolphinSDKException
from app.domain.vo.agentvo import AgentInputVo, AgentConfigVo

from .exception import ExceptionHandler
from .interrupt import InterruptHandler
from .dialog_log import DialogLogHandler
from .memory import MemoryHandler
from .output import OutputHandler
from .warm_up import WarmUpHandler
from .session_handler import SessionHandler

from app.utils.snow_id import snow_id
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span
from app.utils.observability.observability_log import get_logger as o11y_logger

from .trace import span_set_attrs
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    get_user_account_type,
    set_user_account_id,
    set_user_account_type,
)
from .input_handler_pkg import (
    process_input,
    process_tool_input,
)

from .run_dolphin import run_dolphin


# AgentConfigVo

from DolphinLanguageSDK.dolphin_language import DolphinExecutor


class AgentCoreV2:
    is_warmup: bool = False

    agent_config: AgentConfigVo = None

    tool_dict: Dict[str, Any] = {}

    temp_files: Dict[str, Any] = {}

    agent_input: AgentInputVo = None

    agent_output: Dict[str, Any] = {}

    agent_run_id: str = ""

    memory_handler: MemoryHandler = None

    dialog_log_handler: DialogLogHandler = None

    output_handler: OutputHandler = None

    session_handler: SessionHandler = None

    warmup_handler: WarmUpHandler = None

    def __init__(self, agent_config: AgentConfigVo = None, is_warmup: bool = False):
        self.executor: DolphinExecutor = None
        self.tool_dict = {}
        self.temp_files = {}
        self.agent_config: AgentConfigVo = agent_config

        self.is_warmup = is_warmup

        self.memory_handler: MemoryHandler = MemoryHandler()
        self.dialog_log_handler: DialogLogHandler = DialogLogHandler(self)
        self.output_handler: OutputHandler = OutputHandler(self)

        self.session_handler: SessionHandler = SessionHandler(self)
        self.warmup_handler: WarmUpHandler = WarmUpHandler(self)

    def cleanup(self):
        if self.executor:
            self.executor.shutdown()
            self.executor = None
        if self.tool_dict:
            for tool_name, tool_instance in self.tool_dict.items():
                del tool_instance
            self.tool_dict.clear()

    @staticmethod
    def remove_context_from_response(response: Dict[str, Any]) -> Dict[str, Any]:
        """
        从响应中移除context键的公共方法

        Args:
            response: 原始响应字典

        Returns:
            移除了context键的响应字典
        """
        if "context" in response:
            response = response.copy()
            del response["context"]
        return response

    @internal_span()
    async def run(
        self,
        agent_config: AgentConfigVo,
        agent_input: AgentInputVo,
        headers: Dict[str, str],
        is_debug: bool = False,
        span: Optional[Span] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """运行Agent的核心函数

        Args:
            config: Agent配置字典
            inputs: 输入参数字典
            headers: HTTP请求头

        Yields:
            Dict[str, Any]: 包含状态和答案的字典
        """

        span_set_attrs(
            span=span,
            agent_run_id=agent_config.agent_run_id,
            agent_id=agent_config.agent_id,
            user_id=get_user_account_id(headers) or "",
        )

        self.agent_config = agent_config
        self.agent_input = agent_input

        event_key = agent_config.agent_run_id or "agent-session-" + str(snow_id())

        res = {}

        try:
            # 处理不同类型的输入
            temp_files = await process_input(
                agent_config, agent_input, headers, is_debug
            )

            # 处理工具输入
            (
                context_variables,
                new_event_key,
            ) = await process_tool_input(agent_input)

            # 更新event_key
            if new_event_key:
                event_key = new_event_key

            # 将 sessionid 添加到 context_variables 中
            context_variables[KEY_SESSION_ID] = event_key
            context_variables[KEY_USER_ID] = get_user_account_id(headers) or "unknown"

            # 根据配置启用 dophin explore v2 - 默认启用，除非DO_NOT_USE_EXPLORE_BLOCK_V2=true
            if Config.features.use_explore_block_v2:
                # context_variables["explore_block_v2"] = "true"
                flags.set_flag(flags.EXPLORE_BLOCK_V2, True)

            # 禁用dolphin sdk llm缓存
            if Config.features.disable_dolphin_sdk_llm_cache:
                flags.set_flag(flags.DISABLE_LLM_CACHE, True)

            # 根据配置启用context engineer v2
            if Config.features.use_context_engineer_v2:
                flags.set_flag(flags.ENABLE_CONTEXT_ENGINEER_V2, True)

            # 将认证信息添加到 context_variables 中
            set_user_account_id(context_variables, get_user_account_id(headers) or "")
            set_user_account_type(
                context_variables, get_user_account_type(headers) or ""
            )

            # 获取输出变量
            output_vars = agent_config.output_vars or []

            try:
                # 运行Dolphin引擎
                output_generator = run_dolphin(
                    self, agent_config, context_variables, headers, is_debug, temp_files
                )

                if output_vars:
                    output_generator = self.output_handler.partial_output(
                        output_generator, output_vars
                    )

                async for res in output_generator:
                    # 在yield前移除context键
                    yield self.remove_context_from_response(res)

                StandLogger.info("AgentCore run end")

            except ToolInterrupt as tool_interrupt:
                # 处理工具中断

                await InterruptHandler.handle_tool_interrupt(
                    tool_interrupt, res, context_variables, event_key
                )
                # 在yield前移除context键
                yield self.remove_context_from_response(res)

            except (ModelException, SkillException, DolphinException) as e:
                dolphin_except = DolphinSDKException(
                    raw_exception=e,
                    agent_id=agent_config.agent_id,
                    session_id=agent_config.agent_run_id,
                    user_id=get_user_account_id(headers) or "",
                )
                await ExceptionHandler.handle_exception(dolphin_except, res, headers)
                o11y_logger().error(f"agent run failed: {e}")
                # 在yield前移除context键
                yield self.remove_context_from_response(res)
            except Exception as e:
                # 处理其他异常
                await ExceptionHandler.handle_exception(e, res, headers)
                o11y_logger().error(f"agent run failed: {e}")
                # 在yield前移除context键
                yield self.remove_context_from_response(res)

        except Exception as e:
            # 处理整体异常
            await ExceptionHandler.handle_exception(e, res, headers)
            o11y_logger().error(f"agent run failed: {e}")
            # 在yield前移除context键
            yield self.remove_context_from_response(res)
