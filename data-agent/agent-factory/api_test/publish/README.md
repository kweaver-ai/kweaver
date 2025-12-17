# Agent发布信息接口测试套件

## 概述

这是Agent发布信息管理接口的完整测试套件，使用 `agent-go-common-pkg/tool/apitesttool` 工具进行API测试。测试覆盖了发布信息的获取、更新、错误处理等所有功能。

## 目录结构

```
api_test/publish/
├── README.md                           # 本文档
├── publish_info_test.yaml              # 发布信息接口基础测试
├── complete_publish_test_suite.yaml    # 完整测试套件配置
└── reports/                            # 测试报告目录（运行后生成）
```

## 测试覆盖范围

### 1. 核心功能测试
- **获取发布信息** (`GET /api/agent-factory/v3/agent/{agent_id}/publish-info`)
  - 基本信息获取
  - 响应格式验证
  - 字段完整性验证
  
- **更新发布信息** (`PUT /api/agent-factory/v3/agent/{agent_id}/publish-info`)
  - 基础信息更新
  - 复杂权限控制更新
  - 分类信息更新
  - 发布目标和类型设置

### 2. 参数验证测试
- **发布目标验证**
  - 有效值：`custom_space`, `square`
  - 无效值错误处理
  - 必需参数检查（custom_space_ids）

- **发布为标识验证**
  - 有效值：`api_agent`, `web_sdk_agent`, `skill_agent`, `agent_tpl`
  - 无效值错误处理

- **权限控制验证**
  - 角色权限设置
  - 用户权限设置
  - 用户组权限设置
  - 部门权限设置

### 3. 错误处理测试
- **404错误**
  - 不存在的Agent ID
  - 空Agent ID

- **400错误**
  - 无效的发布目标
  - 无效的发布为标识
  - 缺少必需参数
  - 无效的请求体格式

### 4. 边界条件测试
- 空描述处理
- 空数组处理
- 大量权限数据处理
- 性能测试

## 接口详细说明

### GET /api/agent-factory/v3/agent/{agent_id}/publish-info

**功能**: 获取指定Agent的发布信息

**路径参数**:
- `agent_id`: Agent的唯一标识符

**响应格式**:
```json
{
  "category_id": "分类ID（逗号分隔）",
  "category_name": "分类名称",
  "description": "发布描述",
  "publish_to_where": ["custom_space", "square"],
  "custom_spaces": [
    {
      "space_id": "空间ID",
      "space_name": "空间名称"
    }
  ],
  "pms_control": {
    "roles": [
      {
        "role_id": "角色ID",
        "role_name": "角色名称"
      }
    ],
    "user": [
      {
        "user_id": "用户ID",
        "username": "用户名称"
      }
    ],
    "user_group": [
      {
        "user_group_id": "用户组ID",
        "user_group_name": "用户组名称"
      }
    ],
    "department": [
      {
        "department_id": "部门ID",
        "department_name": "部门名称"
      }
    ]
  },
  "publish_to_be": ["api_agent", "web_sdk_agent", "skill_agent"]
}
```

### PUT /api/agent-factory/v3/agent/{agent_id}/publish-info

**功能**: 更新指定Agent的发布信息

**路径参数**:
- `agent_id`: Agent的唯一标识符

**请求体格式**:
```json
{
  "category_id": "分类ID（逗号分隔，如：id1,id2,id3）",
  "description": "发布描述",
  "publish_to_where": ["custom_space", "square"],
  "custom_space_ids": ["space1", "space2"],
  "pms_control": {
    "role_ids": ["role1", "role2"],
    "user_ids": ["user1", "user2"],
    "user_group_ids": ["group1", "group2"],
    "department_ids": ["dept1", "dept2"]
  },
  "publish_to_be": ["api_agent", "web_sdk_agent", "skill_agent"]
}
```

**响应**: 204 No Content（成功时）

## 运行测试

### 前置条件
1. 确保agent-factory服务正在运行（默认端口：13020）
2. 安装agent-go-common-pkg/tool/apitesttool工具

### 执行单个测试文件
```bash
# 执行基础发布信息测试
go run /path/to/agent-go-common-pkg/tool/apitesttool/main.go -config publish_info_test.yaml

# 执行完整测试套件
go run /path/to/agent-go-common-pkg/tool/apitesttool/main.go -config complete_publish_test_suite.yaml
```

### 生成HTML报告
```bash
# 生成基础测试报告
go run /path/to/agent-go-common-pkg/tool/apitesttool/main.go \
  -config publish_info_test.yaml \
  -format html \
  -output reports/publish_info_report.html

# 生成完整测试套件报告
go run /path/to/agent-go-common-pkg/tool/apitesttool/main.go \
  -config complete_publish_test_suite.yaml \
  -format html \
  -output reports/complete_publish_report.html
```

## 测试数据说明

### 动态变量
测试用例使用以下动态变量：
- `${uuid}`: 生成唯一的请求ID
- `${timestamp}`: 生成时间戳
- `${random_string:N}`: 生成N位随机字符串
- `${random_number:min-max}`: 生成指定范围的随机数

### 测试环境配置
- **基础URL**: `http://127.0.0.1:13020`
- **API前缀**: `/api/agent-factory/v3`
- **超时设置**: 5-20秒（根据操作复杂度）
- **重试次数**: 1-2次

## 注意事项

1. **测试顺序**: 某些测试用例依赖于前面测试创建的数据，建议按顺序执行
2. **数据清理**: 测试会创建临时Agent，建议在测试环境中运行
3. **权限要求**: 测试需要相应的用户权限来创建和修改Agent
4. **网络环境**: 确保测试环境能够访问agent-factory服务

## 故障排除

### 常见问题
1. **连接失败**: 检查agent-factory服务是否正常运行
2. **权限错误**: 确认测试用户具有相应的操作权限
3. **超时错误**: 可能需要调整timeout设置或检查服务性能

### 调试建议
1. 查看详细的错误日志
2. 使用单个测试用例进行调试
3. 检查服务端日志获取更多信息

## 扩展测试

如需添加新的测试用例，请参考现有测试的格式，确保包含：
1. 清晰的测试名称和描述
2. 完整的请求配置
3. 详细的断言验证
4. 适当的超时和重试设置
