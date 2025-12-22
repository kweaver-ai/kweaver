"""
沙箱工具使用示例

这个文件展示了如何使用拆分后的沙箱工具，每个工具都是独立的，可以单独使用。
"""

import asyncio
from data_retrieval.tools.sandbox_tools.toolkit import (
    ExecuteCodeTool,
    ExecuteCommandTool,
    ReadFileTool,
    CreateFileTool,
    ListFilesTool,
    GetStatusTool,
    CloseSandboxTool
)


async def example_workflow():
    """示例工作流：创建文件 -> 执行代码 -> 读取文件 -> 列出文件 -> 获取状态 -> 清理"""
    
    # 使用相同的 session_id 来共享沙箱环境
    session_id = "example_session_123"
    
    print("=== 沙箱工具拆分示例 ===")
    
    # 1. 创建文件
    print("\n1. 创建文件...")
    create_tool = CreateFileTool(session_id=session_id)
    create_result = await create_tool.ainvoke({
        "content": "print('Hello from sandbox!')\nx = 10\ny = 20\nresult = x + y\nprint(f'{x} + {y} = {result}')",
        "filename": "hello.py"
    })
    print(f"创建文件结果: {create_result}")
    
    # 2. 执行代码
    print("\n2. 执行代码...")
    execute_tool = ExecuteCodeTool(session_id=session_id)
    execute_result = await execute_tool.ainvoke({
        "content": "import pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {'name': ['Alice', 'Bob'], 'age': [25, 30]}\ndf = pd.DataFrame(data)\nprint(df)\nresult = df.to_dict()",
        "filename": "data_analysis.py",
        "output_params": ["result", "df"]
    })
    print(f"执行代码结果: {execute_result}")
    
    # 3. 读取文件
    print("\n3. 读取文件...")
    read_tool = ReadFileTool(session_id=session_id)
    read_result = await read_tool.ainvoke({
        "filename": "hello.py"
    })
    print(f"读取文件结果: {read_result}")
    
    # 4. 列出文件
    print("\n4. 列出文件...")
    list_tool = ListFilesTool(session_id=session_id)
    list_result = await list_tool.ainvoke({})
    print(f"文件列表: {list_result}")
    
    # 5. 执行命令
    print("\n5. 执行命令...")
    command_tool = ExecuteCommandTool(session_id=session_id)
    command_result = await command_tool.ainvoke({
        "command": "ls",
        "args": ["-la"]
    })
    print(f"命令执行结果: {command_result}")
    
    # 6. 获取状态
    print("\n6. 获取状态...")
    status_tool = GetStatusTool(session_id=session_id)
    status_result = await status_tool.ainvoke({})
    print(f"沙箱状态: {status_result}")
    
    # 7. 清理沙箱
    print("\n7. 清理沙箱...")
    close_tool = CloseSandboxTool(session_id=session_id)
    close_result = await close_tool.ainvoke({})
    print(f"清理结果: {close_result}")


def example_sync_usage():
    """同步使用示例"""
    print("\n=== 同步使用示例 ===")
    
    # 创建文件（同步方式）
    create_tool = CreateFileTool(session_id="sync_example")
    result = create_tool.invoke({
        "content": "print('Hello from sync!')",
        "filename": "sync_test.py"
    })
    print(f"同步创建文件结果: {result}")


if __name__ == "__main__":
    # 运行异步示例
    asyncio.run(example_workflow())
    
    # 运行同步示例
    example_sync_usage() 