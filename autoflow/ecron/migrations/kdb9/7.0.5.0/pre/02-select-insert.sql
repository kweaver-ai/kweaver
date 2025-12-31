SET SEARCH_PATH TO adp;

-- 迁移t_cron_job表数据
INSERT INTO adp.t_cron_job (
    f_key_id,
    f_job_id,
    f_job_name,
    f_job_cron_time,
    f_job_type,
    f_job_context,
    f_tenant_id,
    f_enabled,
    f_remarks,
    f_create_time,
    f_update_time
)
SELECT 
    f_key_id,
    f_job_id,
    f_job_name,
    f_job_cron_time,
    f_job_type,
    f_job_context,
    f_tenant_id,
    f_enabled,
    f_remarks,
    f_create_time,
    f_update_time
FROM ecron.t_cron_job ecj
WHERE NOT EXISTS (
    SELECT 1 
    FROM adp.t_cron_job adj 
    WHERE adj.f_job_id = ecj.f_job_id
);

-- 迁移t_cron_job_status表数据
INSERT INTO adp.t_cron_job_status (
    f_key_id,
    f_execute_id,
    f_job_id,
    f_job_type,
    f_job_name,
    f_job_status,
    f_begin_time,
    f_end_time,
    f_executor,
    f_execute_times,
    f_ext_info
)
SELECT 
    f_key_id,
    f_execute_id,
    f_job_id,
    f_job_type,
    f_job_name,
    f_job_status,
    f_begin_time,
    f_end_time,
    f_executor,
    f_execute_times,
    f_ext_info
FROM ecron.t_cron_job_status ecjs
WHERE NOT EXISTS (
    SELECT 1 
    FROM adp.t_cron_job_status adjs 
    WHERE adjs.f_execute_id = ecjs.f_execute_id
);