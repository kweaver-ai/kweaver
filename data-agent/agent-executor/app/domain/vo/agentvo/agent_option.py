# -*- coding:utf-8 -*-
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AgentOptionsVo(BaseModel):
    """Agent运行选项模型(由agent-executor定义)"""

    output_vars: Optional[List[str]] = None
    incremental_output: Optional[bool] = None
    data_source: Optional[Dict[str, Any]] = None
    llm_config: Optional[Dict[str, Any]] = None
    tmp_files: Optional[List] = None

    # new add 2025年10月19日16:52:53 --start--
    agent_id: Optional[str] = None
    conversation_id: Optional[str] = None
    agent_run_id: Optional[str] = None
    # new add 2025年10月19日16:52:53 --end--
