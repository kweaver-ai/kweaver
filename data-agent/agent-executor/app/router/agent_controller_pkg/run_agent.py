import json

from fastapi import Header, Request, Depends
from sse_starlette import EventSourceResponse

from app.common.errors import ParamException, AgentPermissionException
from app.common.structs import AgentConfig
from app.driven.dip.agent_factory_service import agent_factory_service
from app.domain.enum.common.user_account_header_key import (
    set_biz_domain_id,
    set_user_account_id,
    set_user_account_type,
)
from app.logic.agent_core_logic.agent_core import AgentCore
from app.utils.observability.observability_log import get_logger as o11y_logger

from .common import (
    router,
    RunAgentParam,
    RunAgentResponse,
    process_options,
    history_delete_sensitive,
)
from .dependencies import get_account_id, get_account_type, get_biz_domain_id


@router.post(
    "/run",
    summary="运行agent(由agent-app内部调用)",
    response_model=RunAgentResponse,
)
async def run_agent(
    request: Request,
    param: RunAgentParam,
    token: str = Header("", title="token", description="token"),
    account_id: str = Depends(get_account_id),
    account_type: str = Depends(get_account_type),
    biz_domain_id: str = Depends(get_biz_domain_id),
) -> EventSourceResponse:
    """
    运行agent
    """
    # 设置agent_factory_service的headers
    service_headers = {}
    set_user_account_id(service_headers, account_id)
    set_user_account_type(service_headers, account_type)
    set_biz_domain_id(service_headers, biz_domain_id)
    agent_factory_service.set_headers(service_headers)

    if param.config:
        agent_config = param.config

    elif param.id:
        # 获取agent配置
        agent_config = await agent_factory_service.get_agent_config(param.id)

        # if agent_config["status"] not in ["published", "unpublished changes"]:
        #     raise ParamException(f"Agent {param.id} is not published.")

        agent_config = agent_config["config"]
        if isinstance(agent_config, str):
            agent_config = json.loads(agent_config)

        agent_config = AgentConfig(**agent_config)
    else:
        o11y_logger().error(
            f"run_agent failed:At least one of id or config must be provided, id = {param.id}, config = {param.config}"
        )
        raise ParamException("At least one of id or config must be provided.")

    if agent_config.agent_id is None:
        agent_config.agent_id = param.id

    headers = dict(request.headers)

    agent_input = param.input

    process_options(param.options, agent_config, agent_input)

    # log_message = (
    #     f"agent_id = {param.id}       "
    #     f"agent_input = {json.dumps(agent_input.model_dump(), ensure_ascii=False)}\n"
    #     f"agent_config = {json.dumps(agent_config.model_dump(), ensure_ascii=False)}\n"
    #     f"headers = {headers}"
    # )
    # StandLogger.debug(log_message)

    agent_input = history_delete_sensitive(agent_input)

    if not await agent_factory_service.check_agent_permission(
        agent_config.agent_id, account_id, account_type
    ):
        o11y_logger().error(
            f"check_agent_permission failed: agent_id = {agent_config.agent_id}, account_id = {account_id}, account_type = {account_type}"
        )
        raise AgentPermissionException(agent_config.agent_id, account_id)
    agent_core = AgentCore()
    output_generator = agent_core.outputHandler.result_output(
        agent_config, agent_input, headers
    )

    # async for chunk in output_generator:
    #     print(chunk)
    # return ''
    return EventSourceResponse(output_generator, ping=3600)
