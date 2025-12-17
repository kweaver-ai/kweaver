# 沙箱工具包 (Sandbox Toolkit)

这个目录包含了从 `shared_all_in_one.py` 拆分出来的独立沙箱工具。每个工具都是独立的，可以单独使用，也可以组合使用。

## 工具列表

### 1. ExecuteCodeTool - 执行代码工具
- **功能**: 在沙箱环境中执行 Python 代码
- **支持**: pandas、numpy 等数据分析库
- **参数**:
  - `content`: 要执行的 Python 代码内容
  - `filename`: 文件名（可选）
  - `args`: 代码执行参数（可选）
  - `output_params`: 输出参数列表（可选）
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 2. ExecuteCommandTool - 执行命令工具
- **功能**: 在沙箱环境中执行系统命令
- **支持**: Linux 命令如 ls、cat、grep 等
- **参数**:
  - `command`: 要执行的系统命令
  - `args`: 命令参数列表（可选）
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 3. ReadFileTool - 读取文件工具
- **功能**: 读取沙箱环境中的文件内容
- **支持**: 文本文件和二进制文件
- **参数**:
  - `filename`: 要读取的文件名
  - `result_cache_key`: 结果缓存key（可选）
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 4. CreateFileTool - 创建文件工具
- **功能**: 在沙箱环境中创建新文件
- **支持**: 文本内容或从缓存中获取内容
- **参数**:
  - `content`: 文件内容
  - `filename`: 要创建的文件名
  - `result_cache_key`: 缓存key，用于从缓存获取内容（可选）
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 5. ListFilesTool - 列出文件工具
- **功能**: 列出沙箱环境中的所有文件
- **参数**:
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 6. GetStatusTool - 获取状态工具
- **功能**: 获取沙箱环境的当前状态
- **参数**:
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

### 7. CloseSandboxTool - 关闭沙箱工具
- **功能**: 清理沙箱工作区，关闭沙箱连接
- **参数**:
  - `title`: 对于当前操作的简单描述，便于用户理解（可选）

## 异常处理

所有工具都包含完善的异常处理机制：

### 执行代码和命令的异常处理

- **stderr 检查**: 检查标准错误输出，记录警告但不中断执行
- **return_code 检查**: 检查返回码，非零时抛出异常
- **错误信息检查**: 检查结果中的 error 字段

### 其他操作的异常处理

- **错误信息检查**: 检查结果中的 error 和 exception 字段
- **文件操作验证**: 验证文件是否存在、是否可读等

## 使用方法

### 基本使用

```python
from af_agent.tools.sandbox_tools.toolkit import ExecuteCodeTool, CreateFileTool

# 创建工具实例
create_tool = CreateFileTool(session_id="my_session")
execute_tool = ExecuteCodeTool(session_id="my_session")

# 创建文件
result = await create_tool.ainvoke({
    "content": "print('Hello World')",
    "filename": "hello.py",
    "title": "创建 Hello World 示例文件"
})

# 执行代码
result = await execute_tool.ainvoke({
    "content": "import pandas as pd\nprint('Data analysis ready')",
    "output_params": ["df"],
    "title": "执行数据分析环境准备代码"
})
```

### 同步使用

```python
from af_agent.tools.sandbox_tools.toolkit import CreateFileTool

# 同步方式创建文件
create_tool = CreateFileTool(session_id="sync_session")
result = create_tool.invoke({
    "content": "print('Hello from sync!')",
    "filename": "sync_test.py",
    "title": "同步方式创建测试文件"
})
```

### 完整工作流示例

```python
import asyncio
from af_agent.tools.sandbox_tools.toolkit import *

async def complete_workflow():
    session_id = "workflow_session"
    
    # 1. 创建文件
    create_tool = CreateFileTool(session_id=session_id)
    await create_tool.ainvoke({
        "content": "def fibonacci(n):\n    return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)\nprint(fibonacci(10))",
        "filename": "fibonacci.py",
        "title": "创建斐波那契数列代码文件"
    })
    
    # 2. 执行代码
    execute_tool = ExecuteCodeTool(session_id=session_id)
    result = await execute_tool.ainvoke({
        "content": "exec(open('fibonacci.py').read())",
        "output_params": ["result"],
        "title": "执行斐波那契数列计算代码"
    })
    
    # 3. 读取文件
    read_tool = ReadFileTool(session_id=session_id)
    file_content = await read_tool.ainvoke({
        "filename": "fibonacci.py",
        "title": "读取斐波那契数列代码文件内容"
    })
    
    # 4. 清理
    close_tool = CloseSandboxTool(session_id=session_id)
    await close_tool.ainvoke({
        "title": "清理沙箱工作区资源"
    })

# 运行工作流
asyncio.run(complete_workflow())
```

## API 方法支持

所有工具都支持以下 API 方法：

### as_async_api_cls 方法

用于异步 API 调用，支持通过字典参数调用工具：

```python
# 异步 API 调用
result = await ExecuteCodeTool.as_async_api_cls(
    params={
        "server_url": "http://localhost:8080",
        "session_id": "api_session_123",
        "session_type": "redis",
        "content": "print('Hello from API')",
        "filename": "api_test.py"
    }
)
```

### get_api_schema 方法

用于获取工具的 API Schema，用于 API 文档生成：

```python
# 获取 API Schema
schema = await ExecuteCodeTool.get_api_schema()
print(schema["post"]["summary"])  # "execute_code"
print(schema["post"]["description"])  # 工具描述
```

### API 调用示例

```python
import asyncio
from af_agent.tools.sandbox_tools.toolkit import ExecuteCodeTool, CreateFileTool

async def api_example():
    # 创建文件
    create_result = await CreateFileTool.as_async_api_cls(params={
        "session_id": "api_test",
        "content": "print('Hello from API')",
        "filename": "api_hello.py",
        "title": "通过API创建测试文件"
    })
    
    # 执行代码
    execute_result = await ExecuteCodeTool.as_async_api_cls(params={
        "session_id": "api_test",
        "content": "exec(open('api_hello.py').read())",
        "title": "通过API执行测试代码"
    })
    
    print("创建文件结果:", create_result)
    print("执行代码结果:", execute_result)

# 运行示例
asyncio.run(api_example())
```

## 重要特性

### 会话管理
- 所有工具都支持 `session_id` 参数
- 使用相同的 `session_id` 可以在同一个沙箱环境中操作
- 如果不提供 `session_id`，会自动生成一个随机ID

### Title 参数
- 所有工具都支持 `title` 参数，用于提供对当前操作的简单描述
- `title` 参数便于用户理解操作内容，会在返回结果中显示
- 如果未提供 `title`，系统会自动使用操作结果的 `message` 作为默认标题
- 建议在使用工具时提供有意义的 `title` 描述，提高用户体验

### 错误处理
- 所有工具都包含完整的错误处理
- 错误信息会包含详细的原因和详情
- 支持异步和同步的错误处理

#### 异常处理示例

```python
from af_agent.tools.sandbox_tools.toolkit import ExecuteCodeTool
from af_agent.errors import SandboxError

execute_tool = ExecuteCodeTool(session_id="error_test")

# 处理语法错误
try:
    result = await execute_tool.ainvoke({
        "content": "print('Hello World')\ninvalid syntax here\nx = 10",
        "filename": "syntax_error.py"
    })
except SandboxError as e:
    print(f"捕获到沙箱错误: {e}")
    # 错误信息会包含 stderr 和 return_code 的详细信息

# 处理命令错误
from af_agent.tools.sandbox_tools.toolkit import ExecuteCommandTool

command_tool = ExecuteCommandTool(session_id="error_test")
try:
    result = await command_tool.ainvoke({
        "command": "nonexistent_command",
        "args": []
    })
except SandboxError as e:
    print(f"捕获到命令错误: {e}")
    # 错误信息会包含命令执行失败的原因
```

### 缓存支持
- `CreateFileTool` 和 `ReadFileTool` 支持结果缓存
- 可以通过 `result_cache_key` 参数使用缓存功能

### 资源管理
- `CloseSandboxTool` 会自动清理沙箱资源
- 所有工具都支持自动资源清理

### API 支持
- 所有工具都继承自 `BaseSandboxTool`，自动获得 `as_async_api_cls` 和 `get_api_schema` 方法
- 支持通过 API 路由进行调用
- 提供完整的 API Schema 文档

## 注意事项

1. **沙箱环境限制**: 沙箱环境是受限环境，没有网络连接，不能使用 pip 安装第三方库
2. **预装库**: 支持 pandas、numpy 等常用数据分析库
3. **文件操作**: 所有文件操作都在沙箱环境中进行，不会影响本地文件系统
4. **会话共享**: 使用相同的 `session_id` 可以在多个工具间共享沙箱环境
5. **资源清理**: 建议在使用完毕后调用 `CloseSandboxTool` 清理资源
6. **API 调用**: 所有工具都支持 API 调用，可以通过 `as_async_api_cls` 方法进行异步调用

## 与原始工具的区别

相比原始的 `shared_all_in_one.py`：

1. **模块化**: 每个功能都是独立的工具类
2. **灵活性**: 可以单独使用某个功能，不需要加载整个工具集
3. **可维护性**: 每个工具都有清晰的职责和接口
4. **可扩展性**: 可以轻松添加新的工具或修改现有工具
5. **代码复用**: 共享的基础功能在 `BaseSandboxTool` 中实现
6. **API 支持**: 每个工具都支持 API 调用和 Schema 生成

## 迁移指南

如果你之前使用的是 `shared_all_in_one.py`，可以按以下方式迁移：

```python
# 原来的方式
from af_agent.tools.sandbox_tools.shared_all_in_one import SandboxTool

tool = SandboxTool(session_id="my_session")
result = await tool.ainvoke({
    "action": "execute_code",
    "content": "print('Hello')"
})

# 新的方式
from af_agent.tools.sandbox_tools.toolkit import ExecuteCodeTool

tool = ExecuteCodeTool(session_id="my_session")
result = await tool.ainvoke({
    "content": "print('Hello')"
})

# 或者使用 API 方式
result = await ExecuteCodeTool.as_async_api_cls(params={
    "session_id": "my_session",
    "content": "print('Hello')"
})
```

## 测试

运行测试文件来验证 API 方法：

```bash
python src/af_agent/tools/sandbox_tools/toolkit/test_api_methods.py
```

这将测试所有工具的 `as_async_api_cls` 和 `get_api_schema` 方法是否正常工作。 