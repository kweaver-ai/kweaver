
SET SEARCH_PATH TO workflow;


CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_sendback_message` (
  `f_id` VARCHAR(64) NOT NULL COMMENT '主键ID',
  `f_proc_inst_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '流程实例ID',
  `f_message_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息中心消息ID',
  `f_created_at` DATETIME NOT NULL COMMENT '创建时间',
  `f_updated_at` DATETIME NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_doc_audit_sendback_message_proc_inst_id` ON `t_wf_doc_audit_sendback_message` (f_proc_inst_id);


CREATE TABLE IF NOT EXISTS `t_wf_inbox` (
  `f_id` VARCHAR(50) NOT NULL COMMENT '主键ID',
  `f_topic` VARCHAR(128) NOT NULL COMMENT '消息topic',
  `f_message` LONGTEXT NOT NULL COMMENT '消息内容,json格式字符串',
  `f_create_time` DATETIME(0) NOT NULL COMMENT '消息创建时间',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_wf_inbox_f_create_time` ON `t_wf_inbox` (`f_create_time`);

