from typing import TYPE_CHECKING, Any, Dict

from .session import SessionCacheService

if TYPE_CHECKING:
    from .agent_core_v2 import AgentCoreV2

from app.domain.entity.session.session_cache_data import SessionCacheData

# from app.domain.entity.session import SessionEntity


class SessionHandler:
    """会话处理类"""

    agent_core: "AgentCoreV2"
    session_cache_service: SessionCacheService
    session_cache_data: SessionCacheData
    # session_entity: SessionEntity

    def __init__(self, agent_core: "AgentCoreV2"):
        self.agent_core = agent_core

        self.session_cache_service = SessionCacheService()

        self.session_cache_data = SessionCacheData()

    def set_session_cache_data(self, session_cache_data: SessionCacheData) -> None:
        self.session_cache_data = session_cache_data

    def set_llm_config(self, llm_id: str, llm_config: Dict[str, Any]) -> None:
        self.session_cache_data.llm_config_dict[llm_id] = llm_config

    def get_llm_config(self, llm_id: str) -> Dict[str, Any]:
        return self.session_cache_data.llm_config_dict.get(llm_id)

    # ----

    def set_agent_config(self, agent_config: Dict[str, Any]) -> None:
        self.session_cache_data.agent_config = agent_config

    def get_agent_config(self) -> Dict[str, Any]:
        return self.session_cache_data.agent_config

    # ----

    def set_tools_info_dict(self, tool_id: str, tool_info: Dict[str, Any]) -> None:
        self.session_cache_data.tools_info_dict[tool_id] = tool_info

    def get_tools_info_dict(self, tool_id: str) -> Dict[str, Any]:
        return self.session_cache_data.tools_info_dict.get(tool_id)

    # ----

    def set_skill_agent_info_dict(
        self, skill_agent_key: str, skill_agent_info: Dict[str, Any]
    ) -> None:
        self.session_cache_data.skill_agent_info_dict[skill_agent_key] = (
            skill_agent_info
        )

    def get_skill_agent_info_dict(self, skill_agent_key: str) -> Dict[str, Any]:
        return self.session_cache_data.skill_agent_info_dict.get(skill_agent_key)
