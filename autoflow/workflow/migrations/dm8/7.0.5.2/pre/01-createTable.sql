SET SCHEMA workflow;

CREATE TABLE IF NOT EXISTS "t_wf_outbox" (
  "f_id" VARCHAR(50 CHAR) NOT NULL,
  "f_topic" VARCHAR(128 CHAR) NOT NULL,
  "f_message" text NOT NULL,
  "f_create_time" datetime(0) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_outbox_idx_t_wf_outbox_f_create_time ON t_wf_outbox("f_create_time");

