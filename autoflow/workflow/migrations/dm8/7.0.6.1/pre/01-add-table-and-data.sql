SET SCHEMA workflow;

CREATE TABLE IF NOT EXISTS "t_wf_doc_audit_sendback_message" (
  "f_id" VARCHAR(64 CHAR) NOT NULL,
  "f_proc_inst_id" VARCHAR(64 CHAR) NOT NULL DEFAULT '',
  "f_message_id" VARCHAR(64 CHAR) NOT NULL DEFAULT '',
  "f_created_at" datetime(0) NOT NULL,
  "f_updated_at" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_doc_audit_sendback_message_idx_t_wf_doc_audit_sendback_message_proc_inst_id ON t_wf_doc_audit_sendback_message(f_proc_inst_id);



CREATE TABLE IF NOT EXISTS "t_wf_inbox" (
  "f_id" VARCHAR(50 CHAR) NOT NULL,
  "f_topic" VARCHAR(128 CHAR) NOT NULL,
  "f_message" text NOT NULL,
  "f_create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_inbox_idx_t_wf_inbox_f_create_time ON t_wf_inbox("f_create_time");

