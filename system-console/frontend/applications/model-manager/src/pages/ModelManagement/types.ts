export type ModelDataType = {
  model_id: string;
  model_name: string;
  model_series: string;
  model: string;
  create_by: string;
  update_by: string;
  create_time: string;
  update_time: string;
  max_model_len: number;
  model_parameters: string | null;
  model_type: 'rlm' | 'llm';
  model_config: {
    api_model: string;
    api_url: string;
    api_key?: string;
  };
};
