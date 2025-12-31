
SET SEARCH_PATH TO workflow;


CREATE TABLE IF NOT EXISTS `t_alarm_rule` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_rule_id` BIGINT UNSIGNED NOT NULL COMMENT '告警规则ID',
  `f_dag_id` BIGINT UNSIGNED NOT NULL COMMENT '流程ID',
  `f_frequency` smallint UNSIGNED NOT NULL COMMENT '频率',
  `f_threshold` mediumint UNSIGNED NOT NULL COMMENT '阈值',
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


CREATE TABLE IF NOT EXISTS `t_automation_agent` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_name` VARCHAR(128) NOT NULL DEFAULT '' COMMENT 'Agent 名称',
  `f_agent_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'Agent ID',
  `f_version` VARCHAR(32) NOT NULL DEFAULT '' COMMENT 'Agent 版本',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `idx_t_automation_agent_uk_t_automation_agent_name` (`f_name`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_agent_agent_id` ON `t_automation_agent` (`f_agent_id`);

