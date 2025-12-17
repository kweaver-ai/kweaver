from fastapi import Request
from sse_starlette import EventSourceResponse

from app.common.structs import AgentConfig, AgentInput
from app.logic.agent_core_logic.agent_core import AgentCore
from app.utils.observability.observability_log import get_logger as o11y_logger

from .common import router


@router.post("/test/{agent_name}", summary="运行agent")
async def run_agent(agent_name: str, request: Request) -> EventSourceResponse:
    """
    运行指定的agent
    """
    from data_migrations.init.agents.deepsearch import config as deepsearch_config
    from data_migrations.init.agents.DocQA_Agent import config as docqa_config
    from data_migrations.init.agents.GraphQA_Agent import config as graphqa_config
    from data_migrations.init.agents.OnlineSearch_Agent import config as online_config
    from data_migrations.init.agents.Plan_Agent import config as plan_config
    from data_migrations.init.agents.SimpleChat_Agent import config as simplechat_config
    from data_migrations.init.agents.Summary_Agent import config as summary_config

    if agent_name == "deepsearch":
        dolphin_prompt = deepsearch_config["dolphin"]
        tools = deepsearch_config["tools"]
        config = deepsearch_config
    elif agent_name == "DocQA_Agent":
        dolphin_prompt = docqa_config["dolphin"]
        tools = docqa_config["tools"]
        config = docqa_config
    elif agent_name == "GraphQA_Agent":
        dolphin_prompt = graphqa_config["dolphin"]
        tools = graphqa_config["tools"]
        config = graphqa_config
    elif agent_name == "OnlineSearch_Agent":
        dolphin_prompt = online_config["dolphin"]
        tools = online_config["tools"]
        config = online_config
    elif agent_name == "Summary_Agent":
        dolphin_prompt = summary_config["dolphin"]
        tools = summary_config["tools"]
        config = summary_config
    elif agent_name == "Plan_Agent":
        dolphin_prompt = plan_config["dolphin"]
        tools = plan_config["tools"]
        config = plan_config
    elif agent_name == "SimpleChat_Agent":
        dolphin_prompt = simplechat_config["dolphin"]
        tools = simplechat_config["tools"]
        config = simplechat_config
    else:
        o11y_logger().error(f"agent_name not found: agent_name = {agent_name}")
        raise Exception("agent_name not found")

    headers = dict(request.headers)
    body = await request.json()

    if body.get("_options"):
        config.update(body["_options"])

    agent_config = AgentConfig(**config)
    agent_input = AgentInput(**body)
    agent_core = AgentCore()
    output_generator = agent_core.outputHandler.result_output(
        agent_config, agent_input, headers
    )

    return EventSourceResponse(output_generator, ping=3600)
