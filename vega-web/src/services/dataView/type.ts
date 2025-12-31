namespace DataViewType {
  export type DataViewGet_ResultType = { entries: any[]; total_count: number };
  export type DataViewGetDetail_ResultType = any[];
  export type GroupType = {
    id: string;
    name: string;
    data_view_count: number;
    update_time: string;
    builtin: boolean;
  };
}

export default DataViewType;
