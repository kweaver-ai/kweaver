
SET SEARCH_PATH TO workflow;


CREATE TABLE IF NOT EXISTS `t_model` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_name` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '模型名称',
  `f_description` VARCHAR(300) NOT NULL DEFAULT '' COMMENT '模型描述',
  `f_train_status` VARCHAR(16) NOT NULL DEFAULT '' COMMENT '模型训练状态',
  `f_status` TINYINT NOT NULL COMMENT '状态',
  `f_rule` TEXT DEFAULT NULL COMMENT '数据标签',
  `f_userid` VARCHAR(40) NOT NULL DEFAULT '' COMMENT '用户id',
  `f_type` TINYINT NOT NULL DEFAULT -1 COMMENT '模型类型',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` BIGINT DEFAULT NULL COMMENT '更新时间',
  `f_scope` VARCHAR(40) NOT NULL DEFAULT '' COMMENT '用户作用域',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_model_f_name` ON `t_model` (f_name);
CREATE INDEX IF NOT EXISTS `idx_t_model_f_userid_status` ON `t_model` (f_userid, f_status);
CREATE INDEX IF NOT EXISTS `idx_t_model_f_status_type` ON `t_model` (f_status, f_type);


CREATE TABLE IF NOT EXISTS `t_train_file` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_train_id` BIGINT UNSIGNED NOT NULL COMMENT '训练记录id',
  `f_oss_id` VARCHAR(36) DEFAULT '' COMMENT '应用存储的ossid',
  `f_key` VARCHAR(36) DEFAULT '' COMMENT '训练文件对象存储key',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_train_file_f_train_id` ON `t_train_file` (f_train_id);


CREATE TABLE IF NOT EXISTS `t_automation_executor` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_name` VARCHAR(256) NOT NULL DEFAULT '' COMMENT '节点名称',
  `f_description` VARCHAR(1024) NOT NULL DEFAULT '' COMMENT '节点描述',
  `f_creator_id` VARCHAR(40) NOT NULL COMMENT '创建者ID',
  `f_status` TINYINT NOT NULL COMMENT '状态 0 禁用 1 启用',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` BIGINT DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_name` ON `t_automation_executor` (`f_name`);
CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_creator_id` ON `t_automation_executor` (`f_creator_id`);
CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_status` ON `t_automation_executor` (`f_status`);


CREATE TABLE IF NOT EXISTS `t_automation_executor_accessor` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_executor_id` BIGINT UNSIGNED NOT NULL COMMENT '节点ID',
  `f_accessor_id` VARCHAR(40) NOT NULL COMMENT '访问者ID',
  `f_accessor_type` VARCHAR(20) NOT NULL COMMENT '访问者类型 user, department, group, contact',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `idx_t_automation_executor_accessor_uk_executor_accessor` (`f_executor_id`, `f_accessor_id`, `f_accessor_type`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_accessor` ON `t_automation_executor_accessor` (`f_executor_id`, `f_accessor_id`, `f_accessor_type`);


CREATE TABLE IF NOT EXISTS `t_automation_executor_action` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_executor_id` BIGINT UNSIGNED NOT NULL COMMENT '节点ID',
  `f_operator` VARCHAR(64) NOT NULL COMMENT '动作标识',
  `f_name` VARCHAR(256) NOT NULL COMMENT '动作名称',
  `f_description` VARCHAR(1024) NOT NULL COMMENT '动作描述',
  `f_group` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '分组',
  `f_type` VARCHAR(16) NOT NULL DEFAULT 'python' COMMENT '节点类型',
  `f_inputs` MEDIUMTEXT COMMENT '节点输入',
  `f_outputs` MEDIUMTEXT COMMENT '节点输出',
  `f_config` MEDIUMTEXT COMMENT '节点配置',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` BIGINT DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_action_executor_id` ON `t_automation_executor_action` (`f_executor_id`);
CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_action_operator` ON `t_automation_executor_action` (`f_operator`);
CREATE INDEX IF NOT EXISTS `idx_t_automation_executor_action_name` ON `t_automation_executor_action` (`f_name`);


CREATE TABLE IF NOT EXISTS `t_content_admin` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_user_id` VARCHAR(40) NOT NULL DEFAULT '' COMMENT '用户id',
  `f_user_name` VARCHAR(128) NOT NULL DEFAULT '' COMMENT '用户名称',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `idx_t_content_admin_uk_f_user_id` (`f_user_id`)
);



CREATE TABLE IF NOT EXISTS `t_audio_segments` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_task_id` VARCHAR(32) NOT NULL COMMENT '任务id',
  `f_object` VARCHAR(1024) NOT NULL COMMENT '文件对象信息',
  `f_summary_type` VARCHAR(12) NOT NULL COMMENT '总结类型',
  `f_max_segments` TINYINT NOT NULL COMMENT '最大分段数',
  `f_max_segments_type` VARCHAR(12) NOT NULL COMMENT '分段类型',
  `f_need_abstract` TINYINT NOT NULL COMMENT '是否需要摘要',
  `f_abstract_type` VARCHAR(12) NOT NULL COMMENT '摘要总结方式',
  `f_callback` VARCHAR(1024) NOT NULL COMMENT '回调地址',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` BIGINT DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
);



CREATE TABLE IF NOT EXISTS `t_automation_conf` (
  `f_key` CHAR(32) NOT NULL,
  `f_value` CHAR(255) NOT NULL,
  PRIMARY KEY (`f_key`)
);


INSERT INTO `t_automation_conf` (f_key, f_value) SELECT 'process_template', 1 FROM DUAL WHERE NOT EXISTS(SELECT `f_key`, `f_value` FROM `t_automation_conf` WHERE `f_key`='process_template');

INSERT INTO `t_automation_conf` (f_key, f_value) SELECT 'ai_capabilities', 1 FROM DUAL WHERE NOT EXISTS(SELECT `f_key`, `f_value` FROM `t_automation_conf` WHERE `f_key`='ai_capabilities');


CREATE TABLE IF NOT EXISTS `t_automation_agent` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_name` VARCHAR(128) NOT NULL DEFAULT '' COMMENT 'Agent 名称',
  `f_agent_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Agent ID',
  `f_version` VARCHAR(32) NOT NULL DEFAULT '' COMMENT 'Agent 版本',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `idx_t_automation_agent_uk_t_automation_agent_name` (`f_name`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_agent_agent_id` ON `t_automation_agent` (`f_agent_id`);


CREATE TABLE IF NOT EXISTS `t_alarm_rule` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_rule_id` BIGINT UNSIGNED NOT NULL COMMENT '告警规则ID',
  `f_dag_id` BIGINT UNSIGNED NOT NULL COMMENT '流程ID',
  `f_frequency` SMALLINT(6) UNSIGNED NOT NULL COMMENT '频率',
  `f_threshold` MEDIUMINT(9) UNSIGNED NOT NULL COMMENT '阈值',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_alarm_rule_rule_id` ON `t_alarm_rule` (`f_rule_id`);


CREATE TABLE IF NOT EXISTS `t_alarm_user` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_rule_id` BIGINT UNSIGNED NOT NULL COMMENT '告警规则ID',
  `f_user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
  `f_user_name` VARCHAR(128) NOT NULL COMMENT '用户名称',
  `f_user_type` VARCHAR(10) NOT NULL COMMENT '用户类型,取值: user,group',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_alarm_user_rule_id` ON `t_alarm_user` (`f_rule_id`);

