import API from '@/services/api';
import Request from '@/services/request';

import type BusinessDomainType from './type';

/** 创建业务域 */
const businessDomainCreate: any = async (data: BusinessDomainType.businessDomainCreate) => await Request.post(API.businessDomainCreate, data);
/** 删除业务域 */
const businessDomainDelete: any = async (id: string) => await Request.delete(API.businessDomainDelete(id));
/** 更新业务域 */
const businessDomainUpdate: any = async (id: string, data: BusinessDomainType.businessDomainUpdate) => await Request.put(API.businessDomainUpdate(id), data);
/** 更新业务域成员 */
const businessDomainMembersUpdate: any = async (id: string, data: BusinessDomainType.businessDomainMembersUpdate) =>
  await Request.post(API.businessDomainMembersUpdate(id), data);
/** 获取业务成员信息 */
const businessDomainMembersGet: any = async (id: string, data: BusinessDomainType.businessDomainMembersGet) =>
  await Request.get(API.businessDomainMembersGet(id), data);
/** 查询业务域列表 */
const businessDomainGet: any = async (data: BusinessDomainType.businessDomainGet) => await Request.get(API.businessDomainGet, data);
/** 通过id查询业务域详情 */
const businessDomainGetById: any = async (id: string) => await Request.get(API.businessDomainGetById(id));

export default {
  businessDomainCreate,
  businessDomainDelete,
  businessDomainUpdate,
  businessDomainMembersUpdate,
  businessDomainMembersGet,
  businessDomainGet,
  businessDomainGetById,
};
