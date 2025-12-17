# 头像API测试套件

## 概述

这是一个完整的内置头像API测试套件，使用 `agent-go-common-pkg/tool/apitesttool` 工具进行API测试。测试覆盖了头像列表获取、单个头像获取、错误处理等所有功能。

## 目录结构

```
api_test/avatar/
├── README.md                           # 本文档
├── complete_test_suite.yaml            # 完整测试套件配置
├── run_tests.go                        # Go测试运行器
├── go.mod                              # Go模块文件
├── list/
│   └── test_config.yaml                # 头像列表测试配置
├── detail/
│   └── test_config.yaml                # 单个头像获取测试配置
├── error_handling/
│   └── test_config.yaml                # 错误处理测试配置
├── docs/
│   └── api_documentation.md            # API文档
└── reports/
    └── (测试报告文件)
```

## 测试覆盖范围

### 1. 核心功能测试
- **获取头像列表** (`GET /api/agent-factory/v3/agent/avatar/built-in`)
  - 基本列表获取
  - 响应格式验证
  - 头像数量验证
  - 头像信息完整性验证

- **获取单个头像** (`GET /api/agent-factory/v3/agent/avatar/built-in/{avatar_id}`)
  - 有效ID头像获取 (1-20)
  - SVG格式验证
  - Content-Type验证
  - 缓存头验证

### 2. 错误处理测试
- **无效头像ID**
  - 超出范围的ID (如: 99, 0, -1)
  - 非数字ID (如: abc, special-chars)
  - 空ID处理

- **HTTP状态码验证**
  - 200 OK (成功获取)
  - 404 Not Found (头像不存在)
  - 400 Bad Request (无效请求)

### 3. 性能和缓存测试
- **响应时间测试**
  - 头像列表响应时间
  - 单个头像响应时间

- **缓存验证**
  - Cache-Control头设置
  - Last-Modified头设置
  - 缓存有效期验证

## 支持的头像列表

| ID | 描述 | ID | 描述 |
|----|------|----|------|
| 1  | 播放按钮图标 | 11 | 头像图标 |
| 2  | 星形图标 | 12 | 设置图标 |
| 3  | 数据库图标 | 13 | 消息图标 |
| 4  | 问号图标 | 14 | 搜索图标 |
| 5  | 用户图标 | 15 | 心形图标 |
| 6  | 文档图标 | 16 | 闪电图标 |
| 7  | 机器人图标 | 17 | 盾牌图标 |
| 8  | 皇冠图标 | 18 | 钻石图标 |
| 9  | 立方体图标 | 19 | 火箭图标 |
| 10 | 书签图标 | 20 | 礼物图标 |

## 运行测试

### 使用完整测试套件
```bash
# 在 agent-go-common-pkg/tool/apitesttool 目录下运行
go run . -config /path/to/api_test/avatar/complete_test_suite.yaml
```

### 运行单个模块测试
```bash
# 测试头像列表功能
go run . -config /path/to/api_test/avatar/list/test_config.yaml

# 测试单个头像获取功能
go run . -config /path/to/api_test/avatar/detail/test_config.yaml

# 测试错误处理功能
go run . -config /path/to/api_test/avatar/error_handling/test_config.yaml
```

### 使用Go测试运行器
```bash
cd api_test/avatar
go run run_tests.go
```

### 使用curl进行快速测试
```bash
# 获取头像列表
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in"

# 获取指定头像
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/7" -v

# 测试错误处理
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/99"

# 测试边界值
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/20"
curl -X GET "http://localhost:13022/api/agent-factory/v3/agent/avatar/built-in/21"
```

## 配置说明

所有测试配置文件使用YAML格式，包含以下主要字段：
- `name`: 测试套件名称
- `description`: 测试套件描述
- `variables`: 全局变量定义
- `tests`: 测试用例数组
  - `name`: 测试用例名称
  - `description`: 测试用例描述
  - `request`: 请求配置
    - `method`: HTTP方法
    - `url`: 请求URL
    - `headers`: 请求头
  - `expected`: 期望结果
    - `status_code`: 期望状态码
    - `assertions`: 断言数组
  - `timeout`: 超时时间
  - `retry`: 重试次数

## 断言类型

测试支持以下断言类型：
- `exists`: 检查字段是否存在
- `equals`: 检查字段值是否相等
- `contains`: 检查字段值是否包含指定内容
- `regex`: 检查字段值是否匹配正则表达式
- `type`: 检查字段类型
- `length`: 检查数组或字符串长度
- `range`: 检查数值是否在指定范围内

## 注意事项

1. 测试前确保agent-factory服务已启动并运行在 `http://127.0.0.1:13022`
2. 头像文件需要存在于 `static/images/avatar/` 目录中
3. 测试用例包含了详细的断言，确保API响应的正确性
4. SVG文件格式和内容验证确保头像质量
5. 所有配置文件使用YAML格式，便于阅读和维护

## 预期测试结果

- **总测试数**: 约15-20个测试用例
- **预期通过率**: 100%
- **覆盖功能**: 
  - ✅ 头像列表获取
  - ✅ 单个头像获取
  - ✅ 错误处理
  - ✅ 缓存验证
  - ✅ 性能测试 