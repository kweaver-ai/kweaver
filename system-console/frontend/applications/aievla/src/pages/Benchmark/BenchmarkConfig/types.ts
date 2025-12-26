/**
 * 指标文件解析结果
 */
export type IndicatorType = {
  name: string;
  description: string;
  input: Array<{ name: string; description: string }>;
  output: Array<{ name: string; description: string }>;
  path?: string;
};

type MetricListType = {
  id: string;
  name: string;
  input: string[];
  output: string[];
};

type BenchmarkConfigMetricType = {
  metric_config_id: string;
  metric_list: MetricListType[];
  x: number;
  y: number;
  adapter_list: string[];
};

type BenchmarkConfigDatasetListType = {
  name: string;
  doc_list: Array<{
    doc_id: string;
    doc_name: string;
    input: string[];
    output: string[];
  }>;
};

type BenchmarkConfigDatasetType = {
  dataset_config_id?: string;
  dataset_config_name: string;
  dataset_list: Record<string, BenchmarkConfigDatasetListType>;
  x: number;
  y: number;
  metric: BenchmarkConfigMetricType;
  leaderboard_item: string;
};

type BenchmarkConfigTaskNodeType = {
  id?: string;
  name: string;
  description: string;
  x: number;
  y: number;
  dataset: BenchmarkConfigDatasetType[];
  average: boolean;
};

export type ViewBenchmarkConfigDataType = {
  id: string;
  name: string;
  published: number;
  description: string;
  x: number;
  y: number;
  color: string;
  task: BenchmarkConfigTaskNodeType[];
  leaderboard_x: number;
  leaderboard_y: number;
  average: boolean;
};

// 编辑接口需要的数据格式

export type EditBenchmarkConfigMetricType = {
  // metric_config_id?: string;
  metric_id_list: string[];
  // x: number;
  // y: number;
  adapter_list: string[];
};

export type EditBenchmarkConfigDatasetListType = {
  doc_id: string;
  input: string[];
  output: string[];
};

export type EditBenchmarkConfigDatasetType = {
  dataset_config_id?: string;
  dataset_config_name: string;
  dataset_list: Record<string, EditBenchmarkConfigDatasetListType[]>;
  x: number;
  y: number;
  metric: EditBenchmarkConfigMetricType;
  leaderboard_item: string;
};

export type EditBenchmarkConfigTaskNodeType = {
  id?: string;
  name: string;
  description: string;
  x: number;
  y: number;
  dataset: EditBenchmarkConfigDatasetType[];
  average: boolean;
};

export type EditBenchmarkConfigDataType = {
  id?: string;
  name: string;
  description: string;
  x: number;
  y: number;
  color: string;
  task: EditBenchmarkConfigTaskNodeType[];
  leaderboard_x: number;
  leaderboard_y: number;
  average: boolean;
};
