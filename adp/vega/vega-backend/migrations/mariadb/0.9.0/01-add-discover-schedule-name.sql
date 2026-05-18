-- Copyright The kweaver.ai Authors.
--
-- Licensed under the Apache License, Version 2.0.
-- See the LICENSE file in the project root for details.

USE kweaver;

ALTER TABLE t_discover_schedule ADD COLUMN IF NOT EXISTS f_name VARCHAR(255) NOT NULL DEFAULT '' COMMENT '调度名称';
ALTER TABLE t_discover_schedule ADD INDEX IF NOT EXISTS idx_name (f_name);
