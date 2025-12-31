
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys



import rdsdriver


def get_conn(user, password, host, port):
    """
    获取数据库的连接
    """
    try:
        conn = rdsdriver.connect(host=host,
                               port=int(port),
                               user=user,
                               password=password,
                               database='workflow')
        # cursor = conn.cursor()
    except Exception as e:
        print("connect workflow error: %s", str(e))
        sys.exit(1)
    return conn

def create_table(conn_cursor):
    create_table_statement = """
        CREATE TABLE IF NOT EXISTS "t_wf_transfer_info" (
        "id" varchar(50 char) NOT NULL COMMENT '主键ID',
        "proc_inst_id" varchar(50 char) NULL DEFAULT NULL COMMENT '流程实例ID',
        "task_id" varchar(100 char) NULL DEFAULT NULL COMMENT '任务ID',
        "task_def_key" varchar(100 char) NULL DEFAULT NULL COMMENT '任务定义KEY',
        "transfer_auditor" varchar(100 char) NULL DEFAULT NULL COMMENT '转审的审核员',
        "transfer_auditor_name" varchar(100 char) NULL DEFAULT NULL COMMENT '转审的审核员名称',
        "transfer_by" varchar(100 char) NULL DEFAULT NULL COMMENT '转审人',
        "transfer_by_name" varchar(100 char) NULL DEFAULT NULL COMMENT '转审人名称',
        "reason" varchar(1000 char) NULL DEFAULT NULL COMMENT '转审原因',
        "batch" decimal(10,0) NULL DEFAULT NULL COMMENT '批次',
        "create_time" datetime(0) NOT NULL COMMENT '创建时间',
        CLUSTER PRIMARY KEY ("id")
    );
    """
    conn_cursor.execute(create_table_statement)


def column_exists(conn, conn_cursor, table_name, column_name):
    # 查询字段是否存在
    conn_cursor.execute(f"SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE OWNER='workflow' AND TABLE_NAME='{table_name}' AND COLUMN_NAME='{column_name}';")

    # 如果结果集中有数据，表示字段存在
    exists = bool(conn_cursor.fetchall())
    return exists


def add_col(conn, conn_cursor, table_name, column_name, sql):
    if column_exists(conn, conn_cursor, table_name, column_name):
        pass
    else:
        add_query = sql
        conn_cursor.execute(add_query)

if __name__ == "__main__":
    conn = get_conn(os.environ["DB_USER"], os.environ["DB_PASSWD"], os.environ["DB_HOST"], os.environ["DB_PORT"])
    conn_cursor = conn.cursor()
    try:
        add_col(conn, conn_cursor, "t_wf_doc_share_strategy", "transfer_switch", "ALTER TABLE t_wf_doc_share_strategy ADD COLUMN transfer_switch varchar(10 char) DEFAULT NULL NULL;")
        add_col(conn, conn_cursor, "t_wf_doc_share_strategy", "transfer_count", "ALTER TABLE t_wf_doc_share_strategy ADD COLUMN transfer_count varchar(10 char) DEFAULT NULL NULL;")
        create_table(conn_cursor)
    except Exception as ex:
        raise ex
    finally:
        conn_cursor.close()
        conn.close()