"""输出last_commit_info.txt的内容，方便查看当前镜像对应的commit信息等"""

import os
import sys
from app.common.struct_logger import struct_logger


def output_last_commit_info():
    """输出last_commit_info.txt的内容，方便查看当前镜像对应的commit信息等，默认不输出"""
    # 获取项目根目录(boot.py所在目录的上两级)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    commit_info_path = os.path.join(project_root, "last_commit_info.txt")

    # PyInstaller 打包后，尝试从打包目录读取
    if not os.path.exists(commit_info_path) and hasattr(sys, "_MEIPASS"):
        # PyInstaller 打包后的临时目录
        commit_info_path = os.path.join(sys._MEIPASS, "last_commit_info.txt")

    console_logger = struct_logger.console_logger

    try:
        with open(commit_info_path, "r", encoding="utf-8") as f:
            commit_info = f.read().strip()

            # 使用结构化日志，将 commit_info 作为单独字段
            console_logger.info(
                "读取最后提交信息成功",
                file_path=commit_info_path,
                commit_info=commit_info,
                is_pyinstaller_packaged=hasattr(sys, "_MEIPASS"),
            )

            sys.stdout.flush()  # 刷新标准输出

    except FileNotFoundError:
        # 文件不存在不应该是警告，只是信息提示
        console_logger.info(
            "提交信息文件未找到(开发环境正常)",
            file_path=commit_info_path,
            is_pyinstaller_packaged=hasattr(sys, "_MEIPASS"),
            note="this is normal in development",
        )
        sys.stdout.flush()

    except Exception as e:
        console_logger.error(
            "读取提交信息文件失败",
            file_path=commit_info_path,
            error_message=str(e),
            error_type=type(e).__name__,
            is_pyinstaller_packaged=hasattr(sys, "_MEIPASS"),
        )
        sys.stdout.flush()
