# Agent配置API测试指南

## 测试架构改进

根据您的要求，我们已经将原来的单一copy测试分拆为两个独立的测试模块：

### 🔄 **分拆后的测试结构**

1. **`copy_agent/`** - 专门测试Agent复制功能
   - 接口：`POST /api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy`
   - 功能：复制现有Agent为新的Agent

2. **`copy2tpl/`** - 专门测试Agent复制为模板功能
   - 接口：`POST /api/agent-factory/v3/agent/{agent_id}/{agent_version}/copy2tpl`
   - 功能：将现有Agent复制为模板

### 🎯 **测试流程优化**

#### **前置查询机制**
每个测试都会先通过以下接口查询已存在的Agent：

1. **个人空间Agent列表**
   ```
   GET /api/agent-factory/v3/personal-space/agent-list
   ```
   - 查询参数：`page=1&size=10&publish_status=published`
   - 获取用户个人空间下的Agent列表

2. **已发布智能体列表**（备用）
   ```
   GET /api/agent-factory/v3/published/agent-list
   ```
   - 查询参数：`page=1&size=5`
   - 如果个人空间没有Agent，则查询已发布的智能体

#### **动态变量提取**
测试会自动提取以下变量用于后续测试：
- `source_agent_id` - 源Agent的ID
- `source_agent_name` - 源Agent的名称
- `published_agent_id` - 已发布Agent的ID
- `published_agent_version` - 已发布Agent的版本

## 快速开始

### 1. 执行所有测试
```bash
cd api_test/agent_config
make test-all
```

### 2. 执行单独测试
```bash
# 测试Agent复制
make test-copy-agent

# 测试Agent复制为模板
make test-copy2tpl
```

### 3. 生成测试报告
```bash
# 生成所有报告（自动启动静态服务器）
make report-all

# 生成单独报告
make report-copy-agent
make report-copy2tpl

# 查看报告首页
make view-reports
```

### 4. 静态服务器管理
```bash
# 启动报告服务器（端口8342）
make start-report-server

# 停止报告服务器
make stop-report-server

# 查看报告首页
make view-reports
```

### 5. 检查测试通过率
```bash
make testAllIsPass
```

## 测试用例覆盖

### copy_agent测试用例（9个）
1. **前置查询**：查询个人空间Agent列表
2. **备用查询**：查询已发布智能体列表
3. **基础复制**：提供名称的复制
4. **自动命名**：不提供名称的复制（自动生成"_副本"）
5. **版本复制**：复制已发布版本
6. **错误处理**：Agent不存在
7. **参数校验**：名称过长
8. **路径校验**：缺少agent_id
9. **权限验证**：未登录用户访问
10. **稳定性验证**：最终功能验证

### copy2tpl测试用例（9个）
1. **前置查询**：查询个人空间Agent列表
2. **备用查询**：查询已发布智能体列表
3. **基础复制**：提供名称的复制为模板
4. **自动命名**：不提供名称的复制（自动生成"_模板"）
5. **版本复制**：复制已发布版本为模板
6. **错误处理**：Agent不存在
7. **参数校验**：模板名称过长
8. **路径校验**：缺少agent_id
9. **权限验证**：未登录用户访问
10. **稳定性验证**：最终功能验证

## 测试特性

### ✅ **智能前置查询**
- 自动查询可用的Agent进行测试
- 支持个人空间和已发布Agent的双重查询
- 动态变量提取，无需硬编码Agent ID

### ✅ **完整错误覆盖**
- 404：Agent不存在
- 400：参数校验失败
- 401：权限验证失败
- 边界条件测试

### ✅ **版本支持**
- 未发布版本（unpublished）
- 已发布版本（v1.0.0等）

### ✅ **自动化报告**
- HTML格式的详细测试报告
- 测试通过率统计
- 失败原因分析

## 故障排除

### 常见问题

1. **没有可用的Agent进行测试**
   - 确保个人空间或已发布列表中有Agent
   - 检查用户权限设置

2. **前置查询失败**
   - 检查服务是否正常运行：`make health-check`
   - 验证API路径是否正确

3. **复制操作失败**
   - 查看详细的HTML报告
   - 检查Agent是否存在且有权限访问

### 调试技巧

```bash
# 检查服务状态
make health-check

# 查看详细测试输出
make run-tests

# 生成并查看HTML报告
make report-all
make list-reports
```

## 扩展指南

### 添加新的测试用例

1. 编辑对应的`test_config.yaml`文件
2. 添加新的测试用例
3. 更新断言和变量提取
4. 运行测试验证

### 添加新的测试模块

1. 创建新的测试目录
2. 添加`test_config.yaml`配置
3. 更新`Makefile`和`run_tests.go`
4. 更新文档

## 最佳实践

1. **测试隔离**：每个测试用例应该独立运行
2. **数据清理**：避免测试数据污染
3. **错误处理**：充分测试各种错误场景
4. **文档更新**：及时更新测试文档和用例

## 相关文档

- [Agent复制接口实现文档](../../docs/agent_copy_interfaces_implementation.md)
- [API测试工具文档](../../tool/apitesttool/README.md)
- [个人空间API测试](../personal_space/README.md)
