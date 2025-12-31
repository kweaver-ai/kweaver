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
import os
import rdsdriver


def get_conn(user, password, host, port):
    try:
        conn = rdsdriver.connect(host=host,
                                 port=int(port),
                                 user=user,
                                 password=password,
                                 autocommit=True)
    except Exception as e:
        print("connect database error: %s", str(e))
        raise e
    return conn


def column_exists(conn_cursor, db_name, table_name, column_name):
    # 查询字段是否存在
    conn_cursor.execute(f"SHOW COLUMNS FROM `{db_name}`.`{table_name}` LIKE '{column_name}';")

    # 如果结果集中有数据，表示字段存在
    exists = bool(conn_cursor.fetchall())
    return exists


def alter_column(conn_cursor, db_name, table_name, action_type, column_name, column_props, field_comment):
    if action_type == "ADD" and column_exists(conn_cursor, db_name, table_name, column_name):
        pass
    else:
        if field_comment == "":
            conn_cursor.execute(f"ALTER TABLE `{db_name}`.`{table_name}` {action_type} COLUMN `{column_name}` {column_props};")
        else:
            conn_cursor.execute(f"ALTER TABLE `{db_name}`.`{table_name}` {action_type} COLUMN `{column_name}` {column_props} COMMENT '{field_comment}';")


def drop_column(conn_cursor, db_name, table_name, column_name):
    if column_exists(conn_cursor, db_name, table_name, column_name):
        conn_cursor.execute(f"ALTER TABLE `{db_name}`.`{table_name}` DROP COLUMN {column_name};")


def index_exists(conn_cursor, db_name, table_name, index_name):
    # 查询索引是否存在
    conn_cursor.execute(f"SHOW INDEX FROM `{db_name}`.`{table_name}` WHERE Key_name = '{index_name}';")

    # 如果结果集中有数据，表示索引存在
    exists = bool(conn_cursor.fetchall())
    return exists


def add_index(conn_cursor, db_name, table_name, index_name, obj_props, obj_type):
    if index_exists(conn_cursor, db_name, table_name, index_name):
        pass
    else:
        conn_cursor.execute(f"ALTER TABLE `{db_name}`.`{table_name}` ADD {obj_type} {index_name}({obj_props});")


def drop_index(conn_cursor, db_name, table_name, index_name):
    if index_exists(conn_cursor, db_name, table_name, index_name):
        conn_cursor.execute(f"ALTER TABLE `{db_name}`.`{table_name}` DROP INDEX {index_name};")


def table_exists(conn_cursor, db_name, table_name):
    # 查询表是否存在
    conn_cursor.execute(f"SHOW TABLES FROM `{db_name}` LIKE '{table_name}';")

    # 如果结果集中有数据，表示表存在
    exists = bool(conn_cursor.fetchall())
    return exists


def drop_table(conn_cursor, db_name, table_name):
    if table_exists(conn_cursor, db_name, table_name):
        conn_cursor.execute(f"DROP TABLE `{db_name}`.`{table_name}`;")


def db_exists(conn_cursor, db_name):
    # 查询表是否存在
    conn_cursor.execute(f"SHOW DATABASES LIKE '{db_name}';")

    # 如果结果集中有数据，表示表存在
    exists = bool(conn_cursor.fetchall())
    return exists


def drop_db(conn_cursor, db_name):
    if db_exists(conn_cursor, db_name):
        conn_cursor.execute(f"DROP DATABASE `{db_name}`;")


if __name__ == "__main__":
    conn = get_conn(os.environ["DB_USER"], os.environ["DB_PASSWD"],
                    os.environ["DB_HOST"], os.environ["DB_PORT"])
    conn_cursor = conn.cursor()
    try:
        for alter in ALTER_TABLE_DICT:
            db_name, table_name, obj_type, action_type, obj_name, obj_props, field_comment = alter
            if obj_type == "COLUMN":
                if action_type == "DROP":
                    drop_column(conn_cursor, db_name, table_name, obj_name)
                elif action_type == "ADD" or action_type == "MODIFY":
                    alter_column(conn_cursor, db_name, table_name, action_type, obj_name, obj_props, field_comment)
            elif obj_type == "INDEX" or obj_type == "UNIQUE INDEX":
                if action_type == "DROP":
                    drop_index(conn_cursor, db_name, table_name, obj_name)
                elif action_type == "ADD":
                    add_index(conn_cursor, db_name, table_name, obj_name, obj_props, obj_type)
            elif obj_type == "TABLE":
                if action_type == "DROP":
                    drop_table(conn_cursor, db_name, table_name)
            elif obj_type == "DB":
                if action_type == "DROP":
                    drop_db(conn_cursor, db_name)
    except Exception:
        raise Exception()
    finally:
        conn_cursor.close()
        conn.close()

# === TEMPLATE END ===