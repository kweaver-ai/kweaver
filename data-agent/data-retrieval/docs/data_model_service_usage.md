# DataModelService 使用指南

## 概述

DataModelService 是一个用于获取指标详情和查询指标数据的服务类，参考了 `af_api.py` 的实现模式。

## 功能特性

- 获取指标详情
- 查询指标数据
- 支持同步和异步调用
- 完整的错误处理机制

## API 端点

### 1. 获取指标详情
- **URL**: `http://mdl-data-model-svc:13020/api/data-model/v1/metric-models/{ids}`
- **方法**: GET
- **参数**: 
  - `ids`: 指标ID，多个ID用逗号分隔

### 2. 查询指标数据
- **URL**: `http://mdl-uniquery-svc:13011/api/uniquery/v1/metric-models/{ids}`
- **方法**: POST
- **参数**:
  - `ids`: 指标ID，多个ID用逗号分隔
  - `data`: 查询参数（JSON格式）

## 使用示例

### 基本用法

```python
from src.af_agent.api.data_model import DataModelService

# 创建服务实例
service = DataModelService()

# 设置请求头
headers = {
    "Authorization": "Bearer your_token_here",
    "Content-Type": "application/json"
}

# 获取指标详情
metric_ids = "metric_1,metric_2,metric_3"
try:
    detail_result = service.get_metric_models_detail(metric_ids, headers)
    print("指标详情:", detail_result)
except DataModelDetailError as e:
    print("获取指标详情失败:", e)

# 查询指标数据
query_data = {
    "filters": [],
    "dimensions": ["date", "region"],
    "metrics": ["sales", "profit"],
    "limit": 100
}

try:
    query_result = service.query_metric_models_data(metric_ids, headers, query_data)
    print("指标数据:", query_result)
except DataModelQueryError as e:
    print("查询指标数据失败:", e)
```

### 异步用法

```python
import asyncio
from src.af_agent.api.data_model import DataModelService

async def async_example():
    service = DataModelService()
    headers = {"Authorization": "Bearer your_token_here"}
    
    # 异步获取指标详情
    detail_result = await service.get_metric_models_detail_async("metric_1,metric_2", headers)
    
    # 异步查询指标数据
    query_data = {"filters": [], "limit": 50}
    query_result = await service.query_metric_models_data_async("metric_1,metric_2", headers, query_data)
    
    return detail_result, query_result

# 运行异步示例
result = asyncio.run(async_example())
```

### 错误处理

```python
from src.af_agent.api.error import DataModelDetailError, DataModelQueryError

try:
    result = service.get_metric_models_detail("invalid_id", headers)
except DataModelDetailError as e:
    print(f"错误代码: {e.code}")
    print(f"状态码: {e.status}")
    print(f"错误原因: {e.reason}")
    print(f"请求URL: {e.url}")
    print(f"详细信息: {e.detail}")
```

## 配置说明

服务使用以下配置项（在 `settings.py` 中定义）：

- `DIP_DATA_MODEL_URL`: 数据模型服务地址
- `DIP_MODEL_QUERY_URL`: 模型查询服务地址
- `AF_DEBUG_IP`: 调试IP地址（可选）

## 错误类型

- `DataModelDetailError`: 获取指标详情时发生的错误
- `DataModelQueryError`: 查询指标数据时发生的错误

## 注意事项

1. 确保在调用前正确设置认证头
2. 指标ID支持多个，用逗号分隔
3. 查询数据时需要根据API文档提供正确的参数格式
4. 异步方法需要使用 `await` 关键字调用
