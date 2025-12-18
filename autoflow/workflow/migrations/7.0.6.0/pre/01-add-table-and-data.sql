USE workflow;

CREATE TABLE IF NOT EXISTS `t_wf_doc_share_strategy_config` (
  `f_id` varchar(40) NOT NULL COMMENT '主键id',
  `f_proc_def_id` varchar(300) NOT NULL COMMENT '流程定义ID',
  `f_act_def_id` varchar(100) NOT NULL COMMENT '流程环节ID',
  `f_name` varchar(64) NOT NULL COMMENT '字段名称',
  `f_value` varchar(64) NOT NULL COMMENT '字段值',
  PRIMARY KEY (`f_id`),
  KEY idx_t_wf_doc_share_strategy_config_proc_act_def_id (f_proc_def_id, f_act_def_id),
  KEY idx_t_wf_doc_share_strategy_config_proc_def_id_name (f_proc_def_id, f_name),
  KEY idx_t_wf_doc_share_strategy_config_name (f_name)
) ENGINE=InnoDB COMMENT='审核流程高级配置表';