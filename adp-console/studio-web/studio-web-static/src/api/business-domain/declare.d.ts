export interface BusinessDomainConfig {
    // 业务域ID
    id: string;
    // 业务域名称
    name: string;
    // 业务域描述
    description: string;
    // 创建者
    creator: string;
    // 关联产品
    products: string[];
    // 创建时间
    create_time: string;
}
