"""
可观测性相关配置
"""

from dataclasses import dataclass


@dataclass
class O11yConfig:
    """可观测性配置"""

    # 日志开关
    log_enabled: bool = False

    # 追踪开关
    trace_enabled: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> "O11yConfig":
        """从字典创建配置对象"""
        return cls(
            log_enabled=data.get("log_enabled", False),
            trace_enabled=data.get("trace_enabled", False),
        )


@dataclass
class DialogLoggingConfig:
    """对话日志配置"""

    # 是否启用对话日志
    enable_dialog_logging: bool = True

    # 是否使用单一日志文件
    use_single_log_file: bool = False

    # profile日志文件路径
    single_profile_file_path: str = "./data/debug_logs/profile.log"

    # trajectory日志文件路径
    single_trajectory_file_path: str = "./data/debug_logs/trajectory.log"

    @classmethod
    def from_dict(cls, data: dict) -> "DialogLoggingConfig":
        """从字典创建配置对象"""
        return cls(
            enable_dialog_logging=data.get("enable_dialog_logging", True),
            use_single_log_file=data.get("use_single_log_file", False),
            single_profile_file_path=data.get(
                "single_profile_file_path", "./data/debug_logs/profile.log"
            ),
            single_trajectory_file_path=data.get(
                "single_trajectory_file_path", "./data/debug_logs/trajectory.log"
            ),
        )
