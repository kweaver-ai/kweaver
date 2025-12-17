from typing import Dict
import os
import datetime

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.domain.vo.agentvo import AgentConfigVo
from app.domain.enum.common.user_account_header_key import get_user_account_id


from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.logic.agent_core_logic_v2.agent_core_v2 import AgentCoreV2


class DialogLogHandler:
    def __init__(self, agent_core: "AgentCoreV2"):
        self.ac = agent_core

    def save_dialog_logs(self, config: AgentConfigVo, headers: Dict[str, str]) -> None:
        """
        保存调试日志（trajectory和profile）

        Args:
            config: Agent配置
            headers: 请求头信息
        """
        # 1. 检查是否启用日志生成
        if not Config.dialog_logging.enable_dialog_logging:
            return

        # 2. 获取用户ID
        user_id = get_user_account_id(headers) or "unknown"

        # 3. 获取当前时间
        current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S_%f")

        # 4. 使用单文件模式还是多目录模式
        if Config.dialog_logging.use_single_log_file:
            self._save_to_single_file(config, user_id, current_time)
        else:
            self._save_to_multi_directories(config, user_id, current_time)

    # ==========start save to single file==============
    def _save_trajectory_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """
        保存trajectory到单一文件

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 保存trajectory到临时目录
        trajectory_dir = f"./data/dialog/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(trajectory_dir, exist_ok=True)

        trajectory_filename = f"dialog_{config.agent_run_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)

        # 先保存到临时文件，然后读取内容追加到单一文件
        self.ac.executor.context.save_trajectory(
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
                    f"Agent: {config.agent_id}, User: {user_id}, AgentRunId: {config.agent_run_id}\n"
                )
                f.write(f"Conversation: {config.conversation_id}\n")
                f.write(trajectory_content)
                f.write("\n" + "=" * 80 + "\n")

    def _save_profile_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """
        保存profile到单一文件

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 1. 获取profile
        profile_content = self.ac.executor.get_profile(
            f"Dolphin Runtime Profile - {config.agent_id}"
        )

        # 2. 保存profile到单一文件
        with open(
            Config.dialog_logging.single_profile_file_path, "a", encoding="utf-8"
        ) as f:
            f.write(f"\n=== PROFILE {current_time} ===\n")
            f.write(
                f"Agent: {config.agent_id}, User: {user_id}, AgentRunId: {config.agent_run_id}\n"
            )
            f.write(f"Conversation: {config.conversation_id}\n")
            f.write(profile_content)
            f.write("\n" + "=" * 80 + "\n")

    def _save_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """
        保存到单一文件模式（profile和trajectory分别保存）

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 1. 确保目录存在
        profile_dir = os.path.dirname(Config.dialog_logging.single_profile_file_path)
        trajectory_dir = os.path.dirname(
            Config.dialog_logging.single_trajectory_file_path
        )
        os.makedirs(profile_dir, exist_ok=True)
        os.makedirs(trajectory_dir, exist_ok=True)

        # 2. 保存trajectory和profile到单一文件
        self._save_trajectory_to_single_file(config, user_id, current_time)
        self._save_profile_to_single_file(config, user_id, current_time)

        # 3. 打印日志
        StandLogger.debug(
            f"Profile saved to: {Config.dialog_logging.single_profile_file_path}"
        )
        StandLogger.debug(
            f"Trajectory saved to: {Config.dialog_logging.single_trajectory_file_path}"
        )

    # ==========end save to single file=====================

    # ==========start save to multi directories==============
    def _save_trajectory_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> str:
        """
        保存trajectory到多目录模式

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳

        Returns:
            str: trajectory文件路径
        """
        # 1. 创建trajectory目录
        trajectory_dir = f"./data/dialog/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(trajectory_dir, exist_ok=True)

        # 2. 保存trajectory到文件
        trajectory_filename = f"dialog_{config.agent_run_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)
        self.ac.executor.context.save_trajectory(
            agent_name=config.agent_id, trajectory_path=trajectory_file, force_save=True
        )

        return trajectory_file

    def _save_profile_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> str:
        """
        保存profile到多目录模式

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳

        Returns:
            str: profile文件路径
        """
        # 1. 获取profile
        profile_content = self.ac.executor.get_profile(
            f"Dolphin Runtime Profile - {config.agent_id}"
        )

        # 2. 创建profile目录
        profile_dir = f"./data/profile/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"
        os.makedirs(profile_dir, exist_ok=True)

        # 3. 生成profile文件名
        profile_filename = f"profile_{config.agent_run_id}_{current_time}.txt"
        profile_path = os.path.join(profile_dir, profile_filename)

        # 4. 保存profile
        with open(profile_path, "w", encoding="utf-8") as f:
            f.write(profile_content)

        return profile_path

    def _save_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """
        保存到多目录模式（原有的逻辑）

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
        """
        # 1. 保存trajectory
        trajectory_file = self._save_trajectory_to_multi_directories(
            config, user_id, current_time
        )

        # 2. 保存profile
        profile_path = self._save_profile_to_multi_directories(
            config, user_id, current_time
        )

        # 3. 打印日志
        StandLogger.debug(f"Profile saved to: {profile_path}")
        StandLogger.debug(f"Trajectory saved to: {trajectory_file}")

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


# ==========end save to multi directories==============
