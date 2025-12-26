import API from '../api';
import Request from '../request';

/** 新增提示词分组 */
const promptProjectAdd: any = async (data: any) => {
  return await Request.post(API.promptProjectAdd, data);
};

/** 新增提示词二级分组 */
const promptProject2Add: any = async (data: any) => {
  return await Request.post(API.promptProject2Add, data);
};

/** 删除提示词分组 */
const promptProjectDelete: any = async (data: any) => {
  return await Request.post(API.promptProjectDelete, data);
};

/** 编辑提示词和分组 */
const promptProjectEdit: any = async (data: any) => {
  return await Request.post(API.promptProjectEdit, data);
};
/** 编辑提示词二级分组 */
const promptProject2Edit: any = async (data: any) => {
  return await Request.post(API.promptProject2Edit, data);
};

/** 获取提示词分组列表 */
const promptProjectGetList: any = async (data: any) => {
  return await Request.get(API.promptProjectGetList, data);
};

/** 添加提示词 */
const promptAdd: any = async (data: any) => {
  return await Request.post(API.promptAdd, data);
};

/** 编辑提示词 */
const promptEdit: any = async (data: any) => {
  return await Request.post(API.promptEdit, data);
};
/** 编辑提示词名称 */
const promptEditName: any = async (data: any) => {
  return await Request.post(API.promptEditName, data);
};

/** 移动提示词名称 */
const promptMove: any = async (data: any) => {
  return await Request.post(API.promptMove, data);
};

/** 获取提示词列表 */
const promptGetList: any = async (data: any) => {
  return await Request.get(API.promptGetList, data);
};

export default {
  promptProjectAdd,
  promptProject2Add,
  promptProjectDelete,
  promptProjectEdit,
  promptProject2Edit,
  promptProjectGetList,
  promptAdd,
  promptEdit,
  promptEditName,
  promptMove,
  promptGetList,
};
