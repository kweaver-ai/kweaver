USE workflow;

INSERT INTO `t_automation_conf` (f_key, f_value) SELECT 'process_template', 1 FROM DUAL WHERE NOT EXISTS(SELECT `f_key`, `f_value` FROM `t_automation_conf` WHERE `f_key`='process_template');
INSERT INTO `t_automation_conf` (f_key, f_value) SELECT 'ai_capabilities', 1 FROM DUAL WHERE NOT EXISTS(SELECT `f_key`, `f_value` FROM `t_automation_conf` WHERE `f_key`='ai_capabilities');

CREATE TABLE IF NOT EXISTS `t_automation_agent` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_name` varchar(128) NOT NULL DEFAULT '' COMMENT 'Agent 名称',
  `f_agent_id` varchar(64) NOT NULL DEFAULT '' COMMENT 'Agent ID',
  `f_version` varchar(32) NOT NULL DEFAULT '' COMMENT 'Agent 版本',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_automation_agent_agent_id` (`f_agent_id`),
  UNIQUE KEY `uk_t_automation_agent_name` (`f_name`)
) ENGINE=InnoDB COMMENT "Agent";
