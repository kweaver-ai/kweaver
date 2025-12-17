"""
Dialog Log Handler V2 - 调试日志处理器

根据 dolphin-language-5002 SDK 的新 API 进行了以下调整：
1. 直接使用 Trajectory.save_simple() 静态方法保存 trajectory
2. 不再需要初始化 trajectory 对象（save_simple 是静态方法）
3. 添加了错误处理和日志记录
4. stage 参数已被弃用，不再使用

Trajectory API 说明：
- Trajectory.save_simple(): 用于一次性保存完整对话（适合我们的场景）
- context.trajectory.finalize_stage(): 用于阶段性保存（在执行过程中分阶段记录）
- context.save_trajectory(): 旧的 API，内部调用 Trajectory.save_simple()

主要功能：
- 支持 single file 和 multi directories 两种日志保存模式
- 保存 trajectory（对话轨迹）和 profile（性能分析）日志
- 自动创建目录结构
- 错误处理和日志记录
"""

from typing import Dict, Optional
import os
import datetime

from DolphinLanguageSDK.trajectory import Trajectory

from app.common.config import Config
from app.common.stand_log import StandLogger
from app.domain.vo.agentvo import AgentConfigVo
from app.domain.enum.common.user_account_header_key import get_user_account_id

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.logic.agent_core_logic_v2.agent_core_v2 import AgentCoreV2


class DialogLogHandlerV2:
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

    # ==========私有辅助方法==============
    def _get_trajectory_dir(self, config: AgentConfigVo, user_id: str) -> str:
        """获取trajectory目录路径"""
        return f"./data/dialog/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"

    def _get_profile_dir(self, config: AgentConfigVo, user_id: str) -> str:
        """获取profile目录路径"""
        return f"./data/profile/{config.agent_id}/user_{user_id}/conversation_{config.conversation_id}"

    def _save_trajectory_file(
        self, config: AgentConfigVo, user_id: str, current_time: str, file_path: str
    ) -> bool:
        """
        保存trajectory到指定文件（通用方法）

        Args:
            config: Agent配置
            user_id: 用户ID
            current_time: 当前时间戳
            file_path: 目标文件路径

        Returns:
            bool: 是否保存成功
        """
        try:
            Trajectory.save_simple(
                messages=self.ac.executor.context.get_messages().get_messages(),
                tools=self.ac.executor.context.skillkit.getSkillsSchema(),
                file_path=file_path,
                pretty_format=False,
                user_id=user_id,
            )
            return True
        except Exception as e:
            StandLogger.error(f"Failed to save trajectory to {file_path}: {e}")
            return False

    def _get_profile_content(self, config: AgentConfigVo) -> str:
        """获取profile内容"""
        return self.ac.executor.get_profile(
            f"Dolphin Runtime Profile - {config.agent_id}"
        )

    def _write_log_header(
        self, f, log_type: str, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """写入日志头部信息"""
        f.write(f"\n=== {log_type} {current_time} ===\n")
        f.write(
            f"Agent: {config.agent_id}, User: {user_id}, AgentRunId: {config.agent_run_id}\n"
        )
        f.write(f"Conversation: {config.conversation_id}\n")

    # ==========单文件模式==============
    def _save_trajectory_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """保存trajectory到单一文件"""
        # 1. 保存到临时文件
        trajectory_dir = self._get_trajectory_dir(config, user_id)
        os.makedirs(trajectory_dir, exist_ok=True)

        trajectory_filename = f"dialog_{config.agent_run_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)

        if not self._save_trajectory_file(
            config, user_id, current_time, trajectory_file
        ):
            return

        # 2. 读取并追加到单一文件
        if not os.path.exists(trajectory_file):
            return

        with open(trajectory_file, "r", encoding="utf-8") as src_file:
            trajectory_content = src_file.read()

        with open(
            Config.dialog_logging.single_trajectory_file_path, "a", encoding="utf-8"
        ) as f:
            self._write_log_header(f, "TRAJECTORY", config, user_id, current_time)
            f.write(trajectory_content)
            f.write("\n" + "=" * 80 + "\n")

    def _save_profile_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """保存profile到单一文件"""
        profile_content = self._get_profile_content(config)

        with open(
            Config.dialog_logging.single_profile_file_path, "a", encoding="utf-8"
        ) as f:
            self._write_log_header(f, "PROFILE", config, user_id, current_time)
            f.write(profile_content)
            f.write("\n" + "=" * 80 + "\n")

    def _save_to_single_file(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """保存到单一文件模式"""
        # 确保目录存在
        os.makedirs(
            os.path.dirname(Config.dialog_logging.single_profile_file_path),
            exist_ok=True,
        )
        os.makedirs(
            os.path.dirname(Config.dialog_logging.single_trajectory_file_path),
            exist_ok=True,
        )

        # 保存trajectory和profile
        self._save_trajectory_to_single_file(config, user_id, current_time)
        self._save_profile_to_single_file(config, user_id, current_time)

        # 打印日志
        StandLogger.debug(
            f"Profile saved to: {Config.dialog_logging.single_profile_file_path}"
        )
        StandLogger.debug(
            f"Trajectory saved to: {Config.dialog_logging.single_trajectory_file_path}"
        )

    # ==========多目录模式==============
    def _save_trajectory_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> Optional[str]:
        """保存trajectory到多目录模式"""
        trajectory_dir = self._get_trajectory_dir(config, user_id)
        os.makedirs(trajectory_dir, exist_ok=True)

        trajectory_filename = f"dialog_{config.agent_run_id}_{current_time}.jsonl"
        trajectory_file = os.path.join(trajectory_dir, trajectory_filename)

        if self._save_trajectory_file(config, user_id, current_time, trajectory_file):
            return trajectory_file
        return None

    def _save_profile_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> str:
        """保存profile到多目录模式"""
        profile_dir = self._get_profile_dir(config, user_id)
        os.makedirs(profile_dir, exist_ok=True)

        profile_filename = f"profile_{config.agent_run_id}_{current_time}.txt"
        profile_path = os.path.join(profile_dir, profile_filename)

        profile_content = self._get_profile_content(config)
        with open(profile_path, "w", encoding="utf-8") as f:
            f.write(profile_content)

        return profile_path

    def _save_to_multi_directories(
        self, config: AgentConfigVo, user_id: str, current_time: str
    ) -> None:
        """保存到多目录模式"""
        trajectory_file = self._save_trajectory_to_multi_directories(
            config, user_id, current_time
        )
        profile_path = self._save_profile_to_multi_directories(
            config, user_id, current_time
        )

        # 打印日志
        if trajectory_file:
            StandLogger.debug(f"Trajectory saved to: {trajectory_file}")
        if profile_path:
            StandLogger.debug(f"Profile saved to: {profile_path}")
