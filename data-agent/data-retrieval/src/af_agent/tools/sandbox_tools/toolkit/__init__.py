from af_agent.tools.sandbox_tools.toolkit.execute_code import ExecuteCodeTool
from af_agent.tools.sandbox_tools.toolkit.execute_command import ExecuteCommandTool
from af_agent.tools.sandbox_tools.toolkit.read_file import ReadFileTool
from af_agent.tools.sandbox_tools.toolkit.create_file import CreateFileTool
from af_agent.tools.sandbox_tools.toolkit.list_files import ListFilesTool
from af_agent.tools.sandbox_tools.toolkit.get_status import GetStatusTool
from af_agent.tools.sandbox_tools.toolkit.close_sandbox import CloseSandboxTool
from af_agent.tools.sandbox_tools.toolkit.download_from_efast import DownloadFromEfastTool

__all__ = [
    "ExecuteCodeTool",
    "ExecuteCommandTool", 
    "ReadFileTool",
    "CreateFileTool",
    "ListFilesTool",
    "GetStatusTool",
    "CloseSandboxTool"
]

SANDBOX_TOOLS_MAPPING = {
    "execute_code": ExecuteCodeTool,
    "execute_command": ExecuteCommandTool,
    "read_file": ReadFileTool,
    "create_file": CreateFileTool,
    "list_files": ListFilesTool,
    "get_status": GetStatusTool,
    "close_sandbox": CloseSandboxTool,
    "download_from_efast": DownloadFromEfastTool
}
