---
slug: skill-routing-loop
title: "3 张告警，3 条路径，0 行 Prompt 修改：KWeaver 是怎么让 Agent 跟得上业务变化的"
authors: [kweaver]
tags: [kweaver, bkn, agent, architecture]
---


## 一、一个再普通不过的周一早上

9:15。供应链调度员小李刚泡好咖啡，工位上的告警面板就弹出 3 张 critical 单子：

| 物料 | 当前库存 / 安全水位 |
|---|---|
| MAT-001 电池芯 | 40 / 100 |
| MAT-002 电源模块 | 30 / 120 |
| MAT-003 连接器 | 15 / 80 |

她扫一眼就知道这三张单子的处置方式从来都不一样：

- MAT-001 在仓库里有合格替代料 SUB-001A、SUB-001B——走「替代料切换」，让 MES 切生产；
- MAT-002 的供应商 SUP-2 有「加急」能力——走「催供应商加急」，调供应商门户的加急 API；
- MAT-003 没有替代、供应商也加不了急——只能走「标准补货」，从 ERP 下采购单。

如果让 AI 帮她处置，AI 怎么知道每张单子"对的姿势"？更尖锐一点：**当业务侧明天决定 MAT-002 改走标准补货，AI 怎么自动跟上？**

<!-- truncate -->

## 二、行业最常见的做法，以及它的天花板

绝大多数 agent 项目今天的答案是：**把规则写进 prompt**。

```
你是供应链助手。
当物料有替代料且充足时调 substitute_swap，
当供应商支持加急时调 supplier_expedite，
否则调 standard_replenish……
```

这个写法在 demo 里跑得动。问题在生产线上才显现：

- 一年后 prompt 长到 5000 字，没人完整读过；
- 加一个 Skill 要改 3 处条件分支、跑回归、上线一次；
- 业务侧想把 MAT-002 改去标准补货，要找 IT、找算法、改 prompt、回归、发版——一个本该是 SKU 维护的动作，变成了一次小型 release。

更根本的问题：**Skill 路由本来是业务治理问题，被错误地塞进了 prompt 工程**。

## 三、KWeaver 的答案：让产品自己消化这件事

看 KWeaver 写出来的方案是怎样的。完整 demo 在 `examples/05-skill-routing-loop/`，一条命令端到端跑通：

```bash
cp env.sample .env  # 填平台地址 / LLM ID / DB
./run.sh --bonus    # 5 分钟跑完
```

跑完之后小李会看到：3 张告警，AI 给出 3 条不同处置路径——而**整个工程目录里没有一行 if/else 描述「该选哪个 Skill」**。所有路由判断都被外包给了 KWeaver 的三件设施联动：

- **Skill** 是企业能力的一阶资产：3 个 Skill 包（标准补货 / 替代料切换 / 供应商加急）注册到 execution-factory，有版本、有 SKILL.md 契约、能 Python 脚本也能 HTTP API；
- **BKN（业务知识网络）** 把 MySQL 业务表 live-read 成图，并通过一条 `applicable_skill` 关系把 Skill 绑定到物料——`materials.bound_skill_id` 改一下，这条边就跟着变；
- **Agent** 用 `find_skills` 查 BKN 拿到候选集，再用 `builtin_skill_load` / `builtin_skill_execute_script` 落到 Skill 执行——它**不知道也不需要知道**业务上"哪个物料该用哪个 Skill"。

而 system_prompt 里**没有任何一个 Skill 的名字**：

> 你是供应链处置助手。`find_skills` 返回的就是该物料当前适用的 Skill 集合，你只能从这个集合中选择并执行……
> 1. 调 find_skills 拿候选；
> 2. 查 BKN 取证据；
> 3. 选一个 Skill 加载契约；
> 4. 执行；
> 5. 输出决策依据。

整段 prompt 里有一个值得反复读的事实：它从头到尾**没有提任何一个具体 Skill 的名字**。没有"使用 substitute_swap 当 X"，没有"遇到 Y 调 supplier_expedite"。这条 prompt 是 **Skill-agnostic 的**——

- 加一个新 Skill：注册到 execution-factory，绑给某些物料——**不动 prompt**；
- 退役一个 Skill：解绑、下线——**不动 prompt**；
- 把 MAT-002 从「催供应商」改成「标准补货」：改一行 SQL——**不动 prompt**。

prompt 里那句"`find_skills` 返回的就是真相源"不是"针对供应链场景调出来的话术"，而是一条**领域无关的治理不变式**：它定义了 Agent 和 KN 之间的权责契约——**Agent 负责怎么思考，KN 负责能做什么**。这条契约一次写好，整个供应链处置场景所有的 Skill 增删改、所有的物料绑定调整，都在 prompt 之外完成。

这才是把 Skill 路由从「prompt 工程问题」搬到「数据治理问题」之后，prompt 真正该长的样子。

## 四、Demo 实录：3 张告警，3 条路径

3 张告警丢给同一个 Decision Agent：

**MAT-001 → substitute_swap**

> find_skills 返回：substitute_swap。绑定技能 ID 为 substitute_swap。
> 选定技能：substitute_swap（替代料切换）——通过 Python 评分挑替代料后调 MES。

**MAT-002 → supplier_expedite**

> find_skills 返回的唯一候选是 supplier_expedite，物料绑定一致。
> 证据：SUP-2 capability=expedite。
> 选定技能：supplier_expedite（供应商加急）。

**MAT-003 → standard_replenish**

> find_skills 只返回 standard_replenish，没替代、没加急，按规则直接选定。
> 选定技能：standard_replenish（标准补货）。

3 条不同路径，**没改一行 prompt**——差别全部来自 BKN 里的 `applicable_skill` 边。

## 五、Bonus：当业务规则变了，AI 怎么自动跟上？

真正的考验。业务侧决定：MAT-002 不再走"催供应商"，改走"标准补货"。

```bash
# 1. 业务系统改一行 SQL
UPDATE materials SET bound_skill_id='standard_replenish' WHERE sku='MAT-002';

# 2. 刷新 KWeaver 这边的资源快照（这一步的工程含义见下一节）
kweaver bkn build ex05_skill_routing --wait

# 3. 重新触发告警
kweaver agent chat <agent-id> -m "Material MAT-002 hit critical stock level again..."
```

agent 这次的推理日志：

> 供应商 SUP-2 具有加急能力，但对应的 supplier_expedite 技能**不在候选集中**——按规则我必须从 find_skills 返回的候选里选。
> 选定技能：standard_replenish（标准补货）。

注意 agent 自己说出来的这句话：「我看到了 SUP-2 能加急，但治理结果不让我走那条路。」**有边界、可治理、能解释**——这才是企业级 Agent 应有的姿态。

prompt 没动、agent 没改、Skill 包没重新部署。整条变化只发生在 MySQL 一行 UPDATE 和一次资源快照刷新。

## 六、为什么这里要 build——以及为什么这不是平台限制

读到这里有个会让人皱眉的细节：Bonus 段里"业务改 SQL"和"AI 跟随"之间多了一步 `kweaver bkn build`。这是不是说"业务一改就要重建图"？听上去就不 sexy。

刚好相反——这是 demo 自己的简化取舍。

KWeaver 的数据层（Vega）支持两种资源同步模式：

| 模式 | 同步方式 | 业务变更到 AI 看到的延迟 | 基础设施要求 |
|---|---|---|---|
| **batch** | build 时全量读一次快照 | 直到下一次 build | 数据库可达即可 |
| **streaming** | Debezium CDC → Kafka → 资源秒级订阅 | ~秒级 | Kafka + Kafka Connect + binlog ROW 模式 |

example-05 用的是 batch——因为这是个 5 分钟跑通的 demo，不该让读者去搭一套 Kafka 才能体验 KN 驱动的 Skill 路由。**所以 Bonus 段的 `kweaver bkn build` 是用来手动刷新 batch 快照的**，不是因为关系边在图里被"硬编码"了——`applicable_skill` 这种 direct-mapping 关系本身在每次查询时实时计算，跟踪的就是底层资源的当前快照。

把同样这个 example 跑在生产环境，把 dataview 切到 streaming：

- 业务系统执行 `UPDATE materials SET bound_skill_id=...`
- Debezium 捕获 binlog 变更 → Kafka → Vega 资源在秒级内更新
- 下一次 `find_skills` 拿到的就是新候选集
- **没有 build 步骤，没有人工干预**

整个 Skill 路由的反馈环时延从「人为触发的 build」变成「业务系统的事务延迟 + 几秒 CDC」——这才是 production 部署该有的样子。

换个说法：**KWeaver 给的是一档可调旋钮，不是固定档位**。POC 阶段用 batch，简单到一台 MySQL 就够；上生产切 streaming，秒级反馈环。开发者写的代码（Skill 包、BKN 模板、agent.json）一行不用动。

## 七、用户写了什么，KWeaver 替他消化了什么

回过头看小李这边——她、或者她的工程师同事，在这个 example 里写的内容很少：

- 3 个 Skill 包的 `SKILL.md` + 实现（标准补货 / 替代料切换 / 供应商加急）
- BKN 的 5 个模板（material / supplier / skills 三个 ObjectType + applicable_skill / supplied_by 两个 RelationType）
- 一份不到 300 字的 `agent.json`，prompt 里**不提任何 Skill 名字**
- 一份业务数据 CSV（5 行 materials，3 行 suppliers，3 行 skills）

KWeaver 替他消化的是：

- Skill 的注册 / 版本化 / 上下线 / 远端执行（execution-factory）；
- 业务表到图的双向桥（Vega 的 direct-mapping，batch / streaming 两种同步模式）；
- Agent 与 KN、Agent 与 Skill 之间的协议（`find_skills` 用 MCP server，`builtin_skill_load` 内置工具，`X-Kn-ID` header 路由 KN 上下文）；
- mode=react 的工具挂载、Decision 链的可观察、清理回滚……

**用户视角：3 个 Skill 包 + 5 张 BKN 模板 + 一份精炼 prompt，5 分钟跑通。产品视角：背后是一整条从业务系统到 LLM 决策的治理链路。**

这就是那个一直被低估的产品命题——好用的 AI 平台不是把更多旋钮交给开发者，而是把治理链路替开发者封装好。**让简单的事简单，让复杂的事至少可控。**

## 八、一句话主张

Agent 的能力边界不该写在 prompt 里。它应该被治理成一阶资源，和数据库里的字段、流程图里的节点、图谱里的关系一样可以被增删改查、版本化、审计、回滚。

KWeaver 的回答是：让 **Skill 成为可治理的能力资产**，让 **BKN 成为业务真相到 AI 可读图状态的桥**，让 **Agent 成为有边界的编排者**——三者通过几个干净的接口啮合，开发者只需要写自己业务里那点真正独特的逻辑。

剩下的复杂性，产品来扛。

---

**自己跑一遍**

```bash
git clone https://github.com/kweaver-ai/kweaver-core
cd kweaver-core/examples/05-skill-routing-loop
cp env.sample .env  # 填 PLATFORM_HOST、LLM_ID、DB_*
./run.sh --bonus    # 端到端约 5 分钟
```

完整代码、BKN 模板、Skill 包、agent.json，都在 `examples/05-skill-routing-loop/`。
