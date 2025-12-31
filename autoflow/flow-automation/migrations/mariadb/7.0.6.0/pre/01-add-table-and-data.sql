USE workflow;

CREATE TABLE IF NOT EXISTS `t_automation_executor` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_name` varchar(64) NOT NULL DEFAULT '' COMMENT '节点名称',
  `f_description` varchar(256) NOT NULL DEFAULT '' COMMENT '节点描述',
  `f_creator_id` varchar(40) NOT NULL COMMENT '创建者ID',
  `f_status` tinyint NOT NULL COMMENT '状态 0 禁用 1 启用',
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` bigint DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_automation_executor_name` (`f_name`),
  KEY `idx_t_automation_executor_creator_id` (`f_creator_id`),
  KEY `idx_t_automation_executor_status` (`f_status`)
) ENGINE=InnoDB COMMENT "自定义节点";

CREATE TABLE IF NOT EXISTS `t_automation_executor_accessor` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_executor_id` bigint unsigned NOT NULL COMMENT '节点ID',
  `f_accessor_id` varchar(40) NOT NULL COMMENT '访问者ID',
  `f_accessor_type` varchar(20) NOT NULL COMMENT '访问者类型 user, department, group, contact',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_automation_executor_accessor` (`f_executor_id`, `f_accessor_id`, `f_accessor_type`),
  UNIQUE KEY `uk_executor_accessor` (`f_executor_id`, `f_accessor_id`, `f_accessor_type`)
) ENGINE=InnoDB COMMENT "自定义节点访问者";

CREATE TABLE IF NOT EXISTS `t_automation_executor_action` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_executor_id` bigint unsigned NOT NULL COMMENT '节点ID',
  `f_operator` varchar(64) NOT NULL COMMENT "动作标识",
  `f_name` varchar(64) NOT NULL COMMENT '动作名称',
  `f_description` varchar(256) NOT NULL COMMENT '动作描述',
  `f_group` varchar(64) NOT NULL DEFAULT '' COMMENT '分组',
  `f_type` varchar(16) NOT NULL DEFAULT 'python' COMMENT '节点类型',
  `f_inputs` mediumtext COMMENT "节点输入",
  `f_outputs` mediumtext COMMENT "节点输出",
  `f_config` mediumtext COMMENT "节点配置",
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` bigint DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_automation_executor_action_executor_id` (`f_executor_id`),
  KEY `idx_t_automation_executor_action_operator` (`f_operator`),
  KEY `idx_t_automation_executor_action_name` (`f_name`)
) ENGINE=InnoDB COMMENT "节点动作";

CREATE TABLE IF NOT EXISTS `t_content_admin` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_user_id` varchar(40) NOT NULL DEFAULT '' COMMENT '用户id',
  `f_user_name` varchar(128) NOT NULL DEFAULT '' COMMENT '用户名称',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_f_user_id` (`f_user_id`)
) ENGINE=InnoDB COMMENT='管理员表';

CREATE TABLE IF NOT EXISTS `t_audio_segments` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_task_id` varchar(32) NOT NULL COMMENT '任务id',
  `f_object` varchar(1024) NOT NULL COMMENT '文件对象信息',
  `f_summary_type` varchar(12) NOT NULL COMMENT '总结类型',
  `f_max_segments` tinyint NOT NULL COMMENT '最大分段数',
  `f_max_segments_type` varchar(12) NOT NULL COMMENT '分段类型',
  `f_need_abstract` tinyint NOT NULL COMMENT '是否需要摘要',
  `f_abstract_type` varchar(12) NOT NULL COMMENT '摘要总结方式',
  `f_callback` varchar(1024) NOT NULL COMMENT '回调地址',
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` bigint DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
) ENGINE=InnoDB COMMENT '音频转换任务记录表';