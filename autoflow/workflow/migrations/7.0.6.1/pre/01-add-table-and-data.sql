USE workflow;

CREATE TABLE IF NOT EXISTS `t_wf_doc_audit_sendback_message` (
  `f_id` varchar(64) NOT NULL COMMENT '主键ID',
  `f_proc_inst_id` varchar(64) NOT NULL DEFAULT '' COMMENT '流程实例ID',
  `f_message_id` varchar(64) NOT NULL DEFAULT '' COMMENT '消息中心消息ID',
  `f_created_at` datetime NOT NULL COMMENT '创建时间',
  `f_updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_wf_doc_audit_sendback_message_proc_inst_id` (f_proc_inst_id)
) ENGINE=InnoDB COMMENT='审核退回消息';

CREATE TABLE IF NOT EXISTS `t_wf_inbox` (
  `f_id` varchar(50) NOT NULL COMMENT '主键ID',
  `f_topic` varchar(128) NOT NULL COMMENT '消息topic',
  `f_message` longtext NOT NULL COMMENT '消息内容,json格式字符串',
  `f_create_time` datetime(0) NOT NULL COMMENT '消息创建时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_wf_inbox_f_create_time` (`f_create_time`) USING BTREE
) ENGINE=InnoDB COMMENT='inbox信息表';