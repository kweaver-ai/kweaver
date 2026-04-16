# KWeaver 示例

[English](./README.md)

通过 CLI 演示 KWeaver 核心能力的端到端示例。

| 示例 | 说明 |
|------|------|
| [01-db-to-qa](./01-db-to-qa/) | 连接 MySQL 数据库，构建知识网络，与 Agent 对话 —— 一个脚本完成从原始表到智能问答的全流程。 |

## 快速开始

每个示例独立运行。进入目录，复制 `env.sample` 为 `.env`，填写连接信息，执行脚本：

```bash
cd 01-db-to-qa
cp env.sample .env
vim .env
./run.sh
```

所有示例需要安装 KWeaver CLI（`npm install -g @kweaver-ai/kweaver-sdk`）并已登录平台（`kweaver auth login`）。各示例的 README 中有详细的前置条件说明。

## 清理

脚本退出时会自动清理创建的资源（数据源、知识网络）。手动清理命令见各示例 README。
