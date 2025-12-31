SET SCHEMA workflow;

CREATE TABLE IF NOT EXISTS "t_wf_doc_share_strategy_config" (
  "f_id" VARCHAR(40 CHAR) NOT NULL,
  "f_proc_def_id" VARCHAR(300 CHAR) NOT NULL,
  "f_act_def_id" VARCHAR(100 CHAR) NOT NULL,
  "f_name" VARCHAR(64 CHAR) NOT NULL,
  "f_value" VARCHAR(64 CHAR) NOT NULL,
  CLUSTER PRIMARY KEY ("f_id")
);

CREATE INDEX IF NOT EXISTS t_wf_doc_share_strategy_config_idx_t_wf_doc_share_strategy_config_proc_act_def_id ON t_wf_doc_share_strategy_config(f_proc_def_id, f_act_def_id);
CREATE INDEX IF NOT EXISTS t_wf_doc_share_strategy_config_idx_t_wf_doc_share_strategy_config_proc_def_id_name ON t_wf_doc_share_strategy_config(f_proc_def_id, f_name);
CREATE INDEX IF NOT EXISTS t_wf_doc_share_strategy_config_idx_t_wf_doc_share_strategy_config_name ON t_wf_doc_share_strategy_config(f_name);

