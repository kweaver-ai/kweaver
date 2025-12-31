# post依赖pre阶段，需要一个空文件才能保证post阶段执行成功
USE workflow;

CREATE TABLE IF NOT EXISTS `t_wf_outbox` (
  `f_id` varchar(50) NOT NULL COMMENT '主键ID',
  `f_topic` varchar(128) NOT NULL COMMENT '消息topic',
  `f_message` longtext NOT NULL COMMENT '消息内容,json格式字符串',
  `f_create_time` datetime(0) NOT NULL COMMENT '消息创建时间',
  PRIMARY KEY (`f_id`),
  KEY `idx_t_wf_outbox_f_create_time` (`f_create_time`) USING BTREE
) ENGINE=InnoDB COMMENT='outbox信息表';