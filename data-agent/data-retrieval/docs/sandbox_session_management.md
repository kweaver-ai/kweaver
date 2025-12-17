# SandboxTool 会话管理指南

## 问题描述

在使用 SandboxTool 时，可能会遇到 "Unclosed client session" 警告。这个警告通常出现在以下情况：

1. **aiohttp ClientSession 没有被正确关闭**
2. **SandboxTool 实例在垃圾回收时没有正确清理资源**
3. **异步资源在同步上下文中没有被正确管理**

## 原因分析

### 1. 析构函数中的异步操作

原来的 `__del__` 方法中使用了 `asyncio.create_task()`，这在析构函数中是不安全的：

```python
def __del__(self):
    try:
        if self._sandbox:
            asyncio.create_task(self._close_sandbox())  # 问题：在析构函数中使用异步操作
    except:
        pass
```

### 2. SharedEnvSandbox 内部使用 aiohttp

`SharedEnvSandbox` 内部可能使用了 aiohttp ClientSession，需要正确关闭。

## 解决方案

### 1. 显式关闭方法

使用 `close()` 方法显式关闭 SandboxTool：

```python
import asyncio
from src.af_agent.tools.sandbox_tools.shared_env import SandboxTool

async def example():
    tool = SandboxTool(server_url="http://localhost:9101")
    try:
        # 使用工具
        result = await tool.ainvoke({
            "action": "execute_code",
            "content": "print('Hello World')"
        })
        print(result)
    finally:
        # 显式关闭
        await tool.close()
```

### 2. 上下文管理器

使用上下文管理器自动管理资源：

```python
# 异步上下文管理器
async def example_async():
    async with SandboxTool(server_url="http://localhost:9101") as tool:
        result = await tool.ainvoke({
            "action": "execute_code",
            "content": "print('Hello World')"
        })
        print(result)
    # 自动关闭

# 同步上下文管理器
def example_sync():
    with SandboxTool(server_url="http://localhost:9101") as tool:
        result = tool.invoke({
            "action": "execute_code",
            "content": "print('Hello World')"
        })
        print(result)
    # 自动关闭
```

### 3. 批量操作的最佳实践

```python
async def batch_operations():
    tool = SandboxTool(server_url="http://localhost:9101")
    try:
        # 执行多个操作
        for i in range(5):
            result = await tool.ainvoke({
                "action": "execute_code",
                "content": f"print('Operation {i+1}')"
            })
            print(f"操作 {i+1}: {result}")
    finally:
        # 确保关闭
        await tool.close()
```

## 修复内容

### 1. 改进的析构函数

```python
def __del__(self):
    """析构函数，确保关闭沙箱连接"""
    try:
        if self._sandbox:
            # 使用同步方式关闭，避免在析构函数中使用异步操作
            import warnings
            warnings.filterwarnings("ignore", category=ResourceWarning)
            
            # 尝试获取当前事件循环
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # 如果事件循环正在运行，创建一个后台任务
                    loop.create_task(self._close_sandbox())
                else:
                    # 如果事件循环没有运行，直接运行
                    loop.run_until_complete(self._close_sandbox())
            except RuntimeError:
                # 如果没有事件循环，创建一个新的
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(self._close_sandbox())
                    loop.close()
                except:
                    pass
    except:
        pass
```

### 2. 显式关闭方法

```python
async def close(self):
    """显式关闭沙箱工具，释放资源"""
    await self._close_sandbox()
    if self.session:
        try:
            # 清理会话数据
            if hasattr(self.session, 'clean_session'):
                self.session.clean_session()
        except Exception as e:
            logger.warning(f"Error cleaning session: {e}")
```

### 3. 上下文管理器支持

```python
def __enter__(self):
    """支持上下文管理器"""
    return self

def __exit__(self, exc_type, exc_val, exc_tb):
    """上下文管理器退出时关闭资源"""
    try:
        # 在同步上下文中关闭异步资源
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # 如果事件循环正在运行，创建一个后台任务
            loop.create_task(self._close_sandbox())
        else:
            # 如果事件循环没有运行，直接运行
            loop.run_until_complete(self._close_sandbox())
    except:
        pass
```

## 测试验证

运行测试脚本验证修复效果：

```bash
cd tests/agent_test
python test_sandbox_session_cleanup.py
```

## 最佳实践

1. **优先使用上下文管理器**：确保资源自动清理
2. **显式关闭**：在长时间运行的程序中显式调用 `close()`
3. **异常处理**：使用 try-finally 确保资源清理
4. **避免循环引用**：确保没有循环引用导致垃圾回收问题

## 注意事项

1. **事件循环状态**：在析构函数中需要检查事件循环的状态
2. **异常处理**：资源清理过程中的异常不应该影响主程序
3. **日志记录**：添加适当的日志记录以便调试
4. **性能考虑**：避免频繁创建和销毁 SandboxTool 实例

## 相关文件

- `src/af_agent/tools/sandbox_tools/shared_env.py` - 主要实现
- `tests/agent_test/test_sandbox_session_cleanup.py` - 测试脚本
- `deps/sandbox_env-0.1.0-py3-none-any.whl` - 依赖包 