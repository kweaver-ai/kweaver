# 模板API测试套件

## 概述

这是一个完整的模板API测试套件，使用 `agent-go-common-pkg/tool/apitesttool` 工具进行API测试。测试覆盖了模板的CRUD操作、发布管理、复制功能等所有功能。

## 目录结构

```
api_test/tpl/
├── README.md                           # 本文档
├── complete_test_suite.yaml            # 完整测试套件配置
├── advanced_features_test.yaml         # 高级功能测试配置
├── run_tests.go                        # Go测试运行器
├── go.mod                              # Go模块文件
├── Makefile                            # 构建和测试命令
├── create/
│   └── test_config.yaml                # 创建模板测试配置
├── list/
│   └── test_config.yaml                # 模板列表测试配置
├── detail/
│   └── test_config.yaml                # 模板详情测试配置
├── update/
│   └── test_config.yaml                # 更新模板测试配置
├── delete/
│   └── test_config.yaml                # 删除模板测试配置
├── publish/
│   └── test_config.yaml                # 发布管理测试配置
├── copy/
│   └── test_config.yaml                # 复制模板测试配置
├── publish_info/
│   └── test_config.yaml                # 发布信息测试配置
├── reports/                            # 测试报告目录
└── docs/                               # 文档目录
    ├── API_COVERAGE.md                 # API覆盖范围文档
    └── MAKEFILE_USAGE.md               # Makefile使用说明
```

## 测试覆盖范围

### 1. 核心CRUD操作
- **创建模板** (`POST /api/agent-factory/internal/v3/agent-tpl`)
  - 基本信息创建
  - 包含复杂配置的创建
  - 缺少必需字段的错误处理

- **获取模板列表** (`GET /api/agent-factory/internal/v3/agent-tpl`)
  - 默认分页
  - 指定分页参数
  - 大分页参数测试
  - 响应字段结构验证
  - 无效分页参数错误处理

- **获取模板详情** (`GET /api/agent-factory/internal/v3/agent-tpl/{id}`)
  - 有效ID查询
  - 无效ID错误处理
  - 空ID错误处理

- **按Key获取详情** (`GET /api/agent-factory/internal/v3/agent-tpl/by-key/{key}`)
  - 有效Key查询
  - 无效Key错误处理

- **更新模板** (`PUT /api/agent-factory/internal/v3/agent-tpl/{id}`)
  - 基本信息更新
  - 配置更新
  - 无效ID错误处理
  - 空请求体错误处理

- **删除模板** (`DELETE /api/agent-factory/internal/v3/agent-tpl/{id}`)
  - 有效ID删除
  - 无效ID错误处理
  - 空ID错误处理

### 2. 发布管理功能
- **发布模板** (`POST /api/agent-factory/internal/v3/agent-tpl/{id}/publish`)
  - 正常发布流程
  - 重复发布处理
  - 无效ID错误处理

- **取消发布** (`POST /api/agent-factory/internal/v3/agent-tpl/{id}/unpublish`)
  - 正常取消发布流程
  - 未发布状态处理
  - 无效ID错误处理

- **获取发布信息** (`GET /api/agent-factory/internal/v3/agent-tpl/{id}/publish-info`)
  - 获取分类列表
  - 无效ID错误处理

- **更新发布信息** (`POST /api/agent-factory/internal/v3/agent-tpl/{id}/publish-info`)
  - 更新分类信息
  - 无效分类ID处理
  - 无效模板ID处理

### 3. 扩展功能
- **复制模板** (`POST /api/agent-factory/internal/v3/agent-tpl/{id}/copy`)
  - 正常复制流程
  - 复制后验证
  - 无效ID错误处理

## 运行测试

### 使用完整测试套件
```bash
# 在 agent-go-common-pkg/tool/apitesttool 目录下运行
go run . -config /path/to/api_test/tpl/complete_test_suite.yaml
```

### 运行单个模块测试
```bash
# 测试创建功能
go run . -config /path/to/api_test/tpl/create/test_config.yaml

# 测试列表功能
go run . -config /path/to/api_test/tpl/list/test_config.yaml

# 测试发布功能
go run . -config /path/to/api_test/tpl/publish/test_config.yaml
```

### 使用Go测试运行器
```bash
cd api_test/tpl
go run run_tests.go
```

### 使用Makefile
```bash
# 执行所有测试
make test-all

# 执行特定功能测试
make test-create
make test-publish
make test-copy

# 生成HTML报告
make report-all
make report-complete

# 服务管理
make start-service
make stop-service
make health-check
```

## 测试结果

最新测试结果：**预期100%通过率**
- 总测试数：预计25+个
- 通过测试：预计25+个
- 失败测试：0个

详细测试报告请查看 `reports/` 目录下的HTML文件

## 配置说明

所有测试配置文件使用YAML格式，包含以下主要字段：
- `name`: 测试套件名称
- `description`: 测试套件描述
- `variables`: 全局变量定义
- `variable_config`: 动态变量配置
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
  - `variable_extraction`: 变量提取（可选）
  - `timeout`: 超时时间
  - `retry`: 重试次数

## 高级功能

### 1. 动态变量支持
- `${uuid}` - 生成UUID
- `${timestamp}` - 生成时间戳（秒）
- `${timestamp_ms}` - 生成毫秒时间戳
- `${random_number:min-max}` - 生成指定范围的随机数
- `${random_string:length}` - 生成指定长度的随机字符串
- `${random_name:length}` - 生成随机姓名

### 2. 变量提取功能
- 从API响应中提取变量供后续测试使用
- 支持JSONPath、正则表达式、响应头提取
- 支持链式测试

### 3. 复杂断言
- `exists` - 字段存在性检查
- `contains` - 字符串包含检查
- `equals` - 精确匹配检查
- `greater_than` - 数值比较检查

## 注意事项

1. 测试前确保agent-factory服务已启动并运行在 `http://127.0.0.1:13021`
2. 某些测试用例使用了硬编码的模板ID，实际运行时可能需要调整
3. 测试用例包含了详细的断言，确保API响应的正确性
4. 所有配置文件使用YAML格式，便于阅读和维护
5. 发布信息测试需要数据库中存在分类数据

## 依赖服务

- **agent-factory服务**: 端口13021
- **MySQL数据库**: 端口3306，包含分类数据
- **apitesttool**: API测试工具

## 故障排除

### 常见问题
1. **服务未启动**: 使用 `make start-service` 启动服务
2. **端口冲突**: 检查13021端口是否被占用
3. **数据库连接**: 确保MySQL服务正常运行
4. **分类数据缺失**: 运行分类数据初始化脚本

### 调试技巧
1. 使用 `make health-check` 检查服务状态
2. 查看详细的HTML测试报告
3. 检查服务日志输出
4. 使用单个测试配置进行调试 