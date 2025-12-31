USE workflow;

CREATE TABLE IF NOT EXISTS `t_task_cache_0` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_1` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_2` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_3` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_4` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_5` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_6` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_7` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_8` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_9` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_a` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_b` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_c` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_d` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_e` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';

CREATE TABLE IF NOT EXISTS `t_task_cache_f` (
  `f_id` BIGINT UNSIGNED NOT NULL COMMENT '主键id',
  `f_hash` CHAR(40) NOT NULL DEFAULT '' COMMENT '任务hash',
  `f_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '任务类型',
  `f_status` TINYINT(4) NOT NULL DEFAULT '0' COMMENT '任务状态(1 处理中, 2 成功, 3 失败)',
  `f_oss_id` CHAR(36) NOT NULL DEFAULT '' COMMENT '对象存储ID',
  `f_oss_key` VARCHAR(255) NOT NULL DEFAULT '' COMMENT 'OSS存储key',
  `f_ext` CHAR(20) NOT NULL DEFAULT '' COMMENT '副文档后缀名',
  `f_size` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '副文档大小',
  `f_err_msg` TEXT NULL DEFAULT NULL COMMENT '错误信息',
  `f_create_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  `f_modify_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  `f_expire_time` BIGINT(20) NOT NULL DEFAULT '0' COMMENT '过期时间',
  PRIMARY KEY (`f_id`),
  UNIQUE KEY `uk_hash` (`f_hash`),
  KEY `idx_expire_time` (`f_expire_time`)
) ENGINE=InnoDB COMMENT 'ContentPipeline 任务';
