# SandboxTool API 调用示例

## 概述

本文档提供了 SandboxTool 的详细 API 调用示例，包括各种操作类型的请求和响应格式。

## 基础信息

- **API 端点**: `/tools/sandbox`
- **方法**: POST
- **Content-Type**: application/json

## 调用示例

### 1. 执行 Python 代码

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_code",
    "content": "print(\"Hello World\")\nx = 10\ny = 20\nresult = x + y\nprint(f\"{x} + {y} = {result}\")",
    "filename": "hello.py",
    "output_params": ["result"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "execute_code",
  "result": {
    "output": "Hello World\n10 + 20 = 30",
    "variables": {
      "result": 30
    }
  },
  "message": "代码执行成功"
}
```

### 2. 创建文件

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create_file",
    "content": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 计算前10个斐波那契数\nfor i in range(10):\n    print(f\"F({i}) = {fibonacci(i)}\")",
    "filename": "fibonacci.py",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "create_file",
  "result": {
    "filename": "fibonacci.py",
    "size": 1024
  },
  "message": "文件 fibonacci.py 创建成功"
}
```

### 3. 读取文件

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read_file",
    "filename": "fibonacci.py",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "read_file",
  "result": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# 计算前10个斐波那契数\nfor i in range(10):\n    print(f\"F({i}) = {fibonacci(i)}\")",
  "message": "文件 fibonacci.py 读取成功"
}
```

### 4. 列出文件

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list_files",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "list_files",
  "result": [
    "hello.py",
    "fibonacci.py",
    "config.json"
  ],
  "message": "文件列表获取成功"
}
```

### 5. 执行命令

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_command",
    "command": "ls",
    "args": ["-la"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "execute_command",
  "result": {
    "output": "total 8\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\ndrwxr-xr-x 3 user user 4096 Jan 1 12:00 ..\n-rw-r--r-- 1 user user  1024 Jan 1 12:00 hello.py\n-rw-r--r-- 1 user user  2048 Jan 1 12:00 fibonacci.py",
    "exit_code": 0
  },
  "message": "命令 ls 执行成功"
}
```

### 6. 数据分析示例

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_code",
    "content": "import pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    \"name\": [\"Alice\", \"Bob\", \"Charlie\"],\n    \"age\": [25, 30, 35],\n    \"salary\": [50000, 60000, 70000]\n}\ndf = pd.DataFrame(data)\n\n# 计算统计信息\nstats = {\n    \"mean_age\": df[\"age\"].mean(),\n    \"mean_salary\": df[\"salary\"].mean(),\n    \"total_records\": len(df)\n}\n\nprint(\"数据统计:\")\nfor key, value in stats.items():\n    print(f\"{key}: {value}\")\n\nresult = stats",
    "filename": "data_analysis.py",
    "output_params": ["result", "df"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "execute_code",
  "result": {
    "output": "数据统计:\nmean_age: 30.0\nmean_salary: 60000.0\ntotal_records: 3",
    "variables": {
      "result": {
        "mean_age": 30.0,
        "mean_salary": 60000.0,
        "total_records": 3
      },
      "df": "<DataFrame object>"
    }
  },
  "message": "代码执行成功"
}
```

### 7. 上传文件

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upload_file",
    "file_path": "/path/to/local/file.txt",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "upload_file",
  "result": {
    "filename": "file.txt",
    "size": 1024
  },
  "message": "文件 /path/to/local/file.txt 上传成功"
}
```

### 8. 下载文件

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "download_file",
    "filename": "remote_file.txt",
    "file_path": "/path/to/local/download.txt",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "download_file",
  "result": {
    "local_path": "/path/to/local/download.txt"
  },
  "message": "文件 remote_file.txt 下载到 /path/to/local/download.txt 成功"
}
```

### 9. 获取状态

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_status",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "get_status",
  "result": {
    "status": "running",
    "session_id": "test_session_123",
    "files_count": 5,
    "memory_usage": "128MB"
  },
  "message": "沙箱状态获取成功"
}
```

### 10. 清理工作区

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "close_sandbox",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "close_sandbox",
  "result": {
    "status": "closed",
    "files_cleaned": 5
  },
  "message": "工作区清理成功"
}
```

## 复杂工作流示例

### 完整的数据处理工作流

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_code",
    "content": "import json\nimport os\nimport pandas as pd\nimport numpy as np\n\n# 创建配置文件\nconfig = {\n    \"app_name\": \"Data Processing Demo\",\n    \"version\": \"1.0.0\",\n    \"features\": [\"file_ops\", \"code_exec\", \"data_analysis\"]\n}\n\nwith open(\"config.json\", \"w\") as f:\n    json.dump(config, f, indent=2)\n\n# 创建工具函数\nutils_code = \"\"\"\ndef load_config(filename):\n    with open(filename, \"r\") as f:\n        return json.load(f)\n\ndef save_result(data, filename):\n    with open(filename, \"w\") as f:\n        json.dump(data, f, indent=2)\n\ndef process_data(data):\n    df = pd.DataFrame(data)\n    stats = {\n        \"mean\": df.mean().to_dict(),\n        \"std\": df.std().to_dict(),\n        \"count\": len(df)\n    }\n    return stats\n\"\"\"\n\nwith open(\"utils.py\", \"w\") as f:\n    f.write(utils_code)\n\n# 执行主程序\nfrom utils import load_config, save_result, process_data\n\n# 加载配置\nconfig = load_config(\"config.json\")\nprint(f\"应用名称: {config[\"app_name\"]}\")\nprint(f\"版本: {config[\"version\"]}\")\n\n# 处理数据\nsample_data = {\n    \"x\": np.random.normal(0, 1, 100),\n    \"y\": np.random.normal(0, 1, 100)\n}\n\nstats = process_data(sample_data)\nprint(\"数据统计:\")\nfor key, value in stats.items():\n    print(f\"{key}: {value}\")\n\n# 保存结果\nresult = {\n    \"status\": \"success\",\n    \"config\": config,\n    \"stats\": stats,\n    \"files_created\": [\"config.json\", \"utils.py\"]\n}\nsave_result(result, \"output.json\")\nprint(\"工作流执行完成\")\n\nworkflow_result = result",
    "filename": "workflow.py",
    "output_params": ["workflow_result"],
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "execute_code",
  "result": {
    "output": "应用名称: Data Processing Demo\n版本: 1.0.0\n数据统计:\nmean: {'x': 0.123, 'y': -0.045}\nstd: {'x': 1.023, 'y': 0.987}\ncount: 100\n工作流执行完成",
    "variables": {
      "workflow_result": {
        "status": "success",
        "config": {
          "app_name": "Data Processing Demo",
          "version": "1.0.0",
          "features": ["file_ops", "code_exec", "data_analysis"]
        },
        "stats": {
          "mean": {"x": 0.123, "y": -0.045},
          "std": {"x": 1.023, "y": 0.987},
          "count": 100
        },
        "files_created": ["config.json", "utils.py"]
      }
    }
  },
  "message": "代码执行成功"
}
```

## 错误处理

### 参数错误示例

**请求示例** (缺少必要参数):
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "execute_code"
  }'
```

**响应示例**:
```json
{
  "action": "execute_code",
  "error": "执行代码失败",
  "detail": "content 参数不能为空",
  "message": "沙箱操作失败: execute_code"
}
```

### 文件不存在错误

**请求示例**:
```bash
curl -X POST "http://localhost:9100/tools/sandbox" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "read_file",
    "filename": "nonexistent.py",
    "session_id": "test_session_123"
  }'
```

**响应示例**:
```json
{
  "action": "read_file",
  "error": "读取文件失败",
  "detail": "文件 nonexistent.py 不存在",
  "message": "沙箱操作失败: read_file"
}
```

## Python 客户端示例

### 使用 requests 库

```python
import requests
import json

def call_sandbox_api(action, **kwargs):
    """调用 sandbox API"""
    url = "http://localhost:9100/tools/sandbox"
    
    # 构建请求参数
    params = {
        "action": action,
        "session_id": "test_session_123",
        **kwargs
    }
    
    # 发送请求
    response = requests.post(url, json=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API 调用失败: {response.status_code} - {response.text}")

# 示例调用
try:
    # 执行代码
    result = call_sandbox_api(
        action="execute_code",
        content="print('Hello from API')",
        filename="api_test.py"
    )
    print("执行结果:", result)
    
    # 列出文件
    files = call_sandbox_api(action="list_files")
    print("文件列表:", files)
    
except Exception as e:
    print(f"错误: {e}")
```

### 使用 aiohttp 库 (异步)

```python
import aiohttp
import asyncio
import json

async def call_sandbox_api_async(action, **kwargs):
    """异步调用 sandbox API"""
    url = "http://localhost:9100/tools/sandbox"
    
    # 构建请求参数
    params = {
        "action": action,
        "session_id": "test_session_123",
        **kwargs
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                text = await response.text()
                raise Exception(f"API 调用失败: {response.status} - {text}")

async def main():
    try:
        # 执行代码
        result = await call_sandbox_api_async(
            action="execute_code",
            content="print('Hello from async API')",
            filename="async_test.py"
        )
        print("执行结果:", result)
        
        # 列出文件
        files = await call_sandbox_api_async(action="list_files")
        print("文件列表:", files)
        
    except Exception as e:
        print(f"错误: {e}")

# 运行异步示例
if __name__ == "__main__":
    asyncio.run(main())
```

## 注意事项

1. **会话管理**: 每个请求都应该包含 `session_id` 参数，用于维护沙箱会话状态
2. **参数验证**: 确保根据不同的 `action` 提供相应的必要参数
3. **错误处理**: 始终检查响应中的错误信息
4. **资源清理**: 使用完毕后调用 `close_sandbox` 操作清理资源
5. **文件路径**: 上传和下载文件时使用绝对路径
6. **代码安全**: 在沙箱环境中执行的代码应该是可信的

## 最佳实践

1. **会话复用**: 在同一个工作流程中复用相同的 `session_id`
2. **错误重试**: 对于临时性错误，可以实现重试机制
3. **日志记录**: 记录重要的 API 调用和响应
4. **参数验证**: 在客户端验证参数格式和内容
5. **资源管理**: 及时清理不需要的文件和会话 