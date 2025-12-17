# 空间API测试套件

## 概述

这是一个完整的空间API测试套件，使用 `agent-go-common-pkg/tool/apitesttool` 工具进行API测试。测试覆盖了空间的CRUD操作、成员管理、资源管理等所有功能。

## 目录结构

```
api_test/custom_space/
├── README.md                           # 本文档
├── complete_test_suite.yaml            # 完整测试套件配置
├── final_test_report.html              # 最终测试报告
├── run_tests.go                        # Go测试运行器
├── go.mod                              # Go模块文件
├── go.sum                              # Go依赖校验文件
├── create/
│   └── test_config.yaml                # 创建空间测试配置
├── list/
│   └── test_config.yaml                # 空间列表测试配置
├── detail/
│   └── test_config.yaml                # 空间详情测试配置
├── update/
│   └── test_config.yaml                # 更新空间测试配置
├── delete/
│   └── test_config.yaml                # 删除空间测试配置
├── members/
│   └── test_config.yaml                # 空间成员测试配置
└── resources/
    └── test_config.yaml                # 空间资源测试配置
```

## 测试覆盖范围

### 1. 核心CRUD操作
- **创建空间** (`POST /api/agent-factory/v3/space`)
  - 基本信息创建
  - 包含成员和资源的创建
  - 缺少必需字段的错误处理

- **获取空间列表** (`GET /api/agent-factory/v3/space`)
  - 默认分页
  - 指定分页参数
  - 大分页参数测试
  - 响应字段结构验证
  - 无效分页参数错误处理

- **获取空间详情** (`GET /api/agent-factory/v3/space/{id}`)
  - 有效ID查询
  - 无效ID错误处理
  - 空ID错误处理

- **更新空间** (`PUT /api/agent-factory/v3/space/{id}`)
  - 基本信息更新
  - 无效ID错误处理
  - 空请求体错误处理

- **删除空间** (`DELETE /api/agent-factory/v3/space/{id}`)
  - 有效ID删除
  - 无效ID错误处理
  - 空ID错误处理

### 2. 扩展功能
- **空间成员管理** (`GET /api/agent-factory/v3/space/{id}/members`)
  - 获取成员列表
  - 分页参数测试
  - 无效空间ID错误处理

- **空间资源管理** (`GET /api/agent-factory/v3/space/{id}/resources`)
  - 获取资源列表
  - 分页参数测试
  - 无效空间ID错误处理

## 运行测试

### 使用完整测试套件
```bash
# 在 agent-go-common-pkg/tool/apitesttool 目录下运行
go run . -config /path/to/api_test/custom_space/complete_test_suite.yaml
```

### 运行单个模块测试
```bash
# 测试创建功能
go run . -config /path/to/api_test/custom_space/create/test_config.yaml

# 测试列表功能
go run . -config /path/to/api_test/custom_space/list/test_config.yaml

# 测试详情功能
go run . -config /path/to/api_test/custom_space/detail/test_config.yaml
```

### 使用Go测试运行器
```bash
cd api_test/custom_space
go run run_tests.go
```

## 测试结果

最新测试结果：**100%通过率**
- 总测试数：10
- 通过测试：10
- 失败测试：0

详细测试报告请查看 `final_test_report.html`

## 配置说明

所有测试配置文件使用YAML格式，包含以下主要字段：
- `name`: 测试套件名称
- `description`: 测试套件描述
- `tests`: 测试用例数组
  - `name`: 测试用例名称
  - `description`: 测试用例描述
  - `request`: 请求配置
    - `method`: HTTP方法
    - `url`: 请求URL
    - `headers`: 请求头
    - `body`: 请求体（可选）
    - `params`: 查询参数（可选）
  - `expected`: 期望结果
    - `status_code`: 期望状态码
    - `assertions`: 断言数组
  - `variables`: 变量定义（可选）
  - `timeout`: 超时时间
  - `retry`: 重试次数

## 注意事项

1. 测试前确保agent-factory服务已启动并运行在 `http://127.0.0.1:13020`
2. 某些测试用例使用了硬编码的空间ID，实际运行时可能需要调整
3. 测试用例包含了详细的断言，确保API响应的正确性
4. 所有配置文件使用YAML格式，便于阅读和维护 