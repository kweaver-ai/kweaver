const base_url_system = '/api/business-system/v1';

const API = {
  // 业务域管理
  /** 创建业务域 */
  businessDomainCreate: `${base_url_system}/business-domain`,
  /** 删除业务域 */
  businessDomainDelete: (id: string) => `${base_url_system}/business-domain/${id}`,
  /** 更新业务域 */
  businessDomainUpdate: (id: string) => `${base_url_system}/business-domain/${id}`,
  /** 更新业务域成员 */
  businessDomainMembersUpdate: (id: string) => `${base_url_system}/business-domain/members/${id}`,
  /** 获取业务成员信息 */
  businessDomainMembersGet: (id: string) => `${base_url_system}/business-domain/members/${id}`,
  /** 查询业务域列表 */
  businessDomainGet: `${base_url_system}/business-domain`,
  /** 通过id查询业务域详情 */
  businessDomainGetById: (id: string) => `${base_url_system}/business-domain/${id}`,
};

export default API;
