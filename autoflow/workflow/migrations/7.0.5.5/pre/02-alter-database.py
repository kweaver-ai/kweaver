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
    # 数据库名，   表名，    操作对象， 操作类型, 对象名，          对象属性，                     字段注释
    ["workflow", "t_wf_doc_share_strategy_auditor", "COLUMN", "ADD",    "org_type",    "VARCHAR(32) NOT NULL DEFAULT ''",  "组织类型"],
    ["workflow", "t_wf_doc_share_strategy",         "COLUMN", "ADD",    "perm_config", "VARCHAR(64) NOT NULL DEFAULT ''",  "申请人权限配置"],
    ["workflow", "t_wf_hi_taskinst",                "COLUMN", "ADD",    "message_id",  "VARCHAR(64) NOT NULL DEFAULT ''",  "消息ID"],
]
 
# ！！！以下注释不可删除
# === TEMPLATE START ===
# This is a template file
# Please replace the following comment block with your actual content
# REPLACE_ME
# You can add more lines here if needed
# End of template
# === TEMPLATE END ===