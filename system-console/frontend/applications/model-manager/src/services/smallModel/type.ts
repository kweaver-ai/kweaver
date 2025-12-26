namespace SmallModelType {
  export type SmallModelAddType = {
    model_config: { api_model: string; api_url: string; api_key?: string };
    model_name: string;
    model_type: string;
  };
  export type SmallModelEditType = { model_id: string } & SmallModelAddType;
  export type SmallModelGetDetailType = { model_id: string };
  export type SmallModelGetListType = { page: number; size: number; order: string; rule: string; model_name: string; model_type?: string };
  export type SmallModelDeleteType = { model_ids: string[] };
}

export default SmallModelType;
