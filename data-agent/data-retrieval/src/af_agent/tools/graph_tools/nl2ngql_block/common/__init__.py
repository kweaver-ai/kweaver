import sys
import os

# 获取当前文件的绝对路径
current_file_path = os.path.abspath(__file__)

# 获取当前文件的上级目录
current_dir = os.path.dirname(current_file_path)
sys.path.insert(0, current_dir)
# 获取上级目录的上级目录，即上上层目录
# parent_dir = os.path.dirname(current_dir)

# 将上上层目录加入到sys.path中
# sys.path.insert(0, parent_dir)

# from af_agent.tools.graph_tools.resources.executors.utils import graph_util, NebulaConnector