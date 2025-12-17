# Agent复制接口实现

## 概述

基于现有的detail.go接口实现模式，我创建了两个Agent复制相关的接口：
1. `/agent-factory/v3/agent/{agent_id}/{agent_version}/copy` - 复制Agent
2. `/agent-factory/v3/agent/{agent_id}/{agent_version}/copy2tpl` - 复制Agent为模板

## 接口信息

### 1. 复制Agent接口
- **路径**: `/api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy`
- **方法**: `POST`
- **功能**: 复制指定的Agent，创建一个新的Agent副本

### 2. 复制Agent为模板接口
- **路径**: `/api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy2tpl`
- **方法**: `POST`
- **功能**: 将指定的Agent复制为模板

## 实现的文件结构

### 1. 请求/响应数据结构
- `src/driveradapter/api/rdto/agent_config/agentconfigreq/copy.go` - 请求参数结构
- `src/driveradapter/api/rdto/agent_config/agentconfigresp/copy.go` - 响应数据结构

### 2. HTTP处理层
- `src/driveradapter/api/public/v3/v3agentconfighandler/copy.go` - HTTP处理器
- `src/driveradapter/api/public/v3/v3agentconfighandler/define.go` - 路由注册

### 3. 服务层
- `src/domain/service/v3/v3agentconfigsvc/copy.go` - 业务逻辑实现
- `src/port/driver/iv3portdriver/da_config_svc.go` - 服务接口定义

### 4. 依赖注入
- `src/domain/service/inject/v3/dainject/config.go` - 服务依赖注入配置
- `src/domain/service/v3/v3agentconfigsvc/define.go` - 服务结构定义

### 5. 测试配置
- `api_test/agent_config/copy/test_config.yaml` - API测试配置

## 功能特性

### 复制Agent功能
- ✅ **支持未发布版本复制**：复制unpublished版本的Agent
- ✅ **支持已发布版本复制**：复制特定版本的已发布Agent
- ✅ **自动名称生成**：如果不提供名称，自动生成"原名称_副本"
- ✅ **名称冲突检查**：检查新Agent名称是否已存在
- ✅ **完整配置复制**：复制所有Agent配置信息
- ✅ **用户权限控制**：只有登录用户才能执行复制操作

### 复制为模板功能
- ✅ **Agent转模板**：将Agent配置转换为模板格式
- ✅ **自动名称生成**：如果不提供名称，自动生成"原名称_模板"
- ✅ **模板名称冲突检查**：检查新模板名称是否已存在
- ✅ **配置信息保留**：保留原Agent的所有配置信息
- ✅ **创建类型标记**：标记为"copy_from_agent"类型

### 请求参数
```json
{
  "name": "新的名称"  // 可选，不提供则自动生成
}
```

### 响应格式

#### 复制Agent响应
```json
{
  "id": "new_agent_id",
  "name": "新Agent名称",
  "key": "new_agent_key",
  "version": "unpublished"
}
```

#### 复制为模板响应
```json
{
  "id": "new_template_id",
  "name": "新模板名称",
  "key": "new_template_key"
}
```

## 测试覆盖

### 功能测试
1. **基础复制测试**：提供名称和不提供名称的复制
2. **版本支持测试**：未发布版本和已发布版本的复制
3. **模板创建测试**：Agent转模板的各种场景

### 错误处理测试
1. **资源不存在**：复制不存在的Agent
2. **参数校验**：名称长度限制、必需参数检查
3. **权限验证**：未登录用户访问控制
4. **冲突处理**：名称重复的处理

### 边界条件测试
1. **长名称处理**：超长名称的校验
2. **特殊字符处理**：名称中的特殊字符
3. **并发安全**：多用户同时复制的处理

## 技术实现要点

### 1. 事务管理
- 使用数据库事务确保数据一致性
- 复制失败时自动回滚

### 2. 数据复制策略
- 完整复制源Agent的所有配置
- 生成新的ID和Key
- 设置正确的创建时间和创建者
- 标记创建类型和来源

### 3. 名称生成规则
- Agent复制：`原名称_副本`
- 模板复制：`原名称_模板`
- 支持自定义名称覆盖

### 4. 权限控制
- 需要用户登录（X-User-ID头部）
- 复制的资源归属于当前用户

## 使用示例

### 复制Agent
```bash
curl -X POST \
  "http://127.0.0.1:13020/api/agent-factory/v3/agent/agent123/unpublished/copy" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{"name": "我的Agent副本"}'
```

### 复制Agent为模板
```bash
curl -X POST \
  "http://127.0.0.1:13020/api/agent-factory/v3/agent/agent123/v1.0.0/copy2tpl" \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{"name": "我的Agent模板"}'
```

## 注意事项

1. **版本处理**：复制的Agent始终创建为unpublished状态
2. **模板依赖**：copy2tpl功能依赖模板仓库的正确配置
3. **配置完整性**：确保复制时保留所有必要的配置信息
4. **错误处理**：提供清晰的错误信息和状态码

## 后续优化建议

1. **批量复制**：支持一次复制多个Agent
2. **复制选项**：支持选择性复制某些配置项
3. **版本管理**：复制时支持指定目标版本
4. **权限细化**：支持更细粒度的复制权限控制
5. **审计日志**：记录复制操作的详细日志
