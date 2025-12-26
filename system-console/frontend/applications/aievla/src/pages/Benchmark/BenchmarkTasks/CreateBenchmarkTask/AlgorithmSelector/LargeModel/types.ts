// 模板
export type TTemplates = {
  prompt_id: string;
  prompt_name: string;
  prompt_desc: string;
  model_id: string;
  model_name: string;
  model_para: any;
  messages: string;
  opening_remarks: string;
  variables: {
    var_name: string;
    field_name: string;
    optional: boolean;
    field_type: string;
    max_len: 48;
    options: string[];
    value_type: string;
    range: number[];
  }[];
  [key: string]: any;
}[];
