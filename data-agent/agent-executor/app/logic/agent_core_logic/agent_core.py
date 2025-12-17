import json
from typing import Any, AsyncGenerator, Dict, Optional

from DolphinLanguageSDK import flags
from DolphinLanguageSDK.dolphin_language import DolphinExecutor
from DolphinLanguageSDK.utils.tools import ToolInterrupt
from DolphinLanguageSDK.skill.triditional_toolkit import TriditionalToolkit
from DolphinLanguageSDK.constant import KEY_SESSION_ID, KEY_USER_ID
from DolphinLanguageSDK.exceptions import (
    ModelException,
    SkillException,
    DolphinException,
)

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.common.errors import DolphinSDKException
from app.common.structs import AgentConfig, AgentInput
from app.logic.agent_core_logic.exception import ExceptionHandler
from app.logic.agent_core_logic.interrupt import InterruptHandler
from app.logic.agent_core_logic.intput import InputHandler
from app.logic.agent_core_logic.log import LogHandler
from app.logic.agent_core_logic.memory import MemoryHandler
from app.logic.agent_core_logic.output import OutputHandler
from app.logic.agent_core_logic.prompt_builder import PromptBuilder
from app.logic.sensitive_word_detection import check_sensitive_word
from app.domain.enum.common.user_account_header_key import (
    get_user_account_id,
    get_user_account_type,
    set_user_account_id,
    set_user_account_type,
)
from app.utils.common import (
    get_dolphin_var_value,
)
from app.utils.snow_id import snow_id
from app.common.tool.tool import build_tools
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span
from app.utils.observability.observability_log import get_logger as o11y_logger


class AgentCore:
    def __init__(self):
        self.executor = None
        self.tool_dict = {}
        self.temp_files = {}
        self.agent_config = None

        self.inputHandler = InputHandler(self)
        self.memoryHandler = MemoryHandler()
        self.logHandler = LogHandler(self)
        self.outputHandler = OutputHandler(self)

    def cleanup(self):
        if self.executor:
            self.executor.shutdown()
            self.executor = None
        if self.tool_dict:
            for tool_name, tool_instance in self.tool_dict.items():
                del tool_instance
            self.tool_dict.clear()

    @internal_span()
    async def run(
        self,
        agent_config: AgentConfig,
        agent_input: AgentInput,
        headers: Dict[str, str],
        debug: bool = False,
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

        if span and span.is_recording():
            span.set_attribute("session_id", agent_config.session_id)
            span.set_attribute("agent_id", agent_config.agent_id)
            span.set_attribute("user_id", get_user_account_id(headers) or "")

        self.agent_config = agent_config

        event_key = agent_config.session_id or "agent-session-" + str(snow_id())

        res = {}

        try:
            # 处理不同类型的输入
            await self.inputHandler.process_input(
                agent_config, agent_input, headers, debug
            )

            # 处理工具输入
            (
                context_variables,
                new_event_key,
            ) = await self.inputHandler.process_tool_input(agent_input)

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

            # 将认证信息添加到 context_variables 中
            set_user_account_id(context_variables, get_user_account_id(headers) or "")
            set_user_account_type(
                context_variables, get_user_account_type(headers) or ""
            )

            # 获取输出变量
            output_vars = agent_config.output_vars or []

            try:
                # 运行Dolphin引擎
                output_generator = self.run_dolphin(
                    agent_config, context_variables, headers, debug
                )

                if output_vars:
                    output_generator = self.outputHandler.partial_output(
                        output_generator, output_vars
                    )

                async for res in output_generator:
                    yield res

                StandLogger.info("AgentCore run end")

            except ToolInterrupt as tool_interrupt:
                # 处理工具中断
                await InterruptHandler.handle_tool_interrupt(
                    tool_interrupt, res, context_variables, event_key
                )
                yield res

            except (ModelException, SkillException, DolphinException) as e:
                dolphin_except = DolphinSDKException(
                    raw_exception=e,
                    agent_id=agent_config.agent_id,
                    session_id=agent_config.session_id,
                    user_id=get_user_account_id(headers) or "",
                )
                await ExceptionHandler.handle_exception(dolphin_except, res, headers)
                o11y_logger().error(f"agent run failed: {e}")
                yield res
            except Exception as e:
                # 处理其他异常
                await ExceptionHandler.handle_exception(e, res, headers)
                o11y_logger().error(f"agent run failed: {e}")
                yield res

        except Exception as e:
            # 处理整体异常
            await ExceptionHandler.handle_exception(e, res, headers)
            o11y_logger().error(f"agent run failed: {e}")
            yield res

    @internal_span()
    async def run_dolphin(
        self,
        config: AgentConfig,
        context_variables: Dict[str, Any],
        headers: Dict[str, str],
        debug: bool = False,
        span: Optional[Span] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """运行Dolphin引擎处理请求

        Args:
            config: Agent配置
            context_variables: 上下文变量
            headers: HTTP请求头

        Yields:
            Dict[str, Any]: Dolphin引擎生成的响应
        """
        if span and span.is_recording():
            span.set_attribute(
                "session_id", config.session_id if config.session_id else ""
            )
            span.set_attribute("agent_id", config.agent_id if config.agent_id else "")
            span.set_attribute("user_id", get_user_account_id(headers) or "")

        # 1. 构造dolphin使用的LLM参数
        llm_config = await self.inputHandler.build_llm_config(config, headers)

        # 2. 构造dolphin_prompt
        prompt_builder = PromptBuilder(config, self.temp_files)
        dolphin_prompt = await prompt_builder.build()

        # 3. 构造skills
        await self.inputHandler.build_skills(
            config, headers, llm_config, context_variables
        )

        # 3.1 构造tool_dict
        from app.domain.vo.agentvo.agent_config_vos import SkillVo

        skills = (
            self.agent_config.skills if self.agent_config is not None else SkillVo()
        )
        tool_dict = await build_tools(skills)

        # 3.2 构造toolkit
        toolkit = TriditionalToolkit.buildFromTooldict(tool_dict)

        # 4. 记录信息
        # ANSI颜色码定义
        COLORS = {
            "header": "\033[95m",  # 紫色
            "blue": "\033[94m",  # 蓝色
            "cyan": "\033[96m",  # 青色
            "green": "\033[92m",  # 绿色
            "yellow": "\033[93m",  # 黄色
            "red": "\033[91m",  # 红色
            "bold": "\033[1m",  # 粗体
            "underline": "\033[4m",  # 下划线
            "end": "\033[0m",  # 结束符
        }

        from enum import Enum

        class EnumEncoder(json.JSONEncoder):
            def default(self, o):
                if isinstance(o, Enum):
                    return o.value
                return super().default(o)

        StandLogger.info_log(
            f"{COLORS['header']}{COLORS['bold']}Agent execution details:{COLORS['end']}\n"
            f"{COLORS['blue']}========================================{COLORS['end']}\n"
            f"{COLORS['cyan']}{COLORS['bold']}Dolphin Language Prompt:{COLORS['end']}\n{dolphin_prompt}\n"
            f"{COLORS['blue']}----------------------------------------{COLORS['end']}\n"
            # f"{COLORS['green']}{COLORS['bold']}Context Variables:{COLORS['end']} {json.dumps(context_variables, indent=2, ensure_ascii=False)}\n"
            f"{COLORS['blue']}----------------------------------------{COLORS['end']}\n"
            f"{COLORS['yellow']}{COLORS['bold']}Skill Kit Tolls:{COLORS['end']} {json.dumps(toolkit.tools, indent=2, ensure_ascii=False, default=str)}\n"
            f"{COLORS['blue']}----------------------------------------{COLORS['end']}\n"
            f"{COLORS['red']}{COLORS['bold']}LLM Config:{COLORS['end']} {json.dumps(llm_config, indent=2, ensure_ascii=False, cls=EnumEncoder)}\n"
            f"{COLORS['blue']}========================================{COLORS['end']}"
        )

        # todo
        # strategy_registry = StrategyRegistry()
        # test_strategy = TestStrategy()
        # 注册自定义策略
        # strategy_registry.register("test", test_strategy, category="frontend")

        # skillkit_hook = SkillkitHook(
        #     strategy_registry=strategy_registry,
        # )

        # 6. 构造init_params
        init_params = {
            "config": llm_config,
            "variables": context_variables,
            "skillkit": toolkit,
            # "skillkit_hook": skillkit_hook,
        }

        # 7. 检查敏感词
        if check_sensitive_word(dolphin_prompt + str(context_variables)):
            message = "抱歉，您输入的内容包含敏感词汇，请重新编辑您的信息"
            output = {"answer": message}
            yield output
            return

        o11y_logger().info(f"[run_dolphin] executor_init init_params = {init_params}")
        o11y_logger().info(
            f"[run_dolphin] executor_run dolphin_prompt = {dolphin_prompt}"
        )
        # 8. 构造executor
        self.executor = DolphinExecutor(verbose=Config.app.enable_dolphin_agent_verbose)
        # 设置日志级别
        from DolphinLanguageSDK.log import set_log_level

        set_log_level(Config.app.get_stdlib_log_level())

        # 9. 初始化executor
        await self.executor.executor_init(init_params)

        # 10. 执行executor
        output = {"answer": {}}
        async for item in self.executor.run(dolphin_prompt):
            # # 仅输出不在context_variables中的变量
            # output_item = {}
            # for key, value in item.items():
            #     if key not in context_variables:
            #         output_item[key] = value
            if not debug and item.get("_progress"):
                item["_progress"] = [
                    item for item in item["_progress"] if item.get("stage") != "assign"
                ]

            item_value = {
                key: get_dolphin_var_value(value) for key, value in item.items()
            }

            output = {"answer": item_value}

            yield output

        yield output
        # StandLogger.debug_log(
        #     f"LLM块专家模式输出: {json.dumps(item_value, ensure_ascii=False)}"
        # )

        # 使用新的日志生成函数
        self.logHandler._save_debug_logs(config, headers)

        self.memoryHandler.start_memory_build_thread(
            config, context_variables, headers, item
        )
