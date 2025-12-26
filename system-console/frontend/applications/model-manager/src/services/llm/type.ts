namespace LlmType {
  export type LlmAddType = {
    model_config: { api_model: string; api_url: string; api_key?: string; secret_key?: string };
    model_name: string;
    model_type: string;
    model_series: string;
    max_model_len: number;
    model_parameters: number;
  };
  export type LlmEditType = { model_id: string } & LlmAddType;
  export type llmDefaultEditType = { model_id: string; default: boolean };
  export type LlmGetDetailType = { model_id: string };
  export type LlmGetListType = { page: number; size: number; order: string; rule: string; name: string; model_type?: string };
  export type LlmDeleteType = { model_ids: string[] };
  export type LlmQuotaEditType = {
    input_tokens: number;
    output_tokens?: number;
    billing_type: number;
    currency_type: number;
    referprice_in: any;
    referprice_out?: any;
    num_type: number;
  };
  export type LlmQuotaCreateType = { model_id: string } & LlmQuotaEditType;
  export type ModelMonitorListType = { model_id: string };
  export type userQuotaListType = { conf_id: string; page: number; size?: number; order: string; rule: string };
}

export default LlmType;
