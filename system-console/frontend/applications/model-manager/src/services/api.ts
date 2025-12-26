const baseAuthorization = '/api/authorization/v1'; // 权限服务
const baseDataLake = '/api/efast/v1'; // 内容数据湖
const baseModelApi = '/api/mf-model-api/v1'; // 模型服务
const baseModelManager = '/api/mf-model-manager/v1'; // 模型服务

const API = {
  /** 获取资源操作 */
  authorizationGetResource: `${baseAuthorization}/resource-operation`,

  /** 获取全部用户资源 */
  getUsers: '/isfweb/api/ShareMgnt/Usrm_GetAllUsers',
  /** 查询用户资源 */
  getSearchUsers: '/api/user-management/v1/console/search-users',
  /** 获取应用账号 */
  getAppAccounts: '/api/user-management/v1/apps',

  /** 添加大模型 */
  llmAdd: `${baseModelManager}/llm/add`,
  /** 编辑大模型 */
  llmEdit: `${baseModelManager}/llm/edit`,
  /** 编辑大模型是否为默认 */
  llmDefaultEdit: `${baseModelManager}/llm/default/edit`,

  /** 获取大模型配置 */
  llmGetDetail: `${baseModelManager}/llm/get`,
  /** 获取大模型列表 */
  llmGetList: `${baseModelManager}/llm/list`,
  /** 删除大模型 */
  llmDelete: `${baseModelManager}/llm/delete`,
  /** 测试大模型 */
  llmTest: `${baseModelManager}/llm/test`,
  /** 大模型调用接口 */
  llmCompletions: `${baseModelApi}/chat/completions`,
  /** 模型监控调用接口 */
  modelMonitorList: `${baseModelManager}/llm/monitor/list`,

  /** ------ file modelStatistics ------ */
  /** 大模型模型统计 */
  modelOverview: `${baseModelManager}/llm/monitor/overview`,

  // 大模型审计
  /** 添加大模型配额 */
  llmQuotaCreate: `${baseModelManager}/model-quota`,
  /** 编辑大模型配额 */
  llmQuotaEdit: (id: string) => `${baseModelManager}/model-quota/${id}`,
  /** 获取大模型配额列表 */
  llmQuotaGetList: `${baseModelManager}/model-quota/list`,
  /** 获取指定模型配额详情 */
  llmQuotaGetDetail: (id: string) => `${baseModelManager}/model-quota/${id}`,
  /** 新建用户使用模型配额信息 */
  llmQuotaUserAdd: `${baseModelManager}/user-quota`,
  /** 删除用户使用模型配额信息 */
  llmQuotaUserDelete: `${baseModelManager}/user-quota/delete`,
  /** 用户列表(被分配配额的用户) */
  llmQuotaUserList: `${baseModelManager}/user-quota/list`,

  userModelQuotaList: `${baseModelManager}/user-quota/model-list`,
  modelOpAuditList: `${baseModelManager}/model-op-audit/list`,
  modelArchivingList: `${baseModelManager}/model-archiving/list`,
  remainCheck: `${baseModelManager}/user-quota/remain-check`,

  /** 添加小模型 */
  smallModelAdd: `${baseModelManager}/small-model/add`,
  /** 编辑小模型 */
  smallModelEdit: `${baseModelManager}/small-model/edit`,
  /** 获取小模型配置 */
  smallModelGetDetail: `${baseModelManager}/small-model/get`,
  /** 获取小模型列表 */
  smallModelGetList: `${baseModelManager}/small-model/list`,
  /** 删除小模型 */
  smallModelDelete: `${baseModelManager}/small-model/delete`,
  /** 测试小模型 */
  smallModelTest: `${baseModelManager}/small-model/test`,

  /** 新增提示词分组 */
  promptProjectAdd: `${baseModelManager}/prompt-item-add`,
  /** 新增提示词二级分组 */
  promptProject2Add: `${baseModelManager}/prompt-type-add`,
  /** 删除提示词或者分组 */
  promptProjectDelete: `${baseModelManager}/delete-prompt`,
  /** 编辑提示词分组 */
  promptProjectEdit: `${baseModelManager}/prompt-item-edit`,
  /** 编辑提示词二级分组 */
  promptProject2Edit: `${baseModelManager}/prompt-type-edit`,
  /** 获取提示词分组列表 */
  promptProjectGetList: `${baseModelManager}/prompt-item-source`,

  /** 添加提示词 */
  promptAdd: `${baseModelManager}/prompt-add`,
  /** 编辑提示词 */
  promptEdit: `${baseModelManager}/prompt-edit`,
  /** 编辑提示词名称 */
  promptEditName: `${baseModelManager}/prompt-name-edit`,
  /** 移动提示词名称 */
  promptMove: `${baseModelManager}/prompt/move`,
  /** 获取提示词列表 */
  promptGetList: `${baseModelManager}/prompt-source`,

  /** 获取当前登录用户临时上传目录 */
  getEntryDocLibs: `${baseDataLake}/entry-doc-lib`,
  /** 由名字获取对象信息 */
  getDocInfoByPath: `${baseDataLake}/file/getinfobypath`,
  /* 创建文件夹 */
  createDir: `${baseDataLake}/dir/create`,
  /** 秒传校验码协议 */
  predupload: `${baseDataLake}/file/predupload`,
  /** 秒传文件协议 */
  dupload: `${baseDataLake}/file/dupload`,
  /** 开始上传文件协议 */
  osbeginupload: `${baseDataLake}/file/osbeginupload`,
  /** 上传文件完成协议 */
  osendupload: `${baseDataLake}/file/osendupload`,
  /** 下载文件协议 */
  osdownload: `${baseDataLake}/file/osdownload`,
};

export default API;
