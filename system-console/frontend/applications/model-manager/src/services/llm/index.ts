import API from '@/services/api';
import Request from '@/services/request';

import type LlmType from './type';

/** 添加大模型 */
const llmAdd: any = async (data: LlmType.LlmAddType) => await Request.post(API.llmAdd, data);

/** 编辑大模型 */
const llmEdit: any = async (data: LlmType.LlmEditType) => await Request.post(API.llmEdit, data);

/** 编辑大模型是否为默认 */
const llmDefaultEdit: any = async (data: LlmType.llmDefaultEditType) => await Request.post(API.llmDefaultEdit, data);

/** 获取大模型配置 */
const llmGetDetail: any = async (data: LlmType.LlmGetDetailType) => await Request.get(API.llmGetDetail, data);

/** 获取大模型列表 */
const llmGetList: any = async (data: LlmType.LlmGetListType) => await Request.get(API.llmGetList, data);

/** 删除大模型 */
const llmDelete: any = async (data: LlmType.LlmDeleteType) => await Request.post(API.llmDelete, data);

/** 测试大模型 */
const llmTest: any = async (data: LlmType.LlmAddType) => await Request.post(API.llmTest, data, { timeout: 600000 });

/** 大模型调用接口 */
const llmCompletions: any = async (data: LlmType.LlmAddType) => await Request.post(API.llmCompletions, data);

/** 添加大模型配额 */
const llmQuotaCreate: any = async (body: LlmType.LlmQuotaCreateType) => await Request.post(API.llmQuotaCreate, body);

/** 编辑大模型配额 */
const llmQuotaEdit: any = async (body: LlmType.LlmQuotaEditType, id: string) => await Request.post(API.llmQuotaEdit(id), body);

/** 获取大模型配额列表 */
const llmQuotaGetList: any = async (data: LlmType.ModelMonitorListType) => await Request.get(API.llmQuotaGetList, data);

/** 获取指定模型配额详情 */
const llmQuotaGetDetail: any = async (body: string) => await Request.get(API.llmQuotaGetDetail(body));

/** 新建用户使用模型配额信息 */
const llmQuotaUserAdd: any = async (body: any) => await Request.post(API.llmQuotaUserAdd, body);

/** 删除用户使用模型配额信息 */
const llmQuotaUserDelete: any = async (body: any) => await Request.post(API.llmQuotaUserDelete, body);

/** 用户列表(被分配配额的用户) */
const llmQuotaUserList: any = async (body: LlmType.userQuotaListType) => await Request.get(API.llmQuotaUserList, body);

/** 模型监控调用接口 */
const modelMonitorList: any = async (body: LlmType.ModelMonitorListType) => await Request.get(API.modelMonitorList, body);

export default {
  llmAdd,
  llmEdit,
  llmGetDetail,
  llmDefaultEdit,
  llmGetList,
  llmDelete,
  llmTest,
  llmCompletions,
  llmQuotaCreate,
  llmQuotaEdit,
  llmQuotaGetList,
  llmQuotaGetDetail,
  llmQuotaUserAdd,
  llmQuotaUserDelete,
  llmQuotaUserList,
  modelMonitorList,
};
