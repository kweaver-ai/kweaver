from typing import TYPE_CHECKING

from app.common.config import Config
from app.driven.dip.agent_operator_integration_service import (
    agent_operator_integration_service,
)
from app.domain.enum.common.user_account_header_key import (
    get_biz_domain_id,
    get_user_account_id,
    get_user_account_type,
    set_biz_domain_id,
    set_user_account_id,
    set_user_account_type,
)
from app.domain.vo.agentvo.agent_config_vos import SkillVo

if TYPE_CHECKING:
    from ...agent_core_v2 import AgentCoreV2


async def process_skills_tools(
    ac: "AgentCoreV2",
    context_variables: dict,
    headers: dict[str, str],
    skills: SkillVo,
):
    if not skills:
        return

    for tool in skills.tools:
        service_headers = {}
        user_id = get_user_account_id(headers) or ""
        visitor_type = get_user_account_type(headers) or ""
        biz_domain_id = get_biz_domain_id(headers) or ""
        set_user_account_id(service_headers, user_id)
        set_user_account_type(service_headers, visitor_type)
        set_biz_domain_id(service_headers, biz_domain_id)
        agent_operator_integration_service.set_headers(service_headers)

        # 1. 从session缓存中获取tool_info
        tool_info = ac.session_handler.get_tools_info_dict(tool.tool_id)

        # 2. 如果session缓存中没有tool_info, 则从agent_operator_integration_service获取
        if not tool_info:
            tool_info = await agent_operator_integration_service.get_tool_info(
                tool.tool_box_id, tool.tool_id
            )

            if ac.is_warmup:
                ac.session_handler.set_tools_info_dict(tool.tool_id, tool_info)

        # 3. 保存tool_rules到context_variables
        if "tool_rules" not in context_variables["self_config"]:
            context_variables["self_config"]["tool_rules"] = {}

        context_variables["self_config"]["tool_rules"][tool_info["name"]] = tool_info[
            "use_rule"
        ]

        # 4. 设置tool_info到tool (使用__dict__直接设置属性)
        tool.__dict__["tool_info"] = tool_info
        tool.__dict__["HOST_AGENT_OPERATOR"] = (
            Config.services.agent_operator_integration.host
        )
        tool.__dict__["PORT_AGENT_OPERATOR"] = (
            Config.services.agent_operator_integration.port
        )
