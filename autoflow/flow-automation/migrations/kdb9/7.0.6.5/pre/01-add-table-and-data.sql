
SET SEARCH_PATH TO workflow;


CREATE TABLE IF NOT EXISTS `t_automation_dag_instance_ext_data` (
  `f_id` VARCHAR(64) NOT NULL COMMENT '主键id',
  `f_created_at` BIGINT DEFAULT NULL COMMENT '创建时间',
  `f_updated_at` BIGINT DEFAULT NULL COMMENT '更新时间',
  `f_dag_id` VARCHAR(64) COMMENT 'DAG id',
  `f_dag_ins_id` VARCHAR(64) COMMENT 'DAG实例id',
  `f_field` VARCHAR(64) NOT NULL DEFAULT '' COMMENT '字段名称',
  `f_oss_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'OSS存储id',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_size` BIGINT UNSIGNED DEFAULT NULL COMMENT '文件大小',
  `f_removed` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否删除(1:未删除,0:已删除)',
  PRIMARY KEY (`f_id`)
);

CREATE INDEX IF NOT EXISTS `idx_t_automation_dag_instance_ext_data_dag_ins_id` ON `t_automation_dag_instance_ext_data` (`f_dag_ins_id`);

