SET SCHEMA workflow;

CREATE TABLE IF NOT EXISTS "t_wf_activity_info_config"  (
  "activity_def_id" VARCHAR(100 CHAR) NOT NULL,
  "activity_def_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "process_def_id" VARCHAR(100 CHAR) NOT NULL,
  "process_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "activity_page_url" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "activity_page_info" text NULL,
  "activity_operation_roleid" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "jump_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "activity_status_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "activity_order" decimal(10, 0) NULL DEFAULT NULL,
  "activity_limit_time" decimal(10, 0) NULL DEFAULT NULL,
  "idea_display_area" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "is_show_idea" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "activity_def_child_type" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "activity_def_deal_type" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "activity_def_type" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "is_start_usertask" VARCHAR(4 CHAR) NULL DEFAULT NULL,
  "c_protocl" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "m_protocl" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "m_url" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "other_sys_deal_status" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("activity_def_id", "process_def_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_activity_rule"  (
  "rule_id" VARCHAR(50 CHAR) NOT NULL,
  "rule_name" VARCHAR(250 CHAR) NOT NULL,
  "proc_def_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "source_act_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "target_act_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "rule_script" text NOT NULL,
  "rule_priority" decimal(10, 0) NULL DEFAULT NULL,
  "rule_type" VARCHAR(5 CHAR) NULL DEFAULT NULL,
  "tenant_id" VARCHAR(255 CHAR) NOT NULL,
  "rule_remark" VARCHAR(2000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("rule_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_application"  (
  "app_id" VARCHAR(50 CHAR) NOT NULL,
  "app_name" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "app_type" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "app_access_url" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "app_create_time" datetime(0) NULL DEFAULT NULL,
  "app_update_time" datetime(0) NULL DEFAULT NULL,
  "app_creator_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "app_updator_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "app_status" VARCHAR(2 CHAR) NULL DEFAULT NULL,
  "app_desc" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "app_provider" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "app_linkman" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "app_phone" VARCHAR(30 CHAR) NULL DEFAULT NULL,
  "app_unitework_check_url" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "app_sort" decimal(10, 0) NULL DEFAULT NULL,
  "app_shortname" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("app_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_application_user"  (
  "app_id" VARCHAR(50 CHAR) NOT NULL,
  "user_id" VARCHAR(50 CHAR) NOT NULL,
  "remark" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("app_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_dict"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "dict_code" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "dict_parent_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "dict_name" text NULL,
  "sort" decimal(10, 0) NULL DEFAULT NULL,
  "status" VARCHAR(2 CHAR) NULL DEFAULT NULL,
  "creator_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "create_date" datetime(0) NULL DEFAULT NULL,
  "updator_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "update_date" datetime(0) NULL DEFAULT NULL,
  "app_id" VARCHAR(50 CHAR) NOT NULL,
  "dict_value" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "t_wf_doc_audit_apply"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "biz_id" VARCHAR(50 CHAR) NOT NULL,
  "doc_id" text NULL,
  "doc_path" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "doc_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "csf_level" INT NULL DEFAULT NULL,
  "biz_type" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "apply_type" VARCHAR(100 CHAR) NOT NULL,
  "apply_detail" text NOT NULL,
  "proc_def_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "proc_inst_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "audit_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "auditor" text NULL,
  "apply_user_id" VARCHAR(50 CHAR) NOT NULL,
  "apply_user_name" VARCHAR(150 CHAR) NULL DEFAULT NULL,
  "apply_time" datetime(0) NOT NULL,
  "doc_names" VARCHAR(2000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_apply_idx_proc_inst_id" ON "t_wf_doc_audit_apply"("proc_inst_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_apply_idx_apply_user_id" ON "t_wf_doc_audit_apply"("apply_user_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_apply_idx_biz_id" ON "t_wf_doc_audit_apply"("biz_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_apply_idx_biz_type" ON "t_wf_doc_audit_apply"("biz_type");

CREATE TABLE IF NOT EXISTS "t_wf_doc_audit_detail"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "apply_id" VARCHAR(50 CHAR) NOT NULL,
  "doc_id" text NOT NULL,
  "doc_path" VARCHAR(1000 CHAR) NOT NULL,
  "doc_type" VARCHAR(10 CHAR) NOT NULL,
  "csf_level" INT NULL DEFAULT NULL,
  "doc_name" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_detail_idx_apply_id" ON "t_wf_doc_audit_detail"("apply_id");

CREATE TABLE IF NOT EXISTS "t_wf_doc_audit_history"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "biz_id" VARCHAR(50 CHAR) NOT NULL,
  "doc_id" text NULL,
  "doc_path" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "doc_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "csf_level" INT NULL DEFAULT NULL,
  "biz_type" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "apply_type" VARCHAR(100 CHAR) NOT NULL,
  "apply_detail" text NOT NULL,
  "proc_def_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "proc_inst_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "apply_user_id" VARCHAR(50 CHAR) NOT NULL,
  "apply_user_name" VARCHAR(150 CHAR) NULL DEFAULT NULL,
  "apply_time" datetime(0) NOT NULL,
  "audit_status" INT NOT NULL,
  "audit_result" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "audit_msg" VARCHAR(2400 CHAR) NULL DEFAULT NULL,
  "audit_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "auditor" text NULL,
  "last_update_time" datetime(0) NULL DEFAULT NULL,
  "doc_names" VARCHAR(2000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_history_idx_proc_inst_id" ON "t_wf_doc_audit_history"("proc_inst_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_history_idx_biz_id" ON "t_wf_doc_audit_history"("biz_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_audit_history_idx_apply_user_audit_update" ON "t_wf_doc_audit_history"("apply_user_id", "audit_status", "biz_type", "last_update_time");

CREATE TABLE IF NOT EXISTS "t_wf_doc_share_strategy"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "doc_id" VARCHAR(200 CHAR) NULL DEFAULT NULL,
  "doc_name" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "doc_type" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "audit_model" VARCHAR(100 CHAR) NOT NULL,
  "proc_def_id" VARCHAR(300 CHAR) NOT NULL,
  "proc_def_name" VARCHAR(300 CHAR) NOT NULL,
  "act_def_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "act_def_name" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "create_user_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_user_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_time" datetime(0) NOT NULL,
  "strategy_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "rule_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "rule_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "level_type" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "no_auditor_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "repeat_audit_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "own_auditor_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "countersign_switch" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "countersign_count" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "countersign_auditors" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "transfer_switch" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "transfer_count" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "perm_config" VARCHAR(64 CHAR) NOT NULL DEFAULT '',
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_doc_share_strategy_idx_proc_def_id" ON "t_wf_doc_share_strategy"("proc_def_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_share_strategy_idx_act_def_id" ON "t_wf_doc_share_strategy"("act_def_id");

CREATE TABLE IF NOT EXISTS "t_wf_doc_share_strategy_auditor"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "user_id" VARCHAR(300 CHAR) NOT NULL,
  "user_code" VARCHAR(300 CHAR) NOT NULL,
  "user_name" VARCHAR(300 CHAR) NOT NULL,
  "user_dept_id" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "user_dept_name" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "audit_strategy_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "audit_sort" INT NULL DEFAULT NULL,
  "create_user_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_user_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_time" datetime(0) NOT NULL,
  "org_type" VARCHAR(32 CHAR) NOT NULL DEFAULT '',
    CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_doc_share_strategy_auditor_idx_audit_strategy_id" ON "t_wf_doc_share_strategy_auditor"("audit_strategy_id");

CREATE INDEX IF NOT EXISTS "t_wf_doc_share_strategy_auditor_idx_user_id" ON "t_wf_doc_share_strategy_auditor"("user_id");

CREATE TABLE IF NOT EXISTS "t_wf_evt_log"  (
  "log_nr_" BIGINT NOT NULL IDENTITY(1, 1),
  "type_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "time_stamp_" timestamp(3) NOT NULL DEFAULT current_timestamp(3),
  "user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "data_" blob NULL,
  "lock_owner_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "lock_time_" timestamp(0) NULL DEFAULT NULL,
  "is_processed_" TINYINT NULL DEFAULT 0,
  CLUSTER PRIMARY KEY ("log_nr_")
);

CREATE TABLE IF NOT EXISTS "t_wf_free_audit"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "process_def_key" VARCHAR(30 CHAR) NULL DEFAULT NULL,
  "department_id" VARCHAR(50 CHAR) NOT NULL,
  "department_name" VARCHAR(600 CHAR) NOT NULL,
  "create_user_id" VARCHAR(50 CHAR) NOT NULL,
  "create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "t_wf_free_audit_idx_process_def_key" ON "t_wf_free_audit"("process_def_key");

CREATE TABLE IF NOT EXISTS "t_wf_ge_bytearray"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "deployment_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "bytes_" blob NULL,
  "generated_" TINYINT NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_ge_bytearray_idx_deployment_id" ON "t_wf_ge_bytearray"("deployment_id_");

CREATE TABLE IF NOT EXISTS "t_wf_ge_property"  (
  "name_" VARCHAR(64 CHAR) NOT NULL,
  "value_" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "rev_" INT NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("name_")
);

CREATE TABLE IF NOT EXISTS "t_wf_hi_actinst"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "act_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "call_proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "act_name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "act_type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "assignee_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "start_time_" datetime(0) NULL DEFAULT NULL,
  "end_time_" datetime(0) NULL DEFAULT NULL,
  "duration_" BIGINT NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "proc_title" VARCHAR(300 CHAR) NULL DEFAULT NULL,
  "pre_act_id" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "pre_act_name" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "pre_act_inst_id" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "create_time_" timestamp(0) NULL DEFAULT NULL,
  "last_updated_time_" timestamp(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_hi_actinst_idx_start_time" ON "t_wf_hi_actinst"("start_time_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_actinst_idx_end_time" ON "t_wf_hi_actinst"("end_time_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_actinst_idx_proc_inst_act_id" ON "t_wf_hi_actinst"("proc_inst_id_", "act_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_actinst_idx_execution_act_id" ON "t_wf_hi_actinst"("execution_id_", "act_id_");

CREATE TABLE IF NOT EXISTS "t_wf_hi_attachment"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "description_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "url_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "content_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "time_" datetime(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE TABLE IF NOT EXISTS "t_wf_hi_comment"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "time_" datetime(0) NULL DEFAULT NULL,
  "user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "action_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "message_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "full_msg_" blob NULL,
  "display_area" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "top_proc_inst_id_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE TABLE IF NOT EXISTS "t_wf_hi_detail"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "act_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "var_type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "time_" datetime(0) NULL DEFAULT NULL,
  "bytearray_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "double_" double NULL DEFAULT NULL,
  "long_" BIGINT NULL DEFAULT NULL,
  "text_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "text2_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_hi_detail_idx_proc_inst_id" ON "t_wf_hi_detail"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_detail_idx_act_inst_id" ON "t_wf_hi_detail"("act_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_detail_idx_time" ON "t_wf_hi_detail"("time_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_detail_idx_name" ON "t_wf_hi_detail"("name_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_detail_idx_task_id" ON "t_wf_hi_detail"("task_id_");

CREATE TABLE IF NOT EXISTS "t_wf_hi_identitylink"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "group_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_hi_identitylink_idx_user_id" ON "t_wf_hi_identitylink"("user_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_identitylink_idx_task_id" ON "t_wf_hi_identitylink"("task_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_identitylink_idx_proc_inst_id" ON "t_wf_hi_identitylink"("proc_inst_id_");

CREATE TABLE IF NOT EXISTS "t_wf_hi_procinst"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "business_key_" VARCHAR(32767 CHAR) NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "start_time_" datetime(0) NULL DEFAULT NULL,
  "end_time_" datetime(0) NULL DEFAULT NULL,
  "duration_" BIGINT NULL DEFAULT NULL,
  "start_user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "start_act_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "end_act_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "super_process_instance_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "delete_reason_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_state" INT NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "start_user_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "starter_org_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "starter_org_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "starter" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "top_process_instance_id_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE UNIQUE INDEX IF NOT EXISTS "t_wf_hi_procinst_uk_proc_inst_id" ON "t_wf_hi_procinst"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_procinst_idx_end_time" ON "t_wf_hi_procinst"("end_time_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_procinst_idx_business_key" ON "t_wf_hi_procinst"("business_key_",50);

CREATE TABLE IF NOT EXISTS "t_wf_hi_taskinst"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "task_def_key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "parent_task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "description_" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "owner_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "assignee_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "start_time_" datetime(0) NULL DEFAULT NULL,
  "claim_time_" datetime(0) NULL DEFAULT NULL,
  "end_time_" datetime(0) NULL DEFAULT NULL,
  "duration_" BIGINT NULL DEFAULT NULL,
  "delete_reason_" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "priority_" INT NULL DEFAULT NULL,
  "due_date_" datetime(0) NULL DEFAULT NULL,
  "form_key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "category_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_title" VARCHAR(2000 CHAR) NULL DEFAULT NULL,
  "sender" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_def_key" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_id" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_def_name" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "action_type" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "top_execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "sender_org_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "assignee_org_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "status" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "biz_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "doc_id" text NULL,
  "doc_name" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "doc_path" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "addition" text NULL,
  "message_id" VARCHAR(64 CHAR) NOT NULL DEFAULT '',
    CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_hi_taskinst_idx_proc_inst_id" ON "t_wf_hi_taskinst"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_taskinst_idx_assignee" ON "t_wf_hi_taskinst"("assignee_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_taskinst_idx_end_time" ON "t_wf_hi_taskinst"("end_time_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_taskinst_idx_assignee_delete_reason" ON "t_wf_hi_taskinst"("assignee_", "delete_reason_");

CREATE TABLE IF NOT EXISTS "t_wf_hi_varinst"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "var_type_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "bytearray_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "double_" double NULL DEFAULT NULL,
  "long_" BIGINT NULL DEFAULT NULL,
  "text_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "text2_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "create_time_" datetime(0) NULL DEFAULT NULL,
  "last_updated_time_" datetime(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_hi_varinst_idx_proc_inst_id" ON "t_wf_hi_varinst"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_varinst_idx_name_var_type" ON "t_wf_hi_varinst"("name_", "var_type_");

CREATE INDEX IF NOT EXISTS "t_wf_hi_varinst_idx_task_id" ON "t_wf_hi_varinst"("task_id_");

CREATE TABLE IF NOT EXISTS "t_wf_org"  (
  "org_id" VARCHAR(50 CHAR) NOT NULL,
  "org_name" VARCHAR(200 CHAR) NOT NULL,
  "org_full_name" VARCHAR(500 CHAR) NOT NULL,
  "org_full_path_name" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "org_full_path_id" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "org_parent_id" VARCHAR(50 CHAR) NOT NULL,
  "org_type" VARCHAR(10 CHAR) NOT NULL,
  "org_level" INT NOT NULL,
  "org_area_type" VARCHAR(10 CHAR) NOT NULL,
  "org_sort" INT NULL DEFAULT NULL,
  "org_work_phone" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "org_work_address" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "org_principal" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "org_status" VARCHAR(10 CHAR) NOT NULL,
  "org_create_time" date NULL DEFAULT NULL,
  "remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "fund_code" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "fund_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "company_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "dept_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "dept_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "company_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "org_branch_leader" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("org_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_procdef_info"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "info_json_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_INFO_JSON_BA" FOREIGN KEY ("info_json_id_") REFERENCES "t_wf_ge_bytearray" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "t_wf_procdef_info_uk_proc_def_id" ON "t_wf_procdef_info"("proc_def_id_");

CREATE INDEX IF NOT EXISTS "t_wf_procdef_info_idx_info_json_id" ON "t_wf_procdef_info"("info_json_id_");

CREATE TABLE IF NOT EXISTS "t_wf_process_error_log"  (
  "pelog_id" VARCHAR(36 CHAR) NOT NULL,
  "process_instance_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "process_title" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "creator" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "action_type" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "process_msg" text NULL,
  "pelog_create_time" datetime(0) NULL DEFAULT NULL,
  "receivers" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "process_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "app_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "process_log_level" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "retry_status" VARCHAR(2 CHAR) NULL DEFAULT NULL,
  "error_msg" text NULL,
  "user_time" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("pelog_id")
);

CREATE INDEX IF NOT EXISTS "t_wf_process_error_log_idx_app_log_pelog" ON "t_wf_process_error_log"("app_id", "process_log_level", "pelog_create_time");

CREATE TABLE IF NOT EXISTS "t_wf_process_info_config"  (
  "process_def_id" VARCHAR(100 CHAR) NOT NULL,
  "process_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "process_def_key" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "process_type_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "process_type_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "process_page_url" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "process_page_info" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "process_start_auth" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "process_start_isshow" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "remark" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "page_isshow_select_usertree" decimal(10, 0) NULL DEFAULT NULL,
  "process_handler_class_path" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "process_start_order" decimal(10, 0) NULL DEFAULT NULL,
  "deployment_id" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "create_time" datetime(0) NULL DEFAULT NULL,
  "last_update_time" datetime(0) NULL DEFAULT NULL,
  "create_user" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "create_user_name" VARCHAR(150 CHAR) NULL DEFAULT NULL,
  "last_update_user" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "tenant_id" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "process_mgr_state" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "process_model_sync_state" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "process_mgr_isshow" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "aris_code" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "c_protocl" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "m_protocl" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "m_url" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "other_sys_deal_status" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "template" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("process_def_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_re_deployment"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "category_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "deploy_time_" timestamp(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE TABLE IF NOT EXISTS "t_wf_re_model"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "category_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "create_time_" timestamp(0) NULL DEFAULT NULL,
  "last_update_time_" timestamp(0) NULL DEFAULT NULL,
  "version_" INT NULL DEFAULT NULL,
  "meta_info_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "deployment_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "editor_source_value_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "editor_source_extra_value_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "model_state" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_MODEL_DEPLOYMENT" FOREIGN KEY ("deployment_id_") REFERENCES "t_wf_re_deployment" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_MODEL_SOURCE" FOREIGN KEY ("editor_source_value_id_") REFERENCES "t_wf_ge_bytearray" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_MODEL_SOURCE_EXTRA" FOREIGN KEY ("editor_source_extra_value_id_") REFERENCES "t_wf_ge_bytearray" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_re_model_idx_editor_source_value_id" ON "t_wf_re_model"("editor_source_value_id_");

CREATE INDEX IF NOT EXISTS "t_wf_re_model_idx_editor_source_extra_value_id" ON "t_wf_re_model"("editor_source_extra_value_id_");

CREATE INDEX IF NOT EXISTS "t_wf_re_model_idx_deployment_id" ON "t_wf_re_model"("deployment_id_");

CREATE TABLE IF NOT EXISTS "t_wf_re_procdef"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "category_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "version_" INT NOT NULL,
  "deployment_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "resource_name_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "dgrm_resource_name_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "description_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "has_start_form_key_" TINYINT NULL DEFAULT NULL,
  "has_graphical_notation_" TINYINT NULL DEFAULT NULL,
  "suspension_state_" INT NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "org_id_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE UNIQUE INDEX IF NOT EXISTS "t_wf_re_procdef_uk_key_version_tenant_id" ON "t_wf_re_procdef"("key_", "version_", "tenant_id_");

CREATE TABLE IF NOT EXISTS "t_wf_role"  (
  "role_id" VARCHAR(50 CHAR) NOT NULL,
  "role_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "role_type" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "role_sort" INT NULL DEFAULT NULL,
  "role_org_id" INT NULL DEFAULT NULL,
  "role_app_id" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "role_status" VARCHAR(10 CHAR) NOT NULL,
  "role_create_time" datetime(0) NULL DEFAULT NULL,
  "role_creator" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "template" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("role_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_ru_event_subscr"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "event_type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "event_name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "activity_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "configuration_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "created_" timestamp(0) NOT NULL DEFAULT current_timestamp(0),
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_")
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_event_subscr_idx_configuration" ON "t_wf_ru_event_subscr"("configuration_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_event_subscr_idx_execution_id" ON "t_wf_ru_event_subscr"("execution_id_");

CREATE TABLE IF NOT EXISTS "t_wf_ru_execution"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "business_key_" VARCHAR(32767 CHAR) NULL,
  "parent_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "super_exec_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "act_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "is_active_" TINYINT NULL DEFAULT NULL,
  "is_concurrent_" TINYINT NULL DEFAULT NULL,
  "is_scope_" TINYINT NULL DEFAULT NULL,
  "is_event_scope_" TINYINT NULL DEFAULT NULL,
  "suspension_state_" INT NULL DEFAULT NULL,
  "cached_ent_state_" INT NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "lock_time_" timestamp(0) NULL DEFAULT NULL,
  "top_process_instance_id_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_EXE_PARENT" FOREIGN KEY ("parent_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_EXE_PROCDEF" FOREIGN KEY ("proc_def_id_") REFERENCES "t_wf_re_procdef" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_EXE_PROCINST" FOREIGN KEY ("proc_inst_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ACT_FK_EXE_SUPER" FOREIGN KEY ("super_exec_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_execution_idx_proc_inst_id" ON "t_wf_ru_execution"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_execution_idx_parent_id" ON "t_wf_ru_execution"("parent_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_execution_idx_super_exec" ON "t_wf_ru_execution"("super_exec_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_execution_idx_proc_def_id" ON "t_wf_ru_execution"("proc_def_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_execution_idx_business_key" ON "t_wf_ru_execution"("business_key_",50);

CREATE TABLE IF NOT EXISTS "t_wf_ru_identitylink"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "group_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "user_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "org_id_" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_ATHRZ_PROCEDEF" FOREIGN KEY ("proc_def_id_") REFERENCES "t_wf_re_procdef" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_IDL_PROCINST" FOREIGN KEY ("proc_inst_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_identitylink_idx_user_id" ON "t_wf_ru_identitylink"("user_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_identitylink_idx_group_id" ON "t_wf_ru_identitylink"("group_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_identitylink_idx_proc_def_id" ON "t_wf_ru_identitylink"("proc_def_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_identitylink_idx_task_id" ON "t_wf_ru_identitylink"("task_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_identitylink_idx_proc_inst_id" ON "t_wf_ru_identitylink"("proc_inst_id_");

CREATE TABLE IF NOT EXISTS "t_wf_ru_job"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "lock_exp_time_" timestamp(0) NULL DEFAULT NULL,
  "lock_owner_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "exclusive_" TINYINT NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "process_instance_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "retries_" INT NULL DEFAULT NULL,
  "exception_stack_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "exception_msg_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "duedate_" timestamp(0) NULL DEFAULT NULL,
  "repeat_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "handler_type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "handler_cfg_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_JOB_EXCEPTION" FOREIGN KEY ("exception_stack_id_") REFERENCES "t_wf_ge_bytearray" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_job_idx_exception_stack_id" ON "t_wf_ru_job"("exception_stack_id_");

CREATE TABLE IF NOT EXISTS "t_wf_ru_task"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_def_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "parent_task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "description_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "task_def_key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "owner_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "assignee_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "delegation_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "priority_" INT NULL DEFAULT NULL,
  "create_time_" timestamp(0) NULL DEFAULT NULL,
  "due_date_" datetime(0) NULL DEFAULT NULL,
  "category_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "suspension_state_" INT NULL DEFAULT NULL,
  "tenant_id_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "form_key_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "proc_title" VARCHAR(2000 CHAR) NULL DEFAULT NULL,
  "sender" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_def_key" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_id" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "pre_task_def_name" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "action_type" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "sender_org_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "assignee_org_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "proc_def_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "biz_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "doc_id" text NULL,
  "doc_name" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "doc_path" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "addition" text NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_TASK_EXE" FOREIGN KEY ("execution_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_TASK_PROCDEF" FOREIGN KEY ("proc_def_id_") REFERENCES "t_wf_re_procdef" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_TASK_PROCINST" FOREIGN KEY ("proc_inst_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_parent_task_id" ON "t_wf_ru_task"("parent_task_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_execution_id" ON "t_wf_ru_task"("execution_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_proc_inst_id" ON "t_wf_ru_task"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_proc_def_id" ON "t_wf_ru_task"("proc_def_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_assignee" ON "t_wf_ru_task"("assignee_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_task_idx_assignee_create_time" ON "t_wf_ru_task"("assignee_", "create_time_");

CREATE TABLE IF NOT EXISTS "t_wf_ru_variable"  (
  "id_" VARCHAR(64 CHAR) NOT NULL,
  "rev_" INT NULL DEFAULT NULL,
  "type_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "name_" VARCHAR(255 CHAR) NULL DEFAULT NULL,
  "execution_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "proc_inst_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "task_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "bytearray_id_" VARCHAR(64 CHAR) NULL DEFAULT NULL,
  "double_" double NULL DEFAULT NULL,
  "long_" BIGINT NULL DEFAULT NULL,
  "text_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  "text2_" VARCHAR(4000 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("id_"),
  CONSTRAINT "ACT_FK_VAR_BYTEARRAY" FOREIGN KEY ("bytearray_id_") REFERENCES "t_wf_ge_bytearray" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_VAR_EXE" FOREIGN KEY ("execution_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT "ACT_FK_VAR_PROCINST" FOREIGN KEY ("proc_inst_id_") REFERENCES "t_wf_ru_execution" ("id_") ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE INDEX IF NOT EXISTS "t_wf_ru_variable_idx_task_id" ON "t_wf_ru_variable"("task_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_variable_idx_execution_id_" ON "t_wf_ru_variable"("execution_id_", "task_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_variable_idx_proc_inst_id" ON "t_wf_ru_variable"("proc_inst_id_");

CREATE INDEX IF NOT EXISTS "t_wf_ru_variable_idx_bytearray_id" ON "t_wf_ru_variable"("bytearray_id_");

CREATE TABLE IF NOT EXISTS "t_wf_sys_log"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "type" VARCHAR(10 CHAR) NOT NULL,
  "url" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "system_name" VARCHAR(20 CHAR) NULL DEFAULT NULL,
  "user_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "msg" VARCHAR(500 CHAR) NOT NULL,
  "ex_msg" text NULL,
  "create_time" datetime(0) NOT NULL DEFAULT current_timestamp(0),
  CLUSTER PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "t_wf_type"  (
  "type_id" VARCHAR(50 CHAR) NOT NULL,
  "type_name" VARCHAR(50 CHAR) NOT NULL,
  "type_parent_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "type_sort" decimal(10, 0) NULL DEFAULT NULL,
  "app_key" VARCHAR(50 CHAR) NOT NULL,
  "type_remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("type_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_user"  (
  "user_id" VARCHAR(50 CHAR) NOT NULL,
  "user_code" VARCHAR(50 CHAR) NOT NULL,
  "user_name" VARCHAR(50 CHAR) NOT NULL,
  "user_sex" VARCHAR(2 CHAR) NULL DEFAULT NULL,
  "user_age" INT NULL DEFAULT NULL,
  "company_id" VARCHAR(50 CHAR) NOT NULL,
  "org_id" VARCHAR(50 CHAR) NOT NULL,
  "user_mobile" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "user_mail" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "user_work_address" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "user_work_phone" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "user_home_addree" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "user_home_phone" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "position_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "plurality_position_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "title_id" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "plurality_title_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "user_type" VARCHAR(10 CHAR) NULL DEFAULT NULL,
  "user_status" VARCHAR(10 CHAR) NOT NULL,
  "user_sort" INT NULL DEFAULT NULL,
  "user_pwd" VARCHAR(20 CHAR) NULL DEFAULT '123456',
  "user_create_time" date NULL DEFAULT NULL,
  "user_update_time" timestamp(0) NOT NULL DEFAULT current_timestamp(0),
  "user_creator" VARCHAR(30 CHAR) NULL DEFAULT NULL,
  "remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "dept_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "company_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "dept_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "org_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_user2role"  (
  "role_id" VARCHAR(50 CHAR) NOT NULL,
  "user_id" VARCHAR(500 CHAR) NOT NULL,
  "remark" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "user_code" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "user_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "org_id" VARCHAR(50 CHAR) NOT NULL,
  "org_name" VARCHAR(500 CHAR) NULL DEFAULT NULL,
  "sort" INT NULL DEFAULT NULL,
  "create_user_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_user_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "create_time" datetime(0) NULL DEFAULT NULL,
  CLUSTER PRIMARY KEY ("role_id", "user_id", "org_id")
);

CREATE TABLE IF NOT EXISTS "t_wf_countersign_info"  (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "proc_inst_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "task_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "task_def_key" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "countersign_auditor" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "countersign_auditor_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "countersign_by" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "countersign_by_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "reason" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "batch" decimal(10, 0) NULL DEFAULT NULL,
  "create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "t_wf_transfer_info" (
  "id" VARCHAR(50 CHAR) NOT NULL,
  "proc_inst_id" VARCHAR(50 CHAR) NULL DEFAULT NULL,
  "task_id" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "task_def_key" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "transfer_auditor" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "transfer_auditor_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "transfer_by" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "transfer_by_name" VARCHAR(100 CHAR) NULL DEFAULT NULL,
  "reason" VARCHAR(1000 CHAR) NULL DEFAULT NULL,
  "batch" decimal(10,0) NULL DEFAULT NULL,
  "create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "t_wf_outbox" (
  "f_id" VARCHAR(50 CHAR) NOT NULL,
  "f_topic" VARCHAR(128 CHAR) NOT NULL,
  "f_message" text NOT NULL,
  "f_create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_outbox_idx_t_wf_outbox_f_create_time ON t_wf_outbox("f_create_time");

CREATE TABLE IF NOT EXISTS "t_wf_internal_group" (
  "f_id" VARCHAR(40 CHAR) NOT NULL,
  "f_apply_id" VARCHAR(50 CHAR) NOT NULL,
  "f_apply_user_id" VARCHAR(40 CHAR) NOT NULL,
  "f_group_id" VARCHAR(40 CHAR) NOT NULL,
  "f_expired_at" BIGINT DEFAULT -1,
  "f_created_at" BIGINT DEFAULT 0,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_internal_group_idx_t_wf_internal_group_apply_id ON t_wf_internal_group(f_apply_id);

CREATE INDEX IF NOT EXISTS t_wf_internal_group_idx_t_wf_internal_group_expired_at ON t_wf_internal_group(f_expired_at);

CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message (
  id VARCHAR(64 CHAR) NOT NULL,
  proc_inst_id VARCHAR(64 CHAR) NOT NULL DEFAULT '',
  chan VARCHAR(255 CHAR) NOT NULL DEFAULT '',
  payload TEXT NULL DEFAULT NULL,
  ext_message_id VARCHAR(64 CHAR) NOT NULL DEFAULT '',
  CLUSTER PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS t_wf_doc_audit_message_idx_t_wf_doc_audit_message_proc_inst_id ON t_wf_doc_audit_message(proc_inst_id);

CREATE TABLE IF NOT EXISTS t_wf_doc_audit_message_receiver (
  id VARCHAR(64 CHAR) NOT NULL,
  message_id VARCHAR(64 CHAR) NOT NULL DEFAULT '',
  receiver_id  VARCHAR(255 CHAR) NOT NULL DEFAULT '',
  handler_id VARCHAR(255 CHAR) NOT NULL DEFAULT '',
  audit_status VARCHAR(10 CHAR) NOT NULL DEFAULT '',
  CLUSTER PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS t_wf_doc_audit_message_receiver_idx_t_wf_doc_audit_message_receiver_message_id ON t_wf_doc_audit_message_receiver(message_id);

CREATE INDEX IF NOT EXISTS t_wf_doc_audit_message_receiver_idx_t_wf_doc_audit_message_receiver_receiver_id ON t_wf_doc_audit_message_receiver(receiver_id);

CREATE INDEX IF NOT EXISTS t_wf_doc_audit_message_receiver_idx_t_wf_doc_audit_message_receiver_handler_id ON t_wf_doc_audit_message_receiver(handler_id);

INSERT INTO "t_wf_ge_property" SELECT 'next.dbid', '1', 1 FROM DUAL WHERE NOT EXISTS(SELECT "value_", "rev_" FROM "t_wf_ge_property" WHERE "name_"='next.dbid');

INSERT INTO "t_wf_ge_property" SELECT 'schema.history', 'create(7.0.4.7.0)', 1 FROM DUAL WHERE NOT EXISTS(SELECT "value_", "rev_" FROM "t_wf_ge_property" WHERE "name_"='schema.history');

INSERT INTO "t_wf_ge_property" SELECT 'schema.version', '7.0.4.7.0', 1 FROM DUAL WHERE NOT EXISTS(SELECT "value_", "rev_" FROM "t_wf_ge_property" WHERE "name_"='schema.version');

INSERT INTO "t_wf_dict" SELECT 'dc10b959-1bb4-4182-baf7-ab16d9409989', 'free_audit_secret_level', NULL, '6', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT "dict_code", "dict_parent_id", "dict_name", "sort", "status", "creator_id", "create_date", "updator_id", "update_date", "app_id", "dict_value" FROM "t_wf_dict" WHERE "dict_code"='free_audit_secret_level');
INSERT INTO "t_wf_dict" SELECT '3d89e740-df13-4212-92a0-29e674da0e17', 'self_dept_free_audit', NULL, 'Y', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT "dict_code", "dict_parent_id", "dict_name", "sort", "status", "creator_id", "create_date", "updator_id", "update_date", "app_id", "dict_value" FROM "t_wf_dict" WHERE "dict_code"='self_dept_free_audit');
INSERT INTO "t_wf_dict" SELECT 'bfc1c6cd-1bda-4057-992e-feb624915b0e', 'free_audit_secret_level_enum', NULL, '{\"非密\": 5,\"内部\": 6, \"秘密\": 7,\"机密\": 8}', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', '' FROM DUAL WHERE NOT EXISTS(SELECT "dict_code", "dict_parent_id", "dict_name", "sort", "status", "creator_id", "create_date", "updator_id", "update_date", "app_id", "dict_value" FROM "t_wf_dict" WHERE "dict_code"='free_audit_secret_level_enum');
INSERT INTO "t_wf_dict" SELECT 'eaa1b91c-c53c-4113-a066-3e2690c36eae', 'anonymity_auto_audit_switch', NULL, 'n', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', NULL FROM DUAL WHERE NOT EXISTS(SELECT "dict_code", "dict_parent_id", "dict_name", "sort", "status", "creator_id", "create_date", "updator_id", "update_date", "app_id", "dict_value" FROM "t_wf_dict" WHERE "dict_code"='anonymity_auto_audit_switch');
INSERT INTO "t_wf_dict" SELECT '706601cd-948b-4e4b-9265-3ada83d23326', 'rename_auto_audit_switch', NULL, 'n', NULL, 'Y', NULL, NULL, NULL, NULL, 'as_workflow', NULL FROM DUAL WHERE NOT EXISTS(SELECT "dict_code", "dict_parent_id", "dict_name", "sort", "status", "creator_id", "create_date", "updator_id", "update_date", "app_id", "dict_value" FROM "t_wf_dict" WHERE "dict_code"='rename_auto_audit_switch');

