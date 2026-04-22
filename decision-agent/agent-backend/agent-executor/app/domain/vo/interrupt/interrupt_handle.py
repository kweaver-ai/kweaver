# -*- coding:utf-8 -*-
"""中断句柄 VO"""

from typing import Optional
from pydantic import BaseModel, Field


class InterruptHandle(BaseModel):
    """恢复句柄"""

    frame_id: str = Field(..., description="执行帧ID")
    snapshot_id: str = Field(..., description="快照ID")
    resume_token: str = Field(..., description="恢复令牌")
    interrupt_type: str = Field(..., description="中断类型")
    current_block: Optional[int] = Field(None, description="当前代码块索引（tool_interrupt类型时可为None）")
    restart_block: bool = Field(..., description="是否重启代码块")
