const PERMISSION_CODES = {
  LLM_CREATE: 'create', // 大模型-创建
  LLM_DELETE: 'delete', // 大模型-删除

  LLM_ITEM_EXECUTE: 'execute', // 使用
  LLM_ITEM_DISPLAY: 'display', // 查看
  LLM_ITEM_MODIFY: 'modify', // 更新
  LLM_ITEM_DELETE: 'delete', // 删除
  LLM_ITEM_CREATE: 'create', // 创建

  SMALL_MODEL_CREATE: 'create', // 小模型-创建
  SMALL_MODEL_DELETE: 'delete', // 小模型-删除

  SMALL_MODEL_ITEM_EXECUTE: 'execute', // 使用
  SMALL_MODEL_ITEM_AUTHORIZE: 'authorize', // 权限管理
  SMALL_MODEL_ITEM_DISPLAY: 'display', // 查看
  SMALL_MODEL_ITEM_MODIFY: 'modify', // 更新
  SMALL_MODEL_ITEM_DELETE: 'delete', // 删除
  SMALL_MODEL_ITEM_CREATE: 'create', // 创建
};

export default PERMISSION_CODES;
