USE workflow;

CREATE TABLE  IF NOT EXISTS `t_automation_conf` (
  `f_key` char(32) NOT NULL,
  `f_value` char(255) NOT NULL,
  PRIMARY KEY (`f_key`)
) ENGINE=InnoDB COMMENT "自动化配置";