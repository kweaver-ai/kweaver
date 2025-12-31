USE workflow;

-- ----------------------------
-- workflow.t_model definition
-- ----------------------------
CREATE TABLE IF NOT EXISTS `t_model` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_name` varchar(255) NOT NULL DEFAULT '' COMMENT '模型名称',
  `f_description` varchar(300) NOT NULL DEFAULT '' COMMENT '模型描述',
  `f_train_status` varchar(16) NOT NULL DEFAULT '' COMMENT '模型训练状态',
  `f_status` tinyint NOT NULL COMMENT '状态',
  `f_rule` text DEFAULT NULL COMMENT '数据标签',
  `f_userid` varchar(40) NOT NULL DEFAULT '' COMMENT '用户id',
  `f_type` tinyint NOT NULL DEFAULT -1 COMMENT '模型类型',
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` bigint DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`f_id`),
  KEY idx_t_model_f_name (f_name),
  KEY idx_t_model_f_userid_status (f_userid, f_status),
  KEY idx_t_model_f_status_type (f_status, f_type)
) ENGINE=InnoDB COMMENT '模型记录表';


-- ----------------------------
-- workflow.t_train_file definition
-- ----------------------------
CREATE TABLE IF NOT EXISTS `t_train_file` (
  `f_id` bigint unsigned NOT NULL COMMENT '主键id',
  `f_train_id` bigint unsigned NOT NULL COMMENT '训练记录id',
  `f_oss_id` varchar(36) DEFAULT '' COMMENT '应用存储的ossid',
  `f_key` varchar(36) DEFAULT '' COMMENT '训练文件对象存储key',
  `f_created_at` bigint DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`f_id`),
  KEY idx_t_train_file_f_train_id (f_train_id)
) ENGINE=InnoDB COMMENT '模型训练文件记录表';


