-- Copyright The kweaver.ai Authors.
--
-- Licensed under the Apache License, Version 2.0.
-- See the LICENSE file in the project root for details.

SET SCHEMA kweaver;

ALTER TABLE t_discover_schedule ADD COLUMN IF NOT EXISTS f_name VARCHAR(255 CHAR) NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_t_discover_schedule_name ON t_discover_schedule(f_name);
