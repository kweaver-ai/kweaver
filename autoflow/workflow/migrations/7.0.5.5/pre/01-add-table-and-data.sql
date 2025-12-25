USE workflow;

CREATE TABLE IF NOT EXISTS `t_wf_internal_group` (
  `f_id` varchar(40) NOT NULL COMMENT '主键id',
  `f_apply_id` varchar(50) NOT NULL COMMENT '申请id',
  `f_apply_user_id` varchar(40) NOT NULL COMMENT '申请人id',
  `f_group_id` varchar(40) NOT NULL COMMENT '内部组id',
  `f_expired_at` bigint DEFAULT -1 COMMENT '创内部组过期时间',
  `f_created_at` bigint DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`f_id`),
  KEY idx_t_wf_internal_group_apply_id (f_apply_id),
  KEY idx_t_wf_internal_group_expired_at (f_expired_at)
) ENGINE=InnoDB COMMENT='内部组账号信息';

CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message (
  id VARCHAR(64) NOT NULL COMMENT '主键ID',
  proc_inst_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '流程实例ID',
  chan VARCHAR(255) NOT NULL DEFAULT '' COMMENT '消息 channel',
  payload MEDIUMTEXT NULL DEFAULT NULL COMMENT '消息 payload',
  ext_message_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息中心消息ID',
  PRIMARY KEY (id),
  KEY idx_t_wf_doc_audit_message_proc_inst_id (proc_inst_id)
) ENGINE=InnoDB COMMENT='审核消息';

CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message_receiver (
  id VARCHAR(64) NOT NULL COMMENT '主键ID',
  message_id VARCHAR(64) NOT NULL DEFAULT '' COMMENT '消息ID',
  receiver_id  VARCHAR(255) NOT NULL DEFAULT '' COMMENT '接收者ID',
  handler_id VARCHAR(255) NOT NULL DEFAULT '' COMMENT '处理者ID',
  audit_status VARCHAR(10) NOT NULL DEFAULT '' COMMENT '处理状态',
  PRIMARY KEY (id),
  KEY idx_t_wf_doc_audit_message_receiver_message_id (message_id),
  KEY idx_t_wf_doc_audit_message_receiver_receiver_id (receiver_id),
  KEY idx_t_wf_doc_audit_message_receiver_handler_id (handler_id)
) ENGINE=InnoDB COMMENT='审核消息接收者';