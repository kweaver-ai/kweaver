import ast
import json
from typing import Any, Dict, Optional, TYPE_CHECKING

from app.common.config import BuiltinIds, Config
from app.common.stand_log import StandLogger
from app.common.structs import AgentConfig, AgentInput
from app.driven.dip.agent_factory_service import agent_factory_service
from app.driven.dip.agent_operator_integration_service import (
    agent_operator_integration_service,
)
from app.driven.dip.model_manager_service import model_manager_service
from app.driven.infrastructure.redis import redis_pool
from app.utils.observability.trace_wrapper import internal_span
from opentelemetry.trace import Span
from app.domain.enum.common.user_account_header_key import (
    get_biz_domain_id,
    get_user_account_id,
    get_user_account_type,
    set_biz_domain_id,
    set_user_account_id,
    set_user_account_type,
)
from app.domain.vo.agentvo.agent_config_vos import ToolSkillVo, SkillInputVo

if TYPE_CHECKING:
    from app.logic.agent_core_logic.agent_core import AgentCore


class InputHandler:
    def __init__(self, agent_core: "AgentCore"):
        self.agentCore = agent_core
        self.tool_dict = {}

    @internal_span()
    async def process_input(
        self,
        agent_config: AgentConfig,
        agent_input: AgentInput,
        headers: Dict[str, str],
        debug: bool = False,
        span: Optional[Span] = None,
    ) -> None:
        """处理不同类型的输入"""
        if span and span.is_recording():
            span.set_attribute("session_id", agent_config.session_id)
            span.set_attribute("agent_id", agent_config.agent_id)
            span.set_attribute("user_id", get_user_account_id(headers) or "")
        for input_field in agent_config.input.get("fields", []):
            if input_field.get("type") == "string":
                var_name = input_field.get("name")
                var_value = agent_input.get_value(var_name)
                if var_value:
                    agent_input.set_value(var_name, str(var_value))
                else:
                    agent_input.set_value(var_name, "")

            elif input_field.get("type") == "object":
                var_name = input_field.get("name")
                var_value = agent_input.get_value(var_name)
                if var_value:
                    # 非string类型的保持原样
                    if not isinstance(var_value, str):
                        continue
                    # string类型传入，则解析
                    try:
                        var_value = json.loads(var_value)
                    except (json.JSONDecodeError, TypeError):
                        try:
                            var_value = ast.literal_eval(var_value)
                        except:
                            var_value = str(var_value)
                    agent_input.set_value(var_name, var_value)
                else:
                    agent_input.set_value(var_name, {})

            elif input_field.get("type") == "file":
                # 如果debug为True，调试页面的临时区传的是文件的元信息
                # 否则是文件内容
                var_name = input_field.get("name")
                file_infos = agent_input.get_value(var_name)
                if not file_infos:
                    file_infos = []
                agent_input.set_value(var_name, file_infos)
                self.agentCore.temp_files[var_name] = file_infos

        # 为内置变量赋值

        if not agent_input.get_value("history"):
            agent_input.set_value("history", [])

        agent_input.header = headers
        agent_input.self_config = agent_config.model_dump()

    @internal_span()
    async def process_tool_input(
        self,
        inputs: AgentInput,
        span: Optional[Span] = None,
    ) -> tuple[Dict[str, Any], Optional[str]]:
        """处理工具输入

        Args:
            inputs: 输入参数
            event_key: 事件键

        Returns:
            tuple: (处理后的上下文变量, 可能更新的event_key)
        """
        if span and span.is_recording():
            # span.set_attribute("session_id", inputs.session_id)
            # span.set_attribute("agent_id", inputs.agent_id)
            span.set_attribute(
                "user_id",
                get_user_account_id(inputs.header) or "" if inputs.header else "",
            )
        if not inputs.tool:
            # 返回模型导出的字典，确保没有tool键
            return inputs.model_dump(), None

        async with (
            redis_pool.acquire(3, "read") as redis_read_client,
            redis_pool.acquire(3, "write") as redis_write_client,
        ):
            redis_key_context = (
                f"dip:agent-executor:{inputs.tool['session_id']}:context"
            )
            cached_context = await redis_read_client.get(redis_key_context)

            new_event_key = None
            if cached_context:
                StandLogger.info(f"cached_context = {cached_context}")
                context_variables = json.loads(cached_context)
                context_variables.update(inputs.model_dump())
                new_event_key = inputs.tool["session_id"]
            else:
                inputs_dict = inputs.model_dump()
                # 移除tool字段
                if "tool" in inputs_dict:
                    inputs_dict.pop("tool")
                context_variables = inputs_dict

            await redis_write_client.delete(redis_key_context.encode("utf-8"))
            return context_variables, new_event_key

    def _configure_local_dev_llm(
        self, llm: Dict[str, Any], llm_config: Dict[str, Any]
    ) -> None:
        """配置本地开发环境的LLM设置"""
        model_name = llm["llm_config"]["name"]
        model_config = Config.get_local_dev_model_config(model_name)

        if model_config:
            # 使用配置映射表中的模型配置
            llm["llm_config"]["api"] = model_config["api"]
            llm["llm_config"]["api_key"] = model_config["api_key"]
            llm["llm_config"]["model_name"] = model_config["model"]
            llm_config["default"] = model_config["model"]
        else:
            # 使用默认配置
            llm["llm_config"]["api"] = Config.outer_llm.api
            llm["llm_config"]["api_key"] = Config.outer_llm.api_key
            llm["llm_config"]["model_name"] = Config.outer_llm.model
            llm_config["default"] = Config.outer_llm.model

        from DolphinLanguageSDK.config.global_config import TypeAPI

        llm["llm_config"]["type_api"] = TypeAPI.OPENAI.value
        llm["llm_config"]["name"] = llm["llm_config"]["model_name"]

    @internal_span()
    async def build_llm_config(
        self,
        config: AgentConfig,
        headers: Dict[str, str],
        span: Optional[Span] = None,
    ) -> Dict[str, Any]:
        if span and span.is_recording():
            span.set_attribute(
                "session_id", config.session_id if config.session_id else ""
            )
            span.set_attribute("agent_id", config.agent_id if config.agent_id else "")
            span.set_attribute("user_id", get_user_account_id(headers) or "")

        llm_config = {"default": "", "llms": {}}

        for llm in config.llms or []:
            if llm.get("is_default"):
                llm_config["default"] = llm["llm_config"]["name"]

            llm["llm_config"]["model_name"] = llm["llm_config"]["name"]

            llm["llm_config"]["api"] = (
                f"http://{Config.services.mf_model_api.host}:{Config.services.mf_model_api.port}/api/private/mf-model-api/v1/chat/completions"
            )

            if Config.local_dev.is_use_outer_llm:
                self._configure_local_dev_llm(llm, llm_config)

            llm_headers = {}
            user_id = get_user_account_id(headers)
            visitor_type = get_user_account_type(headers) or ""
            set_user_account_id(llm_headers, user_id)
            set_user_account_type(llm_headers, visitor_type)
            llm["llm_config"]["headers"] = llm_headers

            llm["llm_config"]["max_model_len"] = (
                await model_manager_service.get_llm_config(llm["llm_config"]["id"])
            )["max_model_len"]

            llm_config["llms"][llm["llm_config"]["name"]] = llm["llm_config"]

        return llm_config

    @internal_span()
    async def build_skills(
        self,
        config: AgentConfig,
        headers: Dict[str, str],
        llm_config: Dict[str, Any],
        context_variables: Dict,
        span: Optional[Span] = None,
    ):
        if span and span.is_recording():
            span.set_attribute(
                "session_id", config.session_id if config.session_id else ""
            )
            span.set_attribute("agent_id", config.agent_id if config.agent_id else "")
            span.set_attribute("user_id", get_user_account_id(headers) or "")

        # 构造skills
        # 召回tools
        if config.data_source and config.data_source.get("kg"):
            props = {
                "data_source": {"kg": config.data_source.get("kg")},
                "headers": headers,
            }

            graph_qa_tool = ToolSkillVo(
                tool_id=BuiltinIds.get_tool_id("graph_qa"),
                tool_box_id=BuiltinIds.get_tool_box_id("搜索工具"),
                tool_input=[
                    SkillInputVo(
                        enable=True,
                        input_name="query",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="props",
                        input_type="object",
                        map_type="fixedValue",
                        map_value=props,
                    ),
                ],
                intervention=False,
            )
            config.skills.tools.append(graph_qa_tool)

        if config.data_source and config.data_source.get("doc"):
            props = {
                "data_source": {"doc": config.data_source.get("doc")},
                "headers": headers,
            }

            doc_qa_tool = ToolSkillVo(
                tool_id=BuiltinIds.get_tool_id("doc_qa"),
                tool_box_id=BuiltinIds.get_tool_box_id("搜索工具"),
                tool_input=[
                    SkillInputVo(
                        enable=True,
                        input_name="query",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="props",
                        input_type="object",
                        map_type="fixedValue",
                        map_value=props,
                    ),
                ],
                intervention=False,
            )
            config.skills.tools.append(doc_qa_tool)

        # 文件处理tools
        for file_name, file_info in self.agentCore.temp_files.items():
            if file_info:
                process_file_tool = ToolSkillVo(
                    tool_id=BuiltinIds.get_tool_id("process_file_intelligent"),
                    tool_box_id=BuiltinIds.get_tool_box_id("文件处理工具"),
                    tool_input=[
                        SkillInputVo(
                            enable=True,
                            input_name="llm",
                            input_type="object",
                            map_type="model",
                            map_value=llm_config["llms"][llm_config["default"]],
                        ),
                        SkillInputVo(
                            enable=True,
                            input_name="token",
                            input_type="string",
                            map_type="var",
                            map_value="header.token",
                        ),
                    ],
                )
                config.skills.tools.append(process_file_tool)
                break

        # memory 工具
        if config.memory and config.memory.get("is_enabled"):
            build_memory_tool = ToolSkillVo(
                tool_id=BuiltinIds.get_tool_id("build_memory"),
                tool_box_id=BuiltinIds.get_tool_box_id("记忆管理"),
                tool_input=[
                    SkillInputVo(
                        enable=True,
                        input_name="user_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="agent_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="run_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="messages",
                        input_type="array",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="metadata",
                        input_type="object",
                        map_type="auto",
                        map_value="null",
                    ),
                ],
                intervention=False,
            )
            config.skills.tools.append(build_memory_tool)

            search_memory_tool = ToolSkillVo(
                tool_id=BuiltinIds.get_tool_id("search_memory"),
                tool_box_id=BuiltinIds.get_tool_box_id("记忆管理"),
                tool_input=[
                    SkillInputVo(
                        enable=True,
                        input_name="user_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="agent_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="run_id",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="query",
                        input_type="string",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="limit",
                        input_type="integer",
                        map_type="auto",
                        map_value="null",
                    ),
                    SkillInputVo(
                        enable=True,
                        input_name="threshold",
                        input_type="number",
                        map_type="auto",
                        map_value="null",
                    ),
                ],
                intervention=False,
            )
            config.skills.tools.append(search_memory_tool)

        # 构造tools实例
        await self.process_skills(config.skills, headers, context_variables)

    async def process_skills(
        self,
        skills,  # SkillVo对象
        headers: Dict[str, str],
        context_variables: Dict,
    ):
        """处理skills"""

        for tool in skills.tools:
            service_headers = {}

            user_id = get_user_account_id(headers) or ""
            visitor_type = get_user_account_type(headers) or ""
            biz_domain_id = get_biz_domain_id(headers) or ""

            set_user_account_id(service_headers, user_id)
            set_user_account_type(service_headers, visitor_type)
            set_biz_domain_id(service_headers, biz_domain_id)

            agent_operator_integration_service.set_headers(service_headers)

            tool_info = await agent_operator_integration_service.get_tool_info(
                tool.tool_box_id, tool.tool_id
            )

            # 保存tool_rules到context_variables
            if "tool_rules" not in context_variables["self_config"]:
                context_variables["self_config"]["tool_rules"] = {}

            context_variables["self_config"]["tool_rules"][tool_info["name"]] = (
                tool_info["use_rule"]
            )

            # 动态添加属性到VO对象
            tool.__dict__["tool_info"] = tool_info
            tool.__dict__["HOST_AGENT_OPERATOR"] = (
                Config.services.agent_operator_integration.host
            )
            tool.__dict__["PORT_AGENT_OPERATOR"] = (
                Config.services.agent_operator_integration.port
            )

        for agent in skills.agents:
            # 设置agent_factory_service的headers
            factory_service_headers = {}
            user_id = get_user_account_id(headers) or ""
            visitor_type = get_user_account_type(headers) or ""
            biz_domain_id = get_biz_domain_id(headers) or ""
            set_user_account_id(factory_service_headers, user_id)
            set_user_account_type(factory_service_headers, visitor_type)
            set_biz_domain_id(factory_service_headers, biz_domain_id)
            agent_factory_service.set_headers(factory_service_headers)

            agent_info = await agent_factory_service.get_agent_config_by_key(
                agent.agent_key
            )

            agent_info["config"]["conversation_id"] = (
                self.agentCore.agent_config.conversation_id
            )

            # 动态添加属性到VO对象 (使用inner_dto存储动态属性)
            agent.inner_dto.agent_info = agent_info
            agent.inner_dto.HOST_AGENT_EXECUTOR = Config.services.agent_executor.host
            agent.inner_dto.PORT_AGENT_EXECUTOR = Config.services.agent_executor.port

            agent_options = {}

            for temp_file_name, temp_file_info in self.agentCore.temp_files.items():
                if temp_file_info:
                    agent_options["tmp_files"] = temp_file_info

            if (
                agent.data_source_config
                and agent.data_source_config.type == "inherit_main"
            ):
                specific_inherit = agent.data_source_config.specific_inherit or "all"
                if specific_inherit == "docs_only":
                    agent_options["data_source"] = {
                        "doc": self.agentCore.agent_config.data_source.get("doc", []),
                        "advanced_config": self.agentCore.agent_config.data_source.get(
                            "advanced_config", {}
                        ),
                    }

                elif specific_inherit == "graph_only":
                    agent_options["data_source"] = {
                        "kg": self.agentCore.agent_config.data_source.get("kg", []),
                        "advanced_config": self.agentCore.agent_config.data_source.get(
                            "advanced_config", {}
                        ),
                    }

                elif specific_inherit == "all":
                    agent_options["data_source"] = {
                        "doc": self.agentCore.agent_config.data_source.get("doc", []),
                        "kg": self.agentCore.agent_config.data_source.get("kg", []),
                        "advanced_config": self.agentCore.agent_config.data_source.get(
                            "advanced_config", {}
                        ),
                    }

            if agent.llm_config and agent.llm_config.type == "inherit_main":
                for llm in self.agentCore.agent_config.llms or []:
                    if llm.get("is_default"):
                        agent_options["llm_config"] = llm["llm_config"]
                        break

            agent.inner_dto.agent_options = agent_options

        # mcp_tool_list = {}  # mcp_server_id -> tool_list
        for mcp in skills.mcps:
            mcp.__dict__["HOST_AGENT_OPERATOR"] = (
                Config.services.agent_operator_integration.host
            )
            mcp.__dict__["PORT_AGENT_OPERATOR"] = (
                Config.services.agent_operator_integration.port
            )
