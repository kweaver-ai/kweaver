# 公共模块单元测试

本目录包含对 `app/common` 模块的单元测试，特别是针对工具模块的全面测试覆盖。

## 目录结构

```
test/common_test/
├── __init__.py
├── README.md
├── mock_dependencies.py          # 模拟依赖项
└── tool_test/                    # 工具模块测试
    ├── __init__.py
    ├── test_api_tool.py          # APITool 单元测试
    ├── test_agent_tool.py        # AgentTool 单元测试
    ├── test_mcp_tool.py          # MCPTool 单元测试
    ├── test_email_sender_stream_test.py  # EmailSenderStreamTest 单元测试
    ├── test_tool_map_info.py     # ToolMapInfo 单元测试
    └── test_all_tools.py         # 完整测试套件
```

## 测试覆盖范围

### 1. APITool 测试 (`test_api_tool.py`)
- **APIToolResponse 类**
  - 默认初始化
  - 带参数初始化
  - 字典转换功能
  
- **ToolMapInfo 类**
  - 基本和完整初始化
  - `is_enabled()` 方法
  - `get_map_value()` 方法
  - `get_map_type()` 方法
  
- **APITool 类**
  - 工具初始化（各种配置情况）
  - 描述解析
  - 输入参数解析（基本参数、请求体参数）
  - $ref 引用解析（递归、循环引用）
  - 输入参数过滤
  - 输出参数解析
  - 异步流式执行（成功、错误、工具中断）
  - 参数处理和映射

### 2. AgentTool 测试 (`test_agent_tool.py`)
- **parse_kwargs 函数**
  - 各种参数组合情况
  
- **AgentTool 类**
  - Agent 初始化
  - 输入参数解析（auto类型过滤）
  - 异步流式执行（成功、错误、工具中断）
  - 参数映射（固定值、变量引用）
  - 输出处理（基本、错误、指定变量）
  - 变量类型识别（explore、LLM、常规）
  - 工具中断处理
  - JSON 解析

### 3. MCPTool 测试 (`test_mcp_tool.py`)
- **parse_kwargs 函数**
  - 参数解析功能
  
- **MCPTool 类**
  - MCP 工具初始化
  - 输入 schema 解析（基本、默认值）
  - $ref 引用解析（基本、嵌套、循环、缺失）
  - 异步流式执行（成功、错误状态、JSON解析错误）
  - 请求头和请求体处理
  - URL 生成
  - 复杂 schema 解析

### 4. EmailSenderStreamTest 测试 (`test_email_sender_stream_test.py`)
- **EmailSenderStreamTest 类**
  - 基本初始化和配置
  - 邮件发送功能（成功、各种错误）
  - 邮件地址验证
  - 进度流式输出
  - 配置验证
  - 参数验证
  - 输入 schema 定义

### 5. ToolMapInfo 测试 (`test_tool_map_info.py`)
- **ToolMapInfo 数据模型**
  - 初始化（必需字段、所有字段、无效数据）
  - 方法功能（`is_enabled()`, `get_map_value()`, `get_map_type()`）
  - 子元素处理（空、单个、多个、嵌套）
  - 不同类型支持
  - 序列化和反序列化
  - 相等性比较和复制
  - 边界情况验证

## 使用方法

### 运行所有测试
```bash
# 使用 pytest 运行所有测试
cd /Users/Zhuanz/Work/as/dip_ws/agent-executor
python -m pytest test/common_test/ -v

# 或者直接运行测试套件
python test/common_test/tool_test/test_all_tools.py
```

### 运行特定工具的测试
```bash
# 运行 API 工具测试
python test/common_test/tool_test/test_all_tools.py --tool api

# 运行 Agent 工具测试  
python test/common_test/tool_test/test_all_tools.py --tool agent

# 运行 MCP 工具测试
python test/common_test/tool_test/test_all_tools.py --tool mcp

# 运行邮件工具测试
python test/common_test/tool_test/test_all_tools.py --tool email

# 运行 ToolMapInfo 测试
python test/common_test/tool_test/test_all_tools.py --tool toolmap
```

### 运行单个测试文件
```bash
# 运行单个测试文件
python -m pytest test/common_test/tool_test/test_api_tool.py -v

# 运行特定测试类
python -m pytest test/common_test/tool_test/test_api_tool.py::TestAPITool -v

# 运行特定测试方法
python -m pytest test/common_test/tool_test/test_api_tool.py::TestAPITool::test_init_basic -v
```

### 覆盖率分析
```bash
# 运行覆盖率分析
python test/common_test/tool_test/test_all_tools.py --coverage

# 或使用 pytest-cov
python -m pytest test/common_test/ --cov=app.common.tool --cov-report=html
```

### 详细输出和快速失败
```bash
# 详细输出
python test/common_test/tool_test/test_all_tools.py --verbose

# 遇到第一个失败就停止
python test/common_test/tool_test/test_all_tools.py --failfast

# 组合使用
python test/common_test/tool_test/test_all_tools.py --verbose --failfast
```

## 模拟依赖

`mock_dependencies.py` 文件包含了对外部依赖的模拟，包括：

- **DolphinLanguageSDK**: 模拟 Tool 基类和相关工具
- **ToolInterrupt**: 模拟工具中断异常
- **Context**: 模拟上下文和全局变量池
- **StandLogger**: 模拟日志记录器

这些模拟确保测试可以在没有实际依赖的情况下运行。

## 测试特点

1. **全面覆盖**: 测试涵盖了所有主要功能、边界情况和错误处理
2. **隔离测试**: 使用 mock 对象隔离外部依赖
3. **异步支持**: 包含对异步方法的完整测试
4. **参数化测试**: 使用多种输入组合验证功能
5. **错误处理**: 专门测试各种错误情况和异常处理
6. **集成测试**: 包含工具间集成和继承关系测试

## 注意事项

1. 确保在运行测试前安装必要的依赖：
   ```bash
   pip install pytest aioresponses pydantic
   ```

2. 某些测试可能需要网络模拟，确保 `aioresponses` 正常工作

3. 如果要添加新的测试，请遵循现有的命名和结构约定

4. 运行测试时建议使用虚拟环境以避免依赖冲突