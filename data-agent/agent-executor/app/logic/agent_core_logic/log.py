from typing import Dict
import os
import datetime

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.common.structs import AgentConfig


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.logic.agent_core_logic.agent_core import AgentCore


class LogHandler:
    def __init__(self, agent_core: "AgentCore"):
        self.agentCore = agent_core

    def _save_debug_logs(self, config: AgentConfig, headers: Dict[str, str]) -> None:
        """
        保存调试日志（trajectory和profile）

        Args:
            config: Agent配置
            headers: 请求头信息
        """
        # 检查是否启用日志生成
        if not Config.dialog_logging.enable_dialog_logging:
            return

        from app.domain.enum.common.user_account_header_key import get_user_account_id

        user_id = get_user_account_id(headers) or "unknown"
        current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")

        # 使用单文件模式还是多目录模式
        if Config.dialog_logging.use_single_log_file:
            self._save_to_single_file(config, user_id, current_time)
        else:
            self._save_to_multi_directories(config, user_id, current_time)

    def _save_to_single_file(
        self, config: AgentConfig, user_id: str, current_time: str
    ) -> None:
        """
        保存到单一文件模式（profile和trajectory分别保存）

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 确保目录存在
        profile_dir = os.path.dirname(Config.dialog_logging.single_profile_file_path)
        trajectory_dir = os.path.dirname(
            Config.dialog_logging.single_trajectory_file_path
        )
        os.makedirs(profile_dir, exist_ok=True)
        os.makedirs(trajectory_dir, exist_ok=True)

        # 保存trajectory到单一文件
        trajectory_dir = f"./data/dialog/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(trajectory_dir, exist_ok=True)

        trajectory_filename = f"dialog_{config.session_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)

        # 先保存到临时文件，然后读取内容追加到单一文件
        self.agentCore.executor.context.save_trajectory(
            agent_name=config.agent_id, trajectory_path=trajectory_file, force_save=True
        )

        # 读取trajectory文件内容并追加到单一文件
        if os.path.exists(trajectory_file):
            with open(trajectory_file, "r", encoding="utf-8") as src_file:
                trajectory_content = src_file.read()

            with open(
                Config.dialog_logging.single_trajectory_file_path, "a", encoding="utf-8"
            ) as f:
                f.write(f"\n=== TRAJECTORY {current_time} ===\n")
                f.write(
                    f"Agent: {config.agent_id}, User: {user_id}, Session: {config.session_id}\n"
                )
                f.write(f"Conversation: {config.conversation_id}\n")
                f.write(trajectory_content)
                f.write("\n" + "=" * 80 + "\n")

        # 保存profile到单一文件
        profile_content = self.agentCore.executor.get_profile(
            f"Dolphin Runtime Profile - {config.agent_id}"
        )

        with open(
            Config.dialog_logging.single_profile_file_path, "a", encoding="utf-8"
        ) as f:
            f.write(f"\n=== PROFILE {current_time} ===\n")
            f.write(
                f"Agent: {config.agent_id}, User: {user_id}, Session: {config.session_id}\n"
            )
            f.write(f"Conversation: {config.conversation_id}\n")
            f.write(profile_content)
            f.write("\n" + "=" * 80 + "\n")

        StandLogger.debug(
            f"Profile saved to: {Config.dialog_logging.single_profile_file_path}"
        )
        StandLogger.debug(
            f"Trajectory saved to: {Config.dialog_logging.single_trajectory_file_path}"
        )

    def _save_to_multi_directories(
        self, config: AgentConfig, user_id: str, current_time: str
    ) -> None:
        """
        保存到多目录模式（原有的逻辑）

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 保存trajectory
        trajectory_dir = f"./data/dialog/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(trajectory_dir, exist_ok=True)

        trajectory_filename = f"dialog_{config.session_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)
        self.agentCore.executor.context.save_trajectory(
            agent_name=config.agent_id, trajectory_path=trajectory_file, force_save=True
        )

        # 保存profile
        profile_content = self.agentCore.executor.get_profile(
            f"Dolphin Runtime Profile - {config.agent_id}"
        )
        profile_dir = f"./data/profile/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(profile_dir, exist_ok=True)

        profile_filename = f"profile_{config.session_id}_{current_time}.txt"
        profile_path = os.path.join(profile_dir, profile_filename)

        with open(profile_path, "w", encoding="utf-8") as f:
            f.write(profile_content)

        StandLogger.debug(f"Profile saved to: {profile_path}")
        # gc.collect()
        # all_objects = gc.get_objects()
        # for obj in all_objects:
        #     try:
        #         if isinstance(obj, Tool):
        #             print(f"!!! 发现未回收的实例: {obj}")
        #         if isinstance(obj, DolphinExecutor):
        #             print(f"!!! 发现未回收的实例: {obj}")
        #     except Exception:
        #         continue
