# -*- coding:utf-8 -*-
import os

from app.common.struct_logger import struct_logger


def load_env_file(env_file_path):
    """加载 .env 文件中的环境变量"""
    if not os.path.exists(env_file_path):
        struct_logger.console_logger.debug(f".env file not found at {env_file_path}")
        return

    try:
        with open(env_file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                # 跳过空行和注释行
                if not line or line.startswith("#"):
                    continue

                # 解析键值对
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()

                    # 只有在环境变量不存在时才设置，避免覆盖已有的环境变量
                    if key and key not in os.environ:
                        os.environ[key] = value

        print(f"Loaded environment variables from {env_file_path}")
    except Exception as e:
        print(f"Error loading .env file {env_file_path}: {e}")
