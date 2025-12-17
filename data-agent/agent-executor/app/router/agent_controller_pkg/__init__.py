"""Agent Controller Package - Router module"""

# Import route functions from sub-modules
from app.router.agent_controller_pkg.run_agent import run_agent
from app.router.agent_controller_pkg.debug import debug_agent
from app.router.agent_controller_pkg.run_agent_test_by_name import (
    run_agent as run_agent_test_by_name,
)

# Import common classes and functions
from app.router.agent_controller_pkg.common import (
    RunAgentParam,
    RunAgentResponse,
    process_options,
    history_delete_sensitive,
    router,
)

# Import dependencies for test mocking
from app.driven.dip.agent_factory_service import agent_factory_service
from app.logic.agent_core_logic.agent_core import AgentCore

__all__ = [
    "run_agent",
    "debug_agent",
    "run_agent_test_by_name",
    "RunAgentParam",
    "RunAgentResponse",
    "process_options",
    "history_delete_sensitive",
    "router",
    "agent_factory_service",
    "AgentCore",
]
