#!/usr/bin/env python3
# -*- coding: utf-8 -*-
 
# 2024年6月新模板，适配AS7.0.6.0支持不中断更新
# 定义表结构变更列表
# 操作对象包含 COLUMN、INDEX、UNIQUE INDEX
# 对象名对应操作对象的名称，如果操作对象为 COLUMN，则为字段名；如果操作对象为 INDEX/UNIQUE INDEX，则为索引名
# 操作类型包含 ADD、DROP、MODIFY
# 对象属性如果是 COLUMN，包含字段类型、是否为空、默认值；如果是 INDEX/UNIQUE INDEX，包含索引列(联合索引列之间用逗号分隔)、排序方式
# 对象属性、字段注释没有时填空字符串
# 特例：删除表，只需数据库名，表名，操作对象为TABLE，操作类型为DROP，其他全填空字符串
# 特例：删除库，只需数据库名，操作对象为DB，操作类型为DROP，其他全填空字符串
# 特例：删除自增，操作对象为COLUMN，操作类型为MODIFY，对象名为自增的列名，对象属性为原对象属性去除AUTO_INCREMENT，字段注释为DROP AUTO_INCREMENT
# 不中断更新：新增COLUMN，INDEX为向后兼容的数据模型变更操作，其他均认为属于破坏性变更操作(包括唯一索引)，会在DataModel管道的持续集成中检查出来
  
ALTER_TABLE_DICT = [
    # 数据库名，   表名，              操作对象， 操作类型, 对象名，            对象属性，                            字段注释
    ["workflow", "t_wf_countersign_info", "INDEX",  "ADD",  "idx_t_wf_countersign_info_inst_id_def_key", "proc_inst_id, task_def_key",             ""],
    ["workflow", "t_wf_transfer_info",    "INDEX",  "ADD",  "idx_t_wf_transfer_info_inst_id_def_key",    "proc_inst_id, task_def_key",             ""],
]
 
# ！！！以下注释不可删除
# === TEMPLATE START ===
# This is a template file
# Please replace the following comment block with your actual content
# REPLACE_ME
# You can add more lines here if needed
# End of template
# === TEMPLATE END ===