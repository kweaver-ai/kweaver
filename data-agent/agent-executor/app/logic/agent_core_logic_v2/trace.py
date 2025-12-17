from opentelemetry.trace import Span


def span_set_attrs(
    span: Span, agent_run_id: str = None, agent_id: str = None, user_id: str = None
):
    """设置span属性"""

    if span and span.is_recording():
        if agent_run_id is not None:
            span.set_attribute("agent_run_id", agent_run_id)

        if agent_id is not None:
            span.set_attribute("agent_id", agent_id)

        if user_id is not None:
            span.set_attribute("user_id", user_id)
