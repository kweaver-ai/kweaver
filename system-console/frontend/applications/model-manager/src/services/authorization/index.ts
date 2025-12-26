import API from '@/services/api';
import Request, { baseConfig } from '@/services/request';

/** 获取资源操作 */
export type AuthorizationGetResourceType = { id: string; type: string }[];
const authorizationGetResource: any = async (data: AuthorizationGetResourceType) => {
  return await Request.post(API.authorizationGetResource, { method: 'GET', accessor: { id: baseConfig?.userid, type: 'user' }, resources: data });
};

/** 获取全部用户资源 */
const getUsers: any = async (data: number[]) => await Request.post(API.getUsers, data);

/** 查询用户资源 */
const getSearchUsers: any = async (data: number[]) => await Request.post(API.getSearchUsers, data);

/** 获取应用账号 */
const getAppAccounts: any = async (data: any[]) => {
  return await Request.get(API.getAppAccounts, data);
};

export default {
  authorizationGetResource,
  getUsers,
  getSearchUsers,
  getAppAccounts,
};
