SET SCHEMA workflow;

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

