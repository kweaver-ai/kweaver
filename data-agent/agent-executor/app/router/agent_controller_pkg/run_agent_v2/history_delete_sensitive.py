import copy

from app.common.stand_log import StandLogger
from app.domain.vo.agentvo import AgentInputVo
from app.logic.sensitive_word_detection import check_sensitive_word


def history_delete_sensitive(agent_input: AgentInputVo) -> AgentInputVo:
    """
    删除含有敏感词的历史记录

    Args:
        agent_input: Agent输入对象

    Returns:
        AgentInputVo: 处理后的Agent输入对象
    """
    if agent_input.history is None:
        return agent_input

    history_iter = copy.deepcopy(agent_input.history)
    for i, message in enumerate(history_iter):
        if check_sensitive_word(message["content"]):
            agent_input.history.remove(message)
            StandLogger.info(f"删除带有敏感词的历史记录: {message}")

    return agent_input
