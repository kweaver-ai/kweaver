SET SCHEMA adp;

-- 迁移 t_cron_job 表数据
INSERT INTO "adp"."t_cron_job" (
    "f_job_id", 
    "f_job_name", 
    "f_job_cron_time", 
    "f_job_type", 
    "f_job_context", 
    "f_tenant_id", 
    "f_enabled", 
    "f_remarks",
    "f_create_time", 
    "f_update_time"
)
SELECT 
    "f_job_id", 
    "f_job_name", 
    "f_job_cron_time", 
    "f_job_type", 
    "f_job_context", 
    "f_tenant_id", 
    "f_enabled", 
    "f_remarks",
    "f_create_time", 
    "f_update_time"
FROM "ecron"."t_cron_job" w
WHERE NOT EXISTS (
    SELECT 1 
    FROM "adp"."t_cron_job" a 
    WHERE a."f_job_id" = w."f_job_id"
)
ORDER BY w."f_key_id" ASC;

-- 迁移 t_cron_job_status 表数据
INSERT INTO "adp"."t_cron_job_status" (
    "f_execute_id", 
    "f_job_id", 
    "f_job_type", 
    "f_job_name",
    "f_job_status", 
    "f_begin_time", 
    "f_end_time", 
    "f_executor",
    "f_execute_times", 
    "f_ext_info"
)
SELECT 
    "f_execute_id", 
    "f_job_id", 
    "f_job_type", 
    "f_job_name",
    "f_job_status", 
    "f_begin_time", 
    "f_end_time", 
    "f_executor",
    "f_execute_times", 
    "f_ext_info"
FROM "ecron"."t_cron_job_status" w
WHERE NOT EXISTS (
    SELECT 1 
    FROM "adp"."t_cron_job_status" a 
    WHERE a."f_execute_id" = w."f_execute_id"
)
ORDER BY w."f_key_id" ASC;