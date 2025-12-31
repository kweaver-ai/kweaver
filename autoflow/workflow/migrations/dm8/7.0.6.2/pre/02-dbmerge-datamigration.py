#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
达梦(DM) 数据迁移工具 - 单连接版
"""

import rdsdriver
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== 配置 ====================

DB_CONFIG = {
    'host': os.environ["DB_HOST"],
    'port': os.environ["DB_PORT"],
    'user': os.environ["DB_USER"],
    'password': os.environ["DB_PASSWD"],
}

# 源schema和目标schema
SOURCE_SCHEMA = 'workflow'
TARGET_SCHEMA = 'adp'

BATCH_SIZE = 2000
TABLES_TO_MIGRATE = [
    "t_wf_activity_info_config",
    "t_wf_activity_rule",
    "t_wf_application",
    "t_wf_application_user",
    "t_wf_dict",
    "t_wf_doc_audit_apply",
    "t_wf_doc_audit_detail",
    "t_wf_doc_audit_history",
    "t_wf_doc_share_strategy",
    "t_wf_doc_share_strategy_auditor",
    "t_wf_evt_log",
    "t_wf_free_audit",
    "t_wf_ge_bytearray",
    "t_wf_ge_property",
    "t_wf_hi_actinst",
    "t_wf_hi_attachment",
    "t_wf_hi_comment",
    "t_wf_hi_detail",
    "t_wf_hi_identitylink",
    "t_wf_hi_procinst",
    "t_wf_hi_taskinst",
    "t_wf_hi_varinst",
    "t_wf_org",
    "t_wf_procdef_info",
    "t_wf_process_error_log",
    "t_wf_process_info_config",
    "t_wf_re_deployment",
    "t_wf_re_model",
    "t_wf_re_procdef",
    "t_wf_role",
    "t_wf_ru_event_subscr",
    "t_wf_ru_execution",
    "t_wf_ru_identitylink",
    "t_wf_ru_job",
    "t_wf_ru_task",
    "t_wf_ru_variable",
    "t_wf_sys_log",
    "t_wf_type",
    "t_wf_user",
    "t_wf_user2role",
    "t_wf_countersign_info",
    "t_wf_transfer_info",
    "t_wf_outbox",
    "t_wf_internal_group",
    "t_wf_doc_audit_message",
    "t_wf_doc_audit_message_receiver",
    "t_wf_doc_share_strategy_config",
    "t_wf_doc_audit_sendback_message",
    "t_wf_inbox"
]


# ==================== 数据库操作 ====================


def get_connection():
    return rdsdriver.connect(
        host=DB_CONFIG['host'],
        port=int(DB_CONFIG['port']),
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        autoCommit=True
    )


def get_primary_key(conn, schema, table_name):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT cc.COLUMN_NAME
            FROM ALL_CONSTRAINTS c
            JOIN ALL_CONS_COLUMNS cc ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME AND c.OWNER = cc.OWNER
            WHERE c.OWNER = :1 AND c.TABLE_NAME = :2 AND c.CONSTRAINT_TYPE = 'P'
            ORDER BY cc.POSITION FETCH FIRST 1 ROWS ONLY
        """, (schema, table_name))
        row = cursor.fetchone()
        return row[0] if row else None
    finally:
        cursor.close()


def get_columns(conn, schema, table_name):
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS 
            WHERE OWNER = :1 AND TABLE_NAME = :2 ORDER BY COLUMN_ID
        """, (schema, table_name))
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()


def get_identity_columns(conn, schema, table_name):
    """获取表的自增列"""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT 
            c.NAME AS IDENTITY_COLUMN
            FROM SYS.SYSCOLUMNS c
            JOIN SYS.SYSOBJECTS t ON c.ID = t.ID
            JOIN SYS.SYSOBJECTS s ON t.SCHID = s.ID
            WHERE s.NAME = :1
            AND t.NAME = :2
            AND c.INFO2 = 1
        """, (schema, table_name))
        return [row[0] for row in cursor.fetchall()]
    finally:
        cursor.close()


def table_exists(conn, schema, table_name):
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM ALL_TABLES WHERE OWNER = :1 AND TABLE_NAME = :2",
                       (schema, table_name))
        return cursor.fetchone() is not None
    finally:
        cursor.close()


def get_count(conn, schema, table_name):
    cursor = conn.cursor()
    try:
        cursor.execute(f'SELECT COUNT(*) FROM "{schema}"."{table_name}"')
        return cursor.fetchone()[0]
    finally:
        cursor.close()


def get_pk_range(conn, schema, table_name, pk_column):
    cursor = conn.cursor()
    try:
        tbl = f'"{schema}"."{table_name}"'
        cursor.execute(f'SELECT MIN("{pk_column}"), MAX("{pk_column}") FROM {tbl}')
        row = cursor.fetchone()
        return row[0], row[1]
    finally:
        cursor.close()


def fetch_batch(conn, schema, table_name, pk_column, columns, last_pk, batch_size):
    cursor = conn.cursor()
    try:
        cols_str = ', '.join([f'"{c}"' for c in columns])
        tbl = f'"{schema}"."{table_name}"'
        if pk_column:
            pk = f'"{pk_column}"'
            if last_pk is not None:
                sql = f"SELECT {cols_str} FROM {tbl} WHERE {pk} > :1 ORDER BY {pk} FETCH FIRST :2 ROWS ONLY"
                cursor.execute(sql, (last_pk, batch_size))
            else:
                sql = f"SELECT {cols_str} FROM {tbl} ORDER BY {pk} FETCH FIRST :1 ROWS ONLY"
                cursor.execute(sql, (batch_size,))
        else:
            offset = last_pk if last_pk else 0
            sql = f"SELECT {cols_str} FROM {tbl} OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY"
            cursor.execute(sql, (offset, batch_size))
        rows = cursor.fetchall()
        return [{columns[i]: row[i] for i in range(len(columns))} for row in rows]
    finally:
        cursor.close()



def get_existing_pks(conn, schema, table_name, pk_column, pk_values):
    if not pk_values:
        return set()
    cursor = conn.cursor()
    try:
        tbl = f'"{schema}"."{table_name}"'
        pk = f'"{pk_column}"'
        placeholders = ','.join([f':{i+1}' for i in range(len(pk_values))])
        sql = f"SELECT {pk} FROM {tbl} WHERE {pk} IN ({placeholders})"
        cursor.execute(sql, pk_values)
        return {row[0] for row in cursor.fetchall()}
    finally:
        cursor.close()


def insert_rows(conn, schema, table_name, columns, rows, exclude_columns=None):
    """插入行数据，可以排除指定列（如自增列）"""
    if not rows:
        return
    cursor = conn.cursor()
    try:
        # 排除不需要插入的列
        if exclude_columns:
            insert_columns = [c for c in columns if c not in exclude_columns]
        else:
            insert_columns = columns
            
        if not insert_columns:
            logger.warning(f"  所有列都被排除，跳过插入")
            return
            
        tbl = f'"{schema}"."{table_name}"'
        cols_str = ', '.join([f'"{c}"' for c in insert_columns])
        placeholders = ', '.join([f':{i+1}' for i in range(len(insert_columns))])
        sql = f"INSERT INTO {tbl} ({cols_str}) VALUES ({placeholders})"
        for row in rows:
            cursor.execute(sql, tuple(row[c] for c in insert_columns))
    finally:
        cursor.close()


# ==================== 校验逻辑 ====================


def check_columns_match(src_columns, tgt_columns):
    src_set, tgt_set = set(src_columns), set(tgt_columns)
    if src_set != tgt_set:
        src_only = src_set - tgt_set
        tgt_only = tgt_set - src_set
        msg = []
        if src_only:
            msg.append(f"源表多: {list(src_only)}")
        if tgt_only:
            msg.append(f"目标多: {list(tgt_only)}")
        return False, '; '.join(msg)
    return True, "列名一致"


def check_need_migrate(conn, src_schema, tgt_schema, table_name, pk_column, columns):
    src_count = get_count(conn, src_schema, table_name)
    tgt_count = get_count(conn, tgt_schema, table_name)
    logger.info(f"  [行数] 源={src_count}, 目标={tgt_count}")
    
    if src_count == 0 and tgt_count == 0:
        return False, "都为空"
    if src_count != tgt_count:
        return True, f"行数差{abs(src_count - tgt_count)}"
    
    if pk_column:
        src_min, src_max = get_pk_range(conn, src_schema, table_name, pk_column)
        tgt_min, tgt_max = get_pk_range(conn, tgt_schema, table_name, pk_column)
        logger.info(f"  [主键] 源=[{src_min},{src_max}], 目标=[{tgt_min},{tgt_max}]")
        if src_min != tgt_min or src_max != tgt_max:
            return True, "主键范围不一致"
    
    return False, "数据一致"


# ==================== 迁移逻辑 ====================


def migrate_batch(conn, tgt_schema, table_name, pk_column, columns, rows, exclude_columns=None):
    """迁移批次数据，排除指定列"""
    if not rows:
        return 0
    
    if pk_column:
        pk_values = [row[pk_column] for row in rows]
        existing = get_existing_pks(conn, tgt_schema, table_name, pk_column, pk_values)
        to_insert = [r for r in rows if r[pk_column] not in existing]
        insert_rows(conn, tgt_schema, table_name, columns, to_insert, exclude_columns)
        return len(to_insert)
    else:
        insert_rows(conn, tgt_schema, table_name, columns, rows, exclude_columns)
        return len(rows)


def migrate_table(conn, src_schema, tgt_schema, table_name):
    logger.info(f"\n{'='*50}")
    logger.info(f"表: {table_name}")
    
    if not table_exists(conn, tgt_schema, table_name):
        logger.error(f"  目标表不存在")
        return 'fail'
    
    src_columns = get_columns(conn, src_schema, table_name)
    tgt_columns = get_columns(conn, tgt_schema, table_name)
    
    if not src_columns or not tgt_columns:
        logger.warning(f"  跳过: 无列信息")
        return 'skip'
    
    is_match, msg = check_columns_match(src_columns, tgt_columns)
    if not is_match:
        logger.warning(f"  跳过: 列名不一致 - {msg}")
        return 'skip'
    
    logger.info(f"  [列] {src_columns}")
    
    # 获取自增列
    identity_columns = get_identity_columns(conn, tgt_schema, table_name)
    if identity_columns:
        logger.info(f"  [自增列] {identity_columns}")
    
    pk_column = get_primary_key(conn, src_schema, table_name)
    logger.info(f"  [主键] {pk_column or '无'}")
    
    need, reason = check_need_migrate(conn, src_schema, tgt_schema, table_name, pk_column, src_columns)
    if not need:
        logger.info(f"  跳过: {reason}")
        return 'skip'
    
    logger.info(f"  迁移原因: {reason}")
    
    total = get_count(conn, src_schema, table_name)
    last_pk, migrated, inserted, updated, batch_num = None, 0, 0, 0, 0
    
    while True:
        batch_num += 1
        rows = fetch_batch(conn, src_schema, table_name, pk_column, src_columns, last_pk, BATCH_SIZE)
        if not rows:
            break
        
        # 迁移时排除自增列
        ins = migrate_batch(conn, tgt_schema, table_name, pk_column, src_columns, rows, identity_columns)
        
        if pk_column:
            last_pk = rows[-1][pk_column]
        else:
            last_pk = migrated + len(rows)
        
        inserted += ins
        migrated += len(rows)
        
        pct = int(migrated * 100 / total) if total else 100
        logger.info(f"  批次{batch_num}: +{ins}插入 | {migrated}/{total} ({pct}%)")
    
    logger.info(f"  完成: 插入{inserted}")
    return 'done'


def run():
    logger.info("="*50)
    logger.info("达梦(DM) 迁移工具")
    logger.info("="*50)
    logger.info(f"连接: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    logger.info(f"源Schema: {SOURCE_SCHEMA}")
    logger.info(f"目标Schema: {TARGET_SCHEMA}")
    
    conn = get_connection()
    
    try:
        logger.info(f"表数量: {len(TABLES_TO_MIGRATE)}")
        
        results = {'skip': [], 'done': [], 'fail': []}
        for table in TABLES_TO_MIGRATE:
            try:
                r = migrate_table(conn, SOURCE_SCHEMA, TARGET_SCHEMA, table)
                results[r].append(table)
            except Exception as e:
                logger.error(f"  异常: {e}")
                results['fail'].append(table)
        
        logger.info(f"\n{'='*50}\n汇总\n{'='*50}")
        logger.info(f"跳过: {len(results['skip'])} - {results['skip']}")
        logger.info(f"成功: {len(results['done'])} - {results['done']}")
        logger.info(f"失败: {len(results['fail'])} - {results['fail']}")
        
        return len(results['fail']) == 0
    finally:
        conn.close()


if __name__ == "__main__":
    exit(0 if run() else 1)