USE workflow;

CREATE TABLE IF NOT EXISTS `t_alarm_rule` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_rule_id` bigint unsigned NOT NULL COMMENT '告警规则ID',
  `f_dag_id` bigint unsigned NOT NULL COMMENT '流程ID',
  `f_frequency` smallint unsigned NOT NULL COMMENT '频率',
  `f_threshold` mediumint unsigned NOT NULL COMMENT '阈值',
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_alarm_rule_rule_id` (`f_rule_id`)
) ENGINE=InnoDB COMMENT '告警规则';
  
CREATE TABLE IF NOT EXISTS `t_alarm_user` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_rule_id` bigint unsigned NOT NULL COMMENT '告警规则ID',
  `f_user_id` varchar(36) NOT NULL COMMENT '用户ID',
  `f_user_name` varchar(128) NOT NULL COMMENT '用户名称',
  `f_user_type` varchar(10) NOT NULL COMMENT '用户类型,取值: user,group',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_alarm_user_rule_id` (`f_rule_id`)
) ENGINE=InnoDB COMMENT '告警用户';

CREATE TABLE IF NOT EXISTS `t_automation_agent` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_name` varchar(128) NOT NULL DEFAULT '' COMMENT 'Agent 名称',
  `f_agent_id` varchar(64) NOT NULL DEFAULT '' COMMENT 'Agent ID',
  `f_version` varchar(32) NOT NULL DEFAULT '' COMMENT 'Agent 版本',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_automation_agent_agent_id` (`f_agent_id`),
  UNIQUE KEY `uk_t_automation_agent_name` (`f_name`)
) ENGINE=InnoDB COMMENT "Agent";
