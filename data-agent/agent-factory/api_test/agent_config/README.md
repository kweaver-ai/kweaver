# Agent配置API测试

## 概述

这个目录包含了Agent配置相关API的测试套件，目前包含以下测试模块：

- **copy_agent** - Agent复制接口测试
- **copy2tpl** - Agent复制为模板接口测试

## 使用方法

### 快速开始

```bash
# 显示帮助信息
make help

# 执行所有测试
make test-all

# 检查所有测试通过率
make testAllIsPass
```

### 服务管理

```bash
# 启动agent-factory服务
make start-service

# 检查服务健康状态
make health-check

# 停止服务
make stop-service
```

### 单独测试

```bash
# 执行Agent复制接口测试
make test-copy-agent

# 执行Agent复制为模板接口测试
make test-copy2tpl
```

### 报告生成

```bash
# 生成所有测试的HTML报告
make report-all

# 生成Agent复制接口测试报告
make report-copy-agent

# 生成Agent复制为模板接口测试报告
make report-copy2tpl

# 列出所有生成的报告
make list-reports
```

### 报告服务器

```bash
# 启动报告静态服务器（端口8342）
make start-report-server

# 停止报告静态服务器
make stop-report-server

# 在浏览器中查看报告首页
make view-reports
```

### 使用Go程序执行测试

```bash
# 使用Go程序执行所有测试（推荐）
make run-tests

# 或者直接运行
go run run_tests.go
```

### 清理

```bash
# 清理生成的HTML报告文件
make clean
```

## 测试模块说明

### copy_agent - Agent复制接口测试

测试接口：
- `POST /api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy` - 复制Agent

测试覆盖：
- ✅ 前置查询：通过个人空间Agent列表或已发布智能体列表获取可复制的Agent
- ✅ 基础复制功能（提供名称和不提供名称）
- ✅ 版本支持（未发布版本和已发布版本）
- ✅ 错误处理（Agent不存在、参数校验、权限验证）
- ✅ 边界条件（长名称、缺少参数等）

### copy2tpl - Agent复制为模板接口测试

测试接口：
- `POST /api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy2tpl` - 复制Agent为模板

测试覆盖：
- ✅ 前置查询：通过个人空间Agent列表或已发布智能体列表获取可复制的Agent
- ✅ 基础复制为模板功能（提供名称和不提供名称）
- ✅ 版本支持（未发布版本和已发布版本）
- ✅ 错误处理（Agent不存在、参数校验、权限验证）
- ✅ 边界条件（长名称、缺少参数等）

## 目录结构

```
api_test/agent_config/
├── Makefile              # 测试管理脚本
├── run_tests.go          # Go测试执行程序
├── README.md             # 说明文档
├── TESTING_GUIDE.md      # 测试指南
├── index.html            # 报告首页
├── copy_agent/           # Agent复制接口测试
│   ├── test_config.yaml  # 测试配置文件
│   └── copy_agent_report.html  # 测试报告（生成后）
└── copy2tpl/             # Agent复制为模板接口测试
    ├── test_config.yaml  # 测试配置文件
    └── copy2tpl_report.html     # 测试报告（生成后）
```

## 配置说明

### 环境变量

- `TOOL_PATH`: API测试工具路径（默认：`/Users/Zhuanz/Work/as/dip_ws/agent-go-common-pkg/tool/apitesttool`）
- `SERVICE_URL`: 服务地址（默认：`http://127.0.0.1:13020`）
- `REPORT_SERVER_PORT`: 报告服务器端口（默认：`8342`）
- `REPORT_SERVER_URL`: 报告服务器地址（默认：`http://localhost:8342`）

### 静态服务器功能

为了更好地查看HTML测试报告，我们集成了Python静态服务器：

#### 特性
- 🌐 **本地HTTP服务器**：使用`python3 -m http.server`在端口8342提供服务
- 🔗 **localhost链接**：所有报告都通过localhost链接访问，避免文件路径问题
- 📊 **报告首页**：提供统一的报告入口页面（`http://localhost:8342`）
- 🔄 **自动启动**：生成报告时自动启动服务器
- 📱 **响应式设计**：报告首页支持移动设备访问

#### 使用流程
1. **生成报告**：`make report-all` - 自动启动服务器并生成报告
2. **查看报告**：`make view-reports` - 在浏览器中打开报告首页
3. **管理服务器**：`make start-report-server` / `make stop-report-server`

### 测试配置

每个测试模块都有自己的`test_config.yaml`配置文件，包含：
- 测试名称和描述
- 变量定义
- 测试用例列表
- 断言规则

## 注意事项

1. **服务依赖**：测试前需要确保agent-factory服务正在运行
2. **权限要求**：某些测试需要用户登录状态
3. **数据准备**：部分测试可能需要预先创建测试数据
4. **并发安全**：避免同时运行多个测试实例

## 故障排除

### 常见问题

1. **服务未启动**
   ```bash
   make health-check  # 检查服务状态
   make start-service # 启动服务
   ```

2. **测试失败**
   ```bash
   make report-all    # 生成详细报告
   make list-reports  # 查看报告文件
   ```

3. **权限问题**
   - 检查X-User-ID头部是否正确设置
   - 确认用户有相应的操作权限

### 调试技巧

- 使用`make run-tests`获得更详细的测试输出
- 查看生成的HTML报告了解失败原因
- 检查服务日志排查问题

## 扩展测试

要添加新的测试模块：

1. 在当前目录下创建新的测试目录
2. 添加`test_config.yaml`配置文件
3. 更新`Makefile`中的测试目标
4. 更新`run_tests.go`中的测试目录列表

## 相关文档

- [API测试工具文档](../../tool/apitesttool/README.md)
- [Agent复制接口文档](../../docs/agent_copy_interfaces_implementation.md)
- [个人空间API测试](../personal_space/README.md)
