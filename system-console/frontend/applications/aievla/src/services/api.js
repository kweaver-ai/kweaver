// 模型管理
const baseModelFactory = `/api/mf-model-manager/v1`;

// 评测数据
const baseKnBuilder = '/api/dataset-manager/v1';

// benchmark 管理
const benchmarkManager = '/api/benchmark-manager/v1';

// benchmark 任务
const benchmarkTask = '/api/mf-task/v1';

// agent
const agentFactory = 'api/agent-factory/v3/personal-space';

const API = {
  // 提示词
  promptList: `${baseModelFactory}/prompt-source`,
  promptProjectList: `${baseModelFactory}/prompt-item-source`,
  // 模型管理
  llmGetList: `${baseModelFactory}/llm/list`,

  // agent
  agentGetList: `${benchmarkManager}/data-agent/list`,
  agentGetListV3: `${agentFactory}/agent-list`,

  // 评测数据
  dataSetCreate: `${baseKnBuilder}/datasets`,
  dataSetEdit: ds_id => `${baseKnBuilder}/datasets/${ds_id}`,
  dataSetDeleteById: ds_id => `${baseKnBuilder}/datasets/${ds_id}/delete`,
  dataSetGetById: ds_id => `${baseKnBuilder}/datasets/${ds_id}`,
  dataSetList: `${baseKnBuilder}/datasets/list`,
  dataSetVersionListById: `${baseKnBuilder}/datasets/version-list`,
  // 数据集文件上传
  dataSetFilesInitUpload: `${baseKnBuilder}/files/os-begin-upload`,
  dataSetFilesEndUpload: `${baseKnBuilder}/files/os-end-upload`,
  // 大文件上传
  dataSetFilesInitUploadPart: `${baseKnBuilder}/files/os-init-multi-upload`,
  dataSetFilesUploadPart: `${baseKnBuilder}/files/os-upload-part`,
  dataSetFilesEndUploadPart: `${baseKnBuilder}/files/os-complete-upload`,
  dataSetFilesDownLoad: `${baseKnBuilder}/files/os-download`,
  dataSetFilesBatchDownLoadId: id => `${baseKnBuilder}/files/batch-download/${id}`,
  dataSetFilesBatchDownLoad: `${baseKnBuilder}/files/batch-download`,
  dataSetFilesDelete: `${baseKnBuilder}/files/delete`,
  dataSetFilesCreateDirs: `${baseKnBuilder}/datasets/dirs`,
  dataSetFilesAddVersions: ds_id => `${baseKnBuilder}/datasets/${ds_id}/versions`,
  dataSetFilesDeleteVersions: ds_id => `${baseKnBuilder}/datasets/${ds_id}/version-delete`,
  dataSetFilesList: `${baseKnBuilder}/datasets/dir-list`,
  dataSetFilesPreview: `${baseKnBuilder}/files/file-preview`,
  dataSetCheckOssStatus: `${baseKnBuilder}/obj-storage/status`,
  versionsInfo: ds_id => `${baseKnBuilder}/datasets/${ds_id}/versions`,
  updateVersionsInfo: (ds_id, version_id) => `${baseKnBuilder}/datasets/${ds_id}/versions/${version_id}`,

  // benchmark
  benchmark: `${benchmarkManager}/benchmark`,

  // benchmark任务
  createBenchmarkTask: `${benchmarkTask}/benchmark`,
  editBenchmarkTask: id => `${benchmarkTask}/benchmark/edit/${id}`,
  benchmarkTaskList: `${benchmarkTask}/benchmark`,
  getBenchTaskById: id => `${benchmarkTask}/benchmark/info/${id}`,
  runBenchmarkTask: id => `${benchmarkTask}/benchmark/run/${id}`,
  getTaskStatus: id => `${benchmarkTask}/benchmark/status/${id}`,
  getLeaderboard: `${benchmarkTask}/benchmark/leaderboard`,
  benchmarkTaskResult: id => `${benchmarkTask}/benchmark/result/${id}`,
  deleteBenchmarkTask: id => `${benchmarkTask}/benchmark/delete/${id}`,
  stopBenchmarkTask: id => `${benchmarkTask}/benchmark/stop/${id}`,
  downloadAdapterFileTemplate: `${benchmarkTask}/benchmark/template`,
  adapterUploadEnd: `${benchmarkTask}/benchmark/os-end-upload`,
  deleteBenchmarkFile: id => `${benchmarkTask}/benchmark/delete_file/${id}`,
  onViewLog: id => `${benchmarkTask}/benchmark/log/${id}`,
  leaderBoardConfigList: `${benchmarkTask}/benchmark/leaderboard_config_list`,
};

export { API };
