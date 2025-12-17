# agents 目录说明

本目录包含系统内置的多种 Agent 配置与编排脚本，均采用统一的 `config` 结构，核心字段包括：
- `input`/`output`: 输入与输出变量定义
- `dolphin`: 工作流/提示词脚本（包含工具与子 Agent 调用）
- `skills.tools`/`skills.agents`: 依赖的工具与技能Agent
- `llms`: 默认及可选的模型配置
- `data_source`: 数据源配置（如文档库、图谱等）
- `built_in_can_edit_fields`: 内置 Agent 可编辑字段控制

下文对每个 Agent 进行逐一说明。

---

## 总览

- DocQA_Agent — 文档问答
- GraphQA_Agent — 图谱问答
- OnlineSearch_Agent — 在线搜索（智谱搜索）
- Plan_Agent — 简单任务拆解
- Task_Plan_Agent — 任务规划
- Summary_Agent — 总结报告生成
- deepsearch — 深度搜索 Agent，自动选择并调用上述 Agent 完成深度搜索与总结

---

## DocQA_Agent

- 名称: `DocQA_Agent`
- 说明: 文档问答 Agent
- 主要逻辑: 
  - `dolphin` 中通过 `@doc_qa` 工具进行检索，随后基于召回结果进行总结输出到 `answer`
- 输入: 
  - `query: string`
- 输出: 
  - `answer_var: answer`
  - `doc_retrieval_var: doc_retrieval_res`
- 工具依赖 (`skills.tools`):
  - `doc_qa`（工具箱：搜索工具）
  - 输入参数：`query`、`props`
- 模型 (`llms`): `Tome-pro`（max_tokens: 3000）
- 数据源 (`data_source`):
  - `doc`: 包含 `ds_id`、`fields`、`address`、`port` 等连接与高级检索配置（如 `document_threshold`, `documents_num`, `retrieval_max_length`）
- 可编辑项 (`built_in_can_edit_fields`): 允许编辑 `data_source.doc`、`model`；不允许修改 `skills`、`skills.tools.tool_input` 等

---

## GraphQA_Agent

- 名称: `GraphQA_Agent`
- 说明: 图谱问答 Agent
- 主要逻辑:
  - `dolphin` 中通过 `@graph_qa` 工具进行检索，并对结果总结为 `answer`
- 输入:
  - `query: string`
- 输出:
  - `answer_var: answer`
  - `graph_retrieval_var: graph_retrieval_res`
- 工具依赖 (`skills.tools`):
  - `graph_qa`（工具箱：搜索工具），输入参数：`query`、`props`
- 模型 (`llms`): `Tome-pro`（max_tokens: 30000）
- 数据源 (`data_source`):
  - `kg`: 包含 `kg_id`、实体/边字段及高级参数（如 `graph_rag_topk`, `enable_rag`, `retrieval_max_length` 等）
- 可编辑项 (`built_in_can_edit_fields`): 允许编辑 `data_source.kg`、`model`

---

## OnlineSearch_Agent

- 名称: `OnlineSearch_Agent`
- 说明: 在线搜索 Agent（基于智谱搜索）
- 主要逻辑:
  - 先将原始 `query` 改写为 3-5 个更适合搜索的问题（当前为联调仅取前 2 个）
  - 循环调用 `@zhipu_search_tool` 获取检索结果，收集参考内容 `ref`
  - 若无检索结果，输出“没有找到相关资料”；否则基于参考资料撰写答案
  - `post_dolphin` 生成 `related_questions`（相关问题）
- 输入:
  - `query: string`
- 输出:
  - `answer_var: answer`
  - 其他变量：`search_querys`, `search_results`
  - `related_questions_var: related_questions`
- 工具依赖 (`skills.tools`):
  - `zhipu_search_tool`（工具箱：搜索工具）
  - 输入参数：`query`、`api_key`（通过 `map_type: fixedValue` 设置，需替换为真实 Key）
- 模型 (`llms`): `Tome-pro`（max_tokens: 3000）
- 可在文件内将 `api_key` 替换为有效的智谱搜索 API Key：`api_key = "<<请在这里替换智谱搜索的api_key>>"`（可在部署后在页面上进行设置）
- 可编辑项 (`built_in_can_edit_fields`): 允许编辑 `model`、`skills.tools.tool_input`（便于替换 `api_key`）

---

## Plan_Agent

- 名称: `Plan_Agent`
- 说明: 负责将原始任务拆解为 2~4 步的列表（前几步搜索，最后一步总结）
- 输入:
  - `query: string`
- 输出:
  - `answer_var: plan_list`（列表）
- 工具依赖: 无
- 模型: `Tome-pro`（更偏向生成多样性的采样参数）
- 可编辑项: 允许编辑 `model`

---

## Task_Plan_Agent

- 名称: `Task_Plan_Agent`
- 说明: 深度任务规划 Agent。将用户请求分解为结构化 JSON 计划，包含任务数组与 reasoning 字段。
- 输入:
  - `query: string`
- 输出:
  - `answer_var: task_list`（纯 JSON 字符串）
- 工具依赖: 无
- 模型: `Tome-pro`（可在页面上进行调整）
- 可编辑项: 允许编辑 `model`

---

## Summary_Agent

- 名称: `Summary_Agent`
- 说明: 总结报告生成 Agent（面向“最终报告/长文总结”场景）
- 输入:
  - `query: string`
  - `ref_list: string`（获得的知识/参考资料）
- 输出:
  - `answer_var: answer`（markdown 内容）
- 工具依赖: 无
- 模型: `Tome-pro`（可在页面上进行调整）
- 可编辑项: 允许编辑 `model`

---

## deepsearch（编排型 Agent）

- 名称: `deepsearch`
- 说明: 深度搜索编排 Agent。自动：
  1) 规划任务；
  2) 根据可用数据源动态增加“搜索图谱/搜索文档库”的子任务；
  3) 对每一步通过 LLM 判定选择最合适的子 Agent（OnlineSearch/DocQA/GraphQA/Summary）执行；
  4) 聚合中间结果，输出最终答案。
- 输入:
  - `query: string`
- 输出:
  - `answer_var: answer`
  - 其他变量：`plan_list`, `ref_list`, `plan`, `SelectAgent`
- 工具依赖 (`skills.tools`):
  - `check`（数据处理工具，带 `intervention=True`）
  - `pass`（跳过）
  - `获取agent详情`（DataAgent 配置相关工具，用于检测 `GraphQA_Agent`/`DocQA_Agent` 的数据源可用性）
- 子 Agent 依赖 (`skills.agents`):
  - `Plan_Agent`, `OnlineSearch_Agent`, `DocQA_Agent`, `GraphQA_Agent`, `Summary_Agent`
- 模型 (`llms`):
  - 默认 `Tome-pro`
  - 可选 `deepseek-r1`（is_default: False）
- 关键流程摘录：
  - 通过 `@Plan_Agent` 生成 `plan_list`
  - 若图谱/文档数据源可用，则在计划前插入“搜索图谱/搜索文档库”
  - `for` 循环逐步执行：
    - 用提示判断该步最合适的 Agent 名称（只输出名称）
    - 按选择调用对应子 Agent 收集参考 `ref_list`，并通过 `check` 控件支持交互式调整
  - 最终以最后一次 `ref_list[-1]['answer']` 作为 `answer`
- 可编辑项: 允许编辑 `model`、`skills.tools.tool_input`
- 使用前提与注意:
  - 保证依赖子 Agent 均已存在且可用
  - 若需启用在线搜索，需在 `OnlineSearch_Agent.py` 中配置有效 `api_key`
  - `check` 工具为交互工具，`intervention=True` 时可用于人工确认/修改计划或结果

---

## 典型使用与扩展建议

- 若你的场景仅有文档数据源，推荐直接使用 `DocQA_Agent`；若仅有图谱，使用 `GraphQA_Agent`；需要联网上资料时使用 `OnlineSearch_Agent`。
- 扩展新工具/数据源：
  - 在对应 Agent 的 `skills.tools` 中增加工具描述与输入映射
- 参数与权限：
  - `built_in_can_edit_fields` 用于限制前端可编辑字段，避免破坏关键结构；若需要开放配置，请有选择地设置为 `True`。

---

## 文件清单

- `DocQA_Agent.py`
- `GraphQA_Agent.py`
- `OnlineSearch_Agent.py`
- `Plan_Agent.py`
- `Task_Plan_Agent.py`
- `Summary_Agent.py`
- `deepsearch.py`
- `__init__.py`

