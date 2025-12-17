"""
功能特性相关配置
"""

from dataclasses import dataclass


@dataclass
class FeaturesConfig:
    """特性开关配置"""

    # 是否使用explore_block v2版本
    use_explore_block_v2: bool = True

    # 是否禁用dolphin sdk缓存
    disable_dolphin_sdk_llm_cache: bool = False

    # 是否使用context_engineer v2版本
    use_context_engineer_v2: bool = False

    # 是否启用dolphin agent输出变量控制
    enable_dolphin_agent_output_variables_ctrl: bool = True

    @classmethod
    def from_dict(cls, data: dict) -> "FeaturesConfig":
        """从字典创建配置对象"""
        return cls(
            use_explore_block_v2=data.get("use_explore_block_v2", True),
            disable_dolphin_sdk_llm_cache=data.get(
                "disable_dolphin_sdk_llm_cache", False
            ),
            use_context_engineer_v2=data.get("use_context_engineer_v2", False),
            enable_dolphin_agent_output_variables_ctrl=data.get(
                "enable_dolphin_agent_output_variables_ctrl", True
            ),
        )
