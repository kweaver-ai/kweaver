# SQL Helper 工具使用文档

## 概述

SQL Helper 是一个专门用于调用 SQL 语句的工具，支持获取元数据信息和执行 SQL 语句。与 text2sql 工具不同，此工具不生成 SQL 语句，只执行已提供的 SQL 语句。

## 功能特性

- **获取元数据信息**: 获取数据源的元数据信息，包括表结构、字段信息等
- **执行 SQL 语句**: 执行指定的 SQL 语句并返回结果
- **数据限制**: 支持限制返回数据的条数和总量
- **错误处理**: 完善的错误处理机制
- **会话管理**: 支持会话管理和日志记录

## 命令类型

### 1. 获取元数据信息 (get_metadata)

获取数据源的元数据信息，包括：
- 表/视图的 ID
- 表/视图的名称
- 表/视图的描述
- 表/视图的类型

### 2. 执行 SQL 语句 (execute_sql)

执行指定的 SQL 语句并返回结果，包括：
- 执行结果数据
- 数据描述信息（返回记录数、实际记录数）
- 执行状态消息
- 数据标题（可选参数）

## 使用示例

### 基本使用

```python
from af_agent.tools.base_tools.sql_helper import SQLHelperTool
from af_agent.datasource.vega_datasource import VegaDataSource
from af_agent.api.auth import get_authorization

# 创建数据源
token = get_authorization("https://your-server.com", "username", "password")
datasource = VegaDataSource(
    view_list=["view_id_1", "view_id_2"],
    token=token,
    user_id="your_user_id"
)

# 创建工具实例
tool = SQLHelperTool.from_data_source(
    data_source=datasource,
    llm=your_llm_instance,
    prompt_manager=your_prompt_manager
)

# 获取元数据信息
metadata_result = tool.invoke({"command": "get_metadata"})
print(metadata_result)

# 执行 SQL 语句
sql_result = tool.invoke({
    "command": "execute_sql", 
    "sql": "SELECT * FROM your_table LIMIT 10"
})
print(sql_result)

# 执行 SQL 语句（带数据标题）
sql_result_with_title = tool.invoke({
    "command": "execute_sql", 
    "sql": "SELECT * FROM your_table LIMIT 10",
    "data_title": "用户查询结果"
})
print(sql_result_with_title)
```

### API 调用示例

```python
import asyncio
from af_agent.tools.base_tools.sql_helper import SQLHelperTool

async def call_sql_helper_api():
    params = {
        'data_source': {
            'view_list': ['your_view_id'],
            'base_url': 'https://your-server.com',
            'user': 'username',
            'password': 'password',
            'vega_type': 'dip'
        },
        'llm': {
            'model_name': 'your_model',
            'openai_api_key': 'your_key',
            'openai_api_base': 'your_base_url'
        },
        'config': {
            'return_record_limit': 10,
            'return_data_limit': 1000
        },
        'command': 'execute_sql',
        'sql': 'SELECT * FROM your_table LIMIT 10',
        'data_title': '用户查询结果'
    }
    
    result = await SQLHelperTool.as_async_api_cls(params)
    return result

# 运行
result = asyncio.run(call_sql_helper_api())
print(result)
```

## 配置参数

### 工具配置

- `return_record_limit`: 返回数据条数限制，默认 10
- `return_data_limit`: 返回数据总量限制，默认 1000
- `get_desc_from_datasource`: 是否从数据源获取描述，默认 False
- `session_type`: 会话类型，可选 "in_memory" 或 "redis"，默认 "redis"
- `session_id`: 会话 ID

### 数据源配置

- `view_list`: 逻辑视图 ID 列表
- `base_url`: 认证服务 URL
- `user`: 用户名
- `password`: 密码
- `token`: 认证令牌
- `user_id`: 用户 ID
- `vega_type`: Vega 类型，可选 "af" 或 "dip"

## 返回结果格式

### 获取元数据信息返回格式

```json
{
    "command": "get_metadata",
    "metadata": [
        {
            "id": "view_id_1",
            "name": "视图名称",
            "description": "视图描述",
            "type": "data_view"
        }
    ],
    "message": "成功获取元数据信息"
}
```

### 执行 SQL 语句返回格式

```json
{
    "command": "execute_sql",
    "sql": "SELECT * FROM table LIMIT 10",
    "data_title": "用户查询结果",
    "data": [
        {
            "column1": "value1",
            "column2": "value2"
        }
    ],
    "data_desc": {
        "return_records_num": 1,
        "real_records_num": 1
    },
    "message": "SQL 执行成功"
}
```

## 错误处理

工具会处理以下类型的错误：

1. **数据源为空**: 当没有设置数据源时抛出异常
2. **SQL 语句为空**: 当提供的 SQL 语句为空或只包含空白字符时抛出异常
3. **SQL 执行错误**: 当 SQL 执行失败时抛出异常
4. **不支持的命令类型**: 当命令类型不在支持范围内时抛出异常

## 注意事项

1. **不生成 SQL**: 此工具不生成 SQL 语句，只执行已提供的 SQL 语句
2. **数据限制**: 工具会自动限制返回数据的条数和总量，避免返回过多数据
3. **会话管理**: 工具支持会话管理，可以记录执行日志
4. **异步支持**: 工具支持异步调用，提高性能
5. **错误处理**: 完善的错误处理机制，提供详细的错误信息
6. **数据标题**: 支持可选的 `data_title` 参数，用于为查询结果提供自定义标题

## 与 text2sql 工具的区别

| 特性 | SQL Helper | text2sql |
|------|------------|----------|
| SQL 生成 | ❌ 不生成 | ✅ 生成 |
| SQL 执行 | ✅ 执行 | ✅ 执行 |
| 元数据获取 | ✅ 支持 | ✅ 支持 |
| 自然语言理解 | ❌ 不支持 | ✅ 支持 |
| 使用场景 | 直接 SQL 执行 | 自然语言转 SQL |

## 最佳实践

1. **数据源初始化**: 确保在使用前正确初始化数据源
2. **SQL 验证**: 在执行前验证 SQL 语句的正确性
3. **数据限制**: 合理设置数据限制参数，避免返回过多数据
4. **错误处理**: 正确处理工具可能抛出的异常
5. **会话管理**: 合理使用会话管理功能，记录重要的执行日志
