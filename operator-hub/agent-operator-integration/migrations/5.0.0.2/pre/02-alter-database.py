#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 定义表结构变更列表
# 操作对象包含 COLUMN、INDEX、UNIQUE INDEX
# 对象名对应操作对象的名称，如果操作对象为 COLUMN，则为字段名；如果操作对象为 INDEX/UNIQUE INDEX，则为索引名
# 操作类型包含 ADD、DROP、MODIFY
# 对象属性如果是 COLUMN，包含字段类型、是否为空、默认值；如果是 INDEX/UNIQUE INDEX，包含索引列(联合索引列之间用逗号分隔)、排序方式
# 对象属性、字段注释没有时填空字符串
# 特例：删除表，只需数据库名，表名，操作对象为TABLE，操作类型为DROP，其他全填空字符串
# 特例：删除库，只需数据库名，操作对象为DB，，操作类型为DROP，其他全填空字符串
ALTER_TABLE_DICT = [
    # 数据库名，                表名，                      操作对象，    操作类型,  对象名，              对象属性，                            字段注释
    ["dip_data_operator_hub", "t_mcp_server_config",       "COLUMN",   "ADD",     "f_creation_type",   "varchar(20) NOT NULL DEFAULT 'custom'",         "创建类型，custom:自定义mcp服务, tool_imported: 从工具箱导"],
    ["dip_data_operator_hub", "t_mcp_server_config",       "COLUMN",   "ADD",      "f_version",        "int(20) DEFAULT 1",            "版本号"],
    ["dip_data_operator_hub", "t_mcp_server_release",      "COLUMN",   "ADD",      "f_creation_type",   "varchar(20) NOT NULL DEFAULT 'custom'",         "创建类型，custom:自定义mcp服务, tool_imported: 从工具箱导"],
    ["dip_data_operator_hub", "t_outbox_message",       "COLUMN",   "MODIFY",   "f_topic",   "text NOT NULL",         "主题"],
    ["dip_data_operator_hub", "t_op_registry",       "COLUMN",   "ADD",    "f_is_data_source",  "tinyint(1) DEFAULT 0",        "是否为数据源算子"],
    ["dip_data_operator_hub", "t_operator_release",       "COLUMN",   "ADD",    "f_is_data_source",  "tinyint(1) DEFAULT 0",        "是否为数据源算子"]

]
# ！！！以下注释不可删除
# === TEMPLATE START ===
# This is a template file
# Please replace the following comment block with your actual content
# REPLACE_ME
# You can add more lines here if needed
# End of template
# === TEMPLATE END ===