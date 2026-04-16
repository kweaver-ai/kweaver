# 使用说明

> **说明**：本目录脚本用于演示/联调一键导入 Agent、知识网络、数据流等。**Context Loader 工具箱**在根目录 **`deploy/deploy.sh` `kweaver-core install`** 结束时会自动尝试导入（默认 `adp/context-loader/agent-retrieval/docs/release/toolset/context_loader_toolset.adp`）：无平台 Token 时通过 `kubectl port-forward` 直连算子服务（适用于 `auth.enabled=false` 等场景）；开启 OAuth 时可设置 `DEPLOY_PLATFORM_ACCESS_TOKEN` 经访问入口调用 impex。详见 `deploy.sh --help` 中的 Environment 段落。

### 前置条件
1. 登录系统工作台(地址：https://ip/deploy,默认账号/密码：admin/eisoo.com)，信息安全管理-统一身份认证-账户-用户中新建用户：test，角色与访问策略-角色管理，将数据管理员、AI管理员、应用管理员角色中添加用户test。
2. 访问 https://ip/studio 登录页，登录test用户（默认密码：123456）下方提示修改密码，修改密码为111111。

### Agent 导入 JSON 模板

- **`sample-agent.import.json`**：轻量 **分析助手**（无 Dolphin、**`skills.tools` 为空**）。导入后请在 Studio 中：选择默认模型（把内嵌配置里 **`REPLACE_WITH_YOUR_LLM_NAME`** 换成你的模型名）、绑定业务知识网络、在技能中挂载 **Context Loader 工具箱**，再发布。接口：**`/api/agent-factory/v3/agent-inout/import`**（`multipart`：`file` + `import_type`）。
- **`agent.json`**：供应链全链路演示用（Dolphin、预绑工具等），与 `auto_config.sh` 默认参数配套。

### 执行示例

1. 将脚本放到kweaver环境任意目录并赋予脚本执行权限：

```bash
chmod +x auto_config.sh
```

2. 导入供应链配置：

```bash
./auto_config.sh agent.json 供应链业务知识网络.json dataflow.json
./auto_config.sh --step 7 基础结构化数据分析工具箱2.adp
```

3. 登录 Studio 进行后续配置：

- 使用 `test` 账号登录 Studio，登录地址：https://ip/studio 
- BKN引擎-业务知识网络中编辑**供应链业务知识网络**中对象类、关系类、行动类等，关联导入的数据源
- 决策智能体-开发-决策智能体中编辑 **供应链业务问答助手** 中知识来源-业务知识网络中添加**供应链业务知识网络**在默认模型配置中选择添加模型然后将技能中工具用到模型的选项中选择添加的模型然后发布
