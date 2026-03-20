USE adp;
-- 记忆历史表

create table if not exists t_business_domain (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_bd_name varchar(50) not null,
    f_bd_description varchar(1000) null,
    f_bd_creator varchar(50) not null,
    f_bd_icon varchar(1000) null,
    f_bd_status int(11) not null default 1,
    f_bd_resource_count int(11) not null default 0,
    f_bd_member_count int(11) not null default 0,
    primary key (id),
    unique key uk_bd_id (f_bd_id),
    unique key uk_bd_name (f_bd_name)
);

create table if not exists t_bd_resource_r (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_resource_id varchar(50) not null,
    f_resource_type varchar(50) not null,
    f_create_by varchar(50) not null,
    primary key (id),
    unique key uk_resource (f_resource_id, f_resource_type)
);

create table if not exists t_bd_product_r (
    id bigint(20) unsigned not null auto_increment,
    created_at datetime(6) not null,
    updated_at datetime(6) not null,
    deleted_at datetime(6) default null,
    f_bd_id varchar(50) not null,
    f_product_id varchar(50) not null,
    f_create_by varchar(50) not null,
    primary key (id),
    unique key uk_bd_product (f_bd_id, f_create_by)
);

create table if not exists t_llm_model
(
    f_model_id     varchar(50)             not null,
    f_model_series varchar(50)             not null,
    f_model_type   varchar(50)             not null,
    f_model_name   varchar(100)            not null,
    f_model        varchar(50)             not null,
    f_model_config varchar(1000)           not null,
    f_create_by    varchar(50)             not null,
    f_create_time  datetime(6)             null,
    f_update_by    varchar(50)             null,
    f_update_time  datetime(6)             null,
    f_max_model_len        int(11)         null,
    f_model_parameters     int(11)         null,
    f_quota        int default 0    not null,
    f_default  int default 0    null,
    primary key (f_model_id)
);



create table if not exists t_small_model
(
    f_model_id varchar(50) not null comment '主键，使用雪花id',
    f_model_name varchar(50) not null comment '小模型名称',
    f_model_type varchar(50) not null comment '小模型类型',
    f_model_config varchar(1000) not null comment '小模型配置json',
    f_create_time datetime(6) not null comment '创建时间',
    f_update_time datetime(6) not null comment '编辑时间',
    f_create_by    varchar(50)             not null,
    f_update_by    varchar(50)             null,
    f_adapter  int default 0    null,
    f_adapter_code       text          null,
    f_batch_size        int(11)         null,
    f_max_tokens        int(11)         null,
    f_embedding_dim     int(11)         null,
    primary key (f_model_id)
);

create table if not exists t_prompt_item_list
(
    f_id                  varchar(50)          not null,
    f_prompt_item_id      varchar(50)          not null,
    f_prompt_item_name    varchar(50)          not null,
    f_prompt_item_type_id varchar(50)          null,
    f_prompt_item_type    varchar(50)          null,
    f_create_by           varchar(50)          not null,
    f_create_time         datetime(6)          null,
    f_update_by           varchar(50)          null,
    f_update_time         datetime(6)          null,
    f_item_is_delete      int default 0 not null,
    f_type_is_delete      int default 0 not null,
    f_built_in            int default 0        not null,
    primary key (f_id)
);


create table if not exists t_prompt_list
(
    f_prompt_id           varchar(50)          not null,
    f_prompt_item_id      varchar(50)          not null,
    f_prompt_item_type_id varchar(50)          not null,
    f_prompt_service_id   varchar(50)          not null,
    f_prompt_type         varchar(50)          not null,
    f_prompt_name         varchar(50)          not null,
    f_prompt_desc         varchar(255)         null,
    f_messages            longtext             null,
    f_variables           varchar(1000)        null,
    f_icon                varchar(50)          not null,
    f_model_id            varchar(50)          not null,
    f_model_para          varchar(150)         not null,
    f_opening_remarks     varchar(150)         null,
    f_is_deploy           int default 0 not null,
    f_prompt_deploy_url   varchar(150)         null,
    f_prompt_deploy_api   varchar(150)         null,
    f_create_by           varchar(50)          not null,
    f_create_time         datetime(6)          null,
    f_update_by           varchar(50)          null,
    f_update_time         datetime(6)          null,
    f_is_delete           int default 0 not null,
    f_built_in            int default 0        not null,
    primary key (f_prompt_id),
    unique key uk_f_prompt_service_id (f_prompt_service_id)
);

create table if not exists t_prompt_template_list
(
    f_prompt_id       varchar(50)          not null,
    f_prompt_type     varchar(50)          not null,
    f_prompt_name     varchar(50)          not null,
    f_prompt_desc     varchar(255)         null,
    f_messages        longtext             null,
    f_variables       varchar(1000)        null,
    f_icon            varchar(50)          not null,
    f_opening_remarks varchar(150)         null,
    f_input           varchar(1000)        null,
    f_create_by       varchar(50)          not null,
    f_create_time     datetime(6)          null,
    f_update_by       varchar(50)          null,
    f_update_time     datetime(6)          null,
    f_is_delete       int default 0 not null,
    primary key (f_prompt_id)
);

CREATE TABLE if not exists t_model_monitor (
    f_id                  varchar(50)          not null,
    f_create_time         datetime          not null,
    f_model_name         varchar(50)         not null,
    f_model_id          varchar(50)          not null,
    f_generation_tokens_total BIGINT not null,
    f_prompt_tokens_total BIGINT not null,
    f_average_first_token_time DECIMAL(10, 2) not null,
    f_generation_token_speed  DECIMAL(10, 2) not null,
    f_total_token_speed  DECIMAL(10, 2) not null,
    primary key (f_id)
);

create table if not exists t_model_quota_config
(
    f_id varchar(50) not null comment '主键，使用雪花id',
    f_model_id varchar(50) not null comment '模型id',
    f_billing_type int not null comment '0 统一计费 ， 1 input output 单独计费',
    f_input_tokens float not null comment 'input tokens配额',
    f_output_tokens float not null comment 'output tokens配额',
    f_referprice_in float not null comment 'input tokens参考单价',
    f_referprice_out float not null comment 'output tokens参考单价',
    f_currency_type bigint not null comment '货币类型 0:RMB/人民币 1:$/美元',
    f_create_time datetime(6) not null comment '创建时间',
    f_update_time datetime(6) not null comment '编辑时间',
    f_num_type varchar(50) not null comment '1-千  2-万 3-百万 4-千万',
    f_price_type varchar(50) not null default '["thousand", "thousand"]' comment '列表，计费单价显示单位, thousand-/千tokens million-/百万tokens',
    primary key (f_id)
);

create table if not exists t_user_quota_config
(
    f_id varchar(50) not null comment '主键，使用雪花id',
    f_model_conf varchar(50) not null comment '模型配额配置id（基于哪个模型配额）',
    f_user_id varchar(50) not null comment '用户id',
    f_input_tokens float not null comment 'input tokens配额',
    f_output_tokens float not null comment 'output tokens配额',
    f_create_time datetime(6) not null comment '创建时间',
    f_update_time datetime(6) not null comment '编辑时间',
    f_num_type varchar(50) not null comment '1-千  2-万 3-百万 4-千万',
    primary key (f_id)
);

create table if not exists t_model_op_detail
(
    f_id varchar(50) not null comment '主键，使用雪花id',
    f_model_id varchar(50) not null comment '模型id',
    f_user_id varchar(50) not null comment '用户id',
    f_input_tokens bigint not null comment 'input tokens消费 ',
    f_output_tokens bigint not null comment 'output tokens消费',
    f_referprice_in float not null comment 'input tokens参考单价',
    f_referprice_out float not null comment 'output tokens参考单价',
    f_total_price DECIMAL(38,10) not null comment '消费总金额',
    f_create_time datetime(6) not null comment '创建时间',
    f_currency_type bigint not null comment '货币类型 0:RMB/人民币 1:$/美元',
    f_price_type varchar(50) not null default '["thousand", "thousand"]' comment '列表，计费单价显示单位, thousand-/千tokens million-/百万tokens',
    f_total_count int default 0 not null comment '总调用次数',
    f_failed_count int default 0 not null comment '调用失败次数',
    f_average_total_time float default 0.0 not null comment '平均总响应时间',
    f_average_first_time float default 0.0 not null comment '平均首字时间',
    primary key (f_id)
);

insert into t_prompt_item_list(f_create_by, f_create_time, f_id, f_item_is_delete, f_prompt_item_id, f_prompt_item_name,
                    f_prompt_item_type, f_prompt_item_type_id, f_type_is_delete, f_update_by, f_update_time, f_built_in)
                select 'admin', current_timestamp, '1500000000000000001', 0, '1510000000000000001', '内置提示词',
                    'chat', '1520000000000000001', 0, 'admin', current_timestamp, 1
                from DUAL where not exists(select f_id from t_prompt_item_list where f_id = '1500000000000000001');


insert into t_prompt_list(f_create_by, f_create_time, f_icon, f_is_delete, f_is_deploy, f_messages, f_model_id,
                    f_model_para, f_opening_remarks, f_prompt_deploy_api, f_prompt_deploy_url, f_prompt_desc,
                    f_prompt_id, f_prompt_item_id, f_prompt_item_type_id, f_prompt_name, f_prompt_service_id,
                    f_prompt_type, f_update_by, f_update_time, f_variables, f_built_in)
                select 'admin', current_timestamp, 5, 0, 0, '你可以重新组织和输出混乱复杂的会议记录，并根据当前状态、遇到的问题和提出的解决方案撰写会议纪要。你只负责会议记录方面的问题，不回答其他。
', '', '{}', '', null, null, '帮你重新组织和输出混乱复杂的会议纪要',
                    '1100000000000000030', '1510000000000000001', '1520000000000000001', '会议纪要', '1200000000000000030',
                    'chat', 'admin', current_timestamp,
                    '[]', 1
                from DUAL where not exists(select f_prompt_id from t_prompt_list where f_prompt_id = '1100000000000000030');



-- Copyright The kweaver.ai Authors.
--
-- Licensed under the Apache License, Version 2.0.
-- See the LICENSE file in the project root for details.

-- ==========================================
-- VEGA Catalog 表结构定义
-- ==========================================

-- ==========================================
-- Schema定义说明（f_schema_definition字段JSON格式）
-- ==========================================
-- f_schema_definition 字段使用JSON数组格式存储所有字段信息，每个字段包含以下属性：
--
-- 基础属性：
--   - name: 字段名称
--   - type: VEGA统一类型 (integer, unsigned_integer, float, decimal, string, text, date, datetime, time, boolean, binary, json, vector)
--   - description: 字段描述
--   - type_config: 类型配置对象 (如 {"max_length": 128}, {"dimension": 768})
--
-- 源端映射：
--   - source_name: 源端字段名（可能与name不同）
--   - source_type: 源端字段类型
--   - is_native: 是否为系统自动同步的字段
--
-- 字段属性：
--   - is_primary: 是否为主键
--   - is_nullable: 是否可为空
--   - default_value: 默认值
--   - ordinal_position: 字段顺序位置
--
-- 字段特征（features数组，可选，用于扩展字段能力）：
--   - feature_type: 特征类型 (keyword, fulltext, vector)
--   - feature_config: 特征配置对象 (如分词器、向量空间类型等)
--   - ref_field_name: 引用的字段名称（用于借用其他字段的能力）
--   - enabled: 是否启用
--
-- 示例：
-- [
--   {
--     "name": "id",
--     "type": "integer",
--     "description": "主键ID",
--     "type_config": {"length": 11},
--     "source_name": "id",
--     "source_type": "int(11)",
--     "is_native": true,
--     "is_primary": true,
--     "is_nullable": false,
--     "default_value": "",
--     "ordinal_position": 1
--   },
--   {
--     "name": "content",
--     "type": "text",
--     "description": "文章内容",
--     "type_config": {},
--     "source_name": "content",
--     "source_type": "text",
--     "is_native": true,
--     "is_primary": false,
--     "is_nullable": true,
--     "default_value": "",
--     "ordinal_position": 2,
--     "features": [
--       {
--         "feature_type": "fulltext",
--         "feature_config": {"analyzer": "ik_max_word"},
--         "ref_field_name": "",
--         "is_default": true
--       }
--     ]
--   },
--   {
--     "name": "embedding",
--     "type": "vector",
--     "description": "向量嵌入",
--     "type_config": {"dimension": 768},
--     "source_name": "",
--     "source_type": "",
--     "is_native": false,
--     "is_primary": false,
--     "is_nullable": true,
--     "default_value": "",
--     "ordinal_position": 3,
--     "features": [
--       {
--         "feature_type": "vector",
--         "feature_config": {"space_type": "cosinesimil", "m": 16, "ef_construction": 200},
--         "ref_field_name": "",
--         "is_default": true
--       }
--     ]
--   }
-- ]
-- ==========================================

-- ==========================================
-- 1. t_catalog 主表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_catalog (
    -- 主键与基础信息
    f_id                      VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_name                    VARCHAR(255 CHAR) NOT NULL DEFAULT '',
    f_tags                    VARCHAR(255 CHAR) NOT NULL DEFAULT '[]',
    f_description             VARCHAR(1000 CHAR) NOT NULL DEFAULT '',

    f_type                    VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_enabled                 TINYINT NOT NULL DEFAULT 1,

    -- Physical Catalog 专属字段
    f_connector_type          VARCHAR(50 CHAR) NOT NULL DEFAULT '',
    f_connector_config        TEXT NOT NULL,
    f_metadata                TEXT NOT NULL,

    -- 状态管理
    f_health_check_enabled    TINYINT NOT NULL DEFAULT 1,
    f_health_check_status     VARCHAR(20 CHAR) NOT NULL DEFAULT 'healthy',
    f_last_check_time         BIGINT NOT NULL DEFAULT 0,
    f_health_check_result     TEXT NOT NULL,

    -- 审计字段
    f_creator                 VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_creator_type            VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_create_time             BIGINT NOT NULL DEFAULT 0,
    f_updater                 VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_updater_type            VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_update_time             BIGINT NOT NULL DEFAULT 0,

    -- 索引
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_t_catalog_name ON t_catalog(f_name);

CREATE INDEX IF NOT EXISTS idx_t_catalog_type ON t_catalog(f_type);

CREATE INDEX IF NOT EXISTS idx_t_catalog_connector_type ON t_catalog(f_connector_type);

CREATE INDEX IF NOT EXISTS idx_t_catalog_health_check_status ON t_catalog(f_health_check_status);

-- ==========================================
-- 2. t_catalog_discover_policy 发现与变更策略表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_catalog_discover_policy (
    f_id                      VARCHAR(40 CHAR) NOT NULL DEFAULT '',

    -- 状态
    f_enabled                 TINYINT NOT NULL DEFAULT 0,

    -- 发现策略配置
    f_discover_mode          VARCHAR(20 CHAR) NOT NULL DEFAULT 'manual',
    f_discover_cron          VARCHAR(100 CHAR) NOT NULL DEFAULT '',
    f_discover_config        TEXT NOT NULL,

    -- 变更处理策略
    f_on_resource_added       VARCHAR(20 CHAR) NOT NULL DEFAULT 'auto_register',
    f_on_resource_removed     VARCHAR(20 CHAR) NOT NULL DEFAULT 'mark_stale',
    f_on_schema_changed       VARCHAR(20 CHAR) NOT NULL DEFAULT 'auto_update',
    f_on_file_content_changed VARCHAR(20 CHAR) NOT NULL DEFAULT 'pending_review',

    -- 策略详细配置
    f_change_policy_config    TEXT NOT NULL,

    -- 索引
    CLUSTER PRIMARY KEY (f_id)
);

CREATE INDEX IF NOT EXISTS idx_t_catalog_discover_policy_discover_mode ON t_catalog_discover_policy(f_discover_mode);

CREATE INDEX IF NOT EXISTS idx_t_catalog_discover_policy_enabled ON t_catalog_discover_policy(f_enabled);

-- ==========================================
-- 3. t_resource 数据资源主表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_resource (
    -- 主键与基础信息
    f_id                      VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_catalog_id              VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_name                    VARCHAR(255 CHAR) NOT NULL DEFAULT '',
    f_tags                    VARCHAR(255 CHAR) NOT NULL DEFAULT '[]',
    f_description             VARCHAR(1000 CHAR) NOT NULL DEFAULT '',

    f_category                VARCHAR(20 CHAR) NOT NULL DEFAULT '',

    -- 状态管理
    f_status                  VARCHAR(20 CHAR) NOT NULL DEFAULT 'active',
    f_status_message          VARCHAR(500 CHAR) NOT NULL DEFAULT '',

    -- 物理数据资源专属字段
    f_database                VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_source_identifier       VARCHAR(500 CHAR) NOT NULL DEFAULT '',
    f_source_metadata         TEXT NOT NULL,

    -- Schema相关
    f_schema_definition       TEXT NOT NULL,

    -- LogicView 专属字段
    f_logic_type              VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_logic_definition        TEXT NOT NULL,
    f_logic_definition_type   VARCHAR(20 CHAR) NOT NULL DEFAULT '',

    -- Local查询配置（物化）
    f_local_enabled           TINYINT NOT NULL DEFAULT 0,
    f_local_storage_engine    VARCHAR(50 CHAR) NOT NULL DEFAULT '',
    f_local_storage_config    TEXT NOT NULL,
    f_local_index_name        VARCHAR(255 CHAR) NOT NULL DEFAULT '',

    -- 同步配置
    f_sync_strategy           VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_sync_config             TEXT NOT NULL,
    f_sync_status             VARCHAR(20 CHAR) NOT NULL DEFAULT 'not_synced',
    f_last_sync_time          BIGINT NOT NULL DEFAULT 0,
    f_sync_error_message      TEXT NOT NULL,

    -- 审计字段
    f_creator                 VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_creator_type            VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_create_time             BIGINT NOT NULL DEFAULT 0,
    f_updater                 VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_updater_type            VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_update_time             BIGINT NOT NULL DEFAULT 0,

    -- 索引
    CLUSTER PRIMARY KEY (f_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_t_resource_catalog_name ON t_resource(f_catalog_id, f_name);

CREATE INDEX IF NOT EXISTS idx_t_resource_category ON t_resource(f_category);

CREATE INDEX IF NOT EXISTS idx_t_resource_status ON t_resource(f_status);

-- ==========================================
-- 4. t_resource_schema_history Schema历史表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_resource_schema_history (
    f_id                      VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_resource_id             VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_schema_version          VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_schema_definition       TEXT NOT NULL,

    -- 变更信息
    f_change_type             VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_change_summary          VARCHAR(1000 CHAR) NOT NULL DEFAULT '',
    f_schema_inferred         TINYINT NOT NULL DEFAULT 0,
    f_change_time             BIGINT NOT NULL DEFAULT 0,

    -- 索引
    CLUSTER PRIMARY KEY (f_id)
);

CREATE INDEX IF NOT EXISTS idx_t_resource_schema_history_resource_id ON t_resource_schema_history(f_resource_id);

-- ==========================================
-- 5. t_connector_type Connector 类型注册表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_connector_type (
    -- 主键与基础信息
    f_type                    VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_name                    VARCHAR(255 CHAR) NOT NULL DEFAULT '',
    f_tags                    VARCHAR(255 CHAR) NOT NULL DEFAULT '[]',
    f_description             VARCHAR(1000 CHAR) NOT NULL DEFAULT '',

    -- 类型分类
    f_mode                    VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_category                VARCHAR(32 CHAR) NOT NULL DEFAULT '',

    -- Remote 模式专用字段
    f_endpoint                VARCHAR(512 CHAR) NOT NULL DEFAULT '',

    -- 字段配置列表（JSON数组格式）
    f_field_config            TEXT NOT NULL,

    -- 状态
    f_enabled                 TINYINT NOT NULL DEFAULT 1,

    -- 索引
    CLUSTER PRIMARY KEY (f_type)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_t_connector_type_name ON t_connector_type(f_name);

CREATE INDEX IF NOT EXISTS idx_t_connector_type_mode ON t_connector_type(f_mode);

CREATE INDEX IF NOT EXISTS idx_t_connector_type_category ON t_connector_type(f_category);

CREATE INDEX IF NOT EXISTS idx_t_connector_type_enabled ON t_connector_type(f_enabled);



-- ==========================================
-- 6. 初始化内置 Local Connector
-- ==========================================
INSERT INTO t_connector_type (f_type, f_name, f_description, f_mode, f_category, f_field_config, f_enabled)
SELECT 'mariadb', 'mariadb', 'MariaDB 关系型数据库连接器', 'local', 'table',
    '{
        "host":      {"name":"主机地址","type":"string","description":"数据库服务器主机地址","required":true,"encrypted":false},
        "port":      {"name":"端口号","type":"integer","description":"数据库服务器端口","required":true,"encrypted":false},
        "username":  {"name":"用户名","type":"string","description":"数据库用户名","required":true,"encrypted":false},
        "password":  {"name":"密码","type":"string","description":"数据库密码","required":true,"encrypted":true},
        "databases": {"name":"数据库列表","type":"array","description":"数据库名称列表（可选，为空则连接实例级别）","required":false,"encrypted":false},
        "options":   {"name":"连接参数","type":"object","description":"连接参数（如 charset, timeout 等）","required":false,"encrypted":false}
    }',
    1
FROM DUAL WHERE NOT EXISTS ( SELECT f_type FROM t_connector_type WHERE f_type = 'mariadb' );

INSERT INTO t_connector_type (f_type, f_name, f_description, f_mode, f_category, f_field_config, f_enabled)
SELECT 'mysql', 'mysql', 'MySQL 关系型数据库连接器', 'local', 'table',
       '{
           "host":      {"name":"主机地址","type":"string","description":"数据库服务器主机地址","required":true,"encrypted":false},
           "port":      {"name":"端口号","type":"integer","description":"数据库服务器端口","required":true,"encrypted":false},
           "username":  {"name":"用户名","type":"string","description":"数据库用户名","required":true,"encrypted":false},
           "password":  {"name":"密码","type":"string","description":"数据库密码","required":true,"encrypted":true},
           "databases": {"name":"数据库列表","type":"array","description":"数据库名称列表（可选，为空则连接实例级别）","required":false,"encrypted":false},
           "options":   {"name":"连接参数","type":"object","description":"连接参数（如 charset, timeout 等）","required":false,"encrypted":false}
       }',
       1
FROM DUAL WHERE NOT EXISTS ( SELECT f_type FROM t_connector_type WHERE f_type = 'mysql' );

INSERT INTO t_connector_type (f_type, f_name, f_description, f_mode, f_category, f_field_config, f_enabled)
SELECT 'opensearch', 'opensearch', 'OpenSearch 搜索引擎连接器', 'local', 'index',
    '{
        "host":          {"name":"主机地址","type":"string","description":"OpenSearch 服务器主机地址","required":true,"encrypted":false},
        "port":          {"name":"端口号","type":"integer","description":"OpenSearch 服务器端口","required":true,"encrypted":false},
        "username":      {"name":"用户名","type":"string","description":"认证用户名","required":false,"encrypted":false},
        "password":      {"name":"密码","type":"string","description":"认证密码","required":false,"encrypted":true},
        "index_pattern": {"name":"索引模式","type":"string","description":"索引匹配模式（可选，如 log-*）","required":false,"encrypted":false}
    }',
    1
FROM DUAL WHERE NOT EXISTS ( SELECT f_type FROM t_connector_type WHERE f_type = 'opensearch' );

-- ==========================================
-- 7. t_discover_task 发现任务表
-- ==========================================
CREATE TABLE IF NOT EXISTS t_discover_task (
    -- 主键与关联信息
    f_id                      VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_catalog_id              VARCHAR(40 CHAR) NOT NULL DEFAULT '',
    f_trigger_type            VARCHAR(20 CHAR) NOT NULL DEFAULT 'manual',

    -- 任务状态
    f_status                  VARCHAR(20 CHAR) NOT NULL DEFAULT 'pending',
    f_progress                INT NOT NULL DEFAULT 0,
    f_message                 VARCHAR(1000 CHAR) NOT NULL DEFAULT '',

    -- 时间信息
    f_start_time              BIGINT NOT NULL DEFAULT 0,
    f_finish_time             BIGINT NOT NULL DEFAULT 0,

    -- 执行结果
    f_result                  TEXT NOT NULL,

    -- 审计字段
    f_creator                 VARCHAR(128 CHAR) NOT NULL DEFAULT '',
    f_creator_type            VARCHAR(20 CHAR) NOT NULL DEFAULT '',
    f_create_time             BIGINT NOT NULL DEFAULT 0,

    -- 索引
    CLUSTER PRIMARY KEY (f_id)
);

CREATE INDEX IF NOT EXISTS idx_t_discover_task_catalog_id ON t_discover_task (f_catalog_id);

CREATE INDEX IF NOT EXISTS idx_t_discover_task_status ON t_discover_task (f_status);
