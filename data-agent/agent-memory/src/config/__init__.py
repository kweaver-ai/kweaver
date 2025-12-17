import os
import yaml
from pathlib import Path
from typing import Dict, Any
from .config import Config, MemoryConfig

# 导出配置实例
config = Config()
print("config:", config.config)
db_config = config.get_db_config()
# 导出 memory_config
memory_config = config.get_memory_config()

rerank_config = config.get_rerank_config()
