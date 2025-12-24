/**
 * 模块配置通用信息
 */
export type ModuleConfig = {
    /**
     * 模块名
     */
    module: string;
    /**
     * 状态
     */
    status: number;
    /**
     * 配置
     */
    config: any;
};

/**
 * 模块配置信息
 */
export interface ModuleConfigs {
    /**
     * 子产品
     */
    subProduct: ModuleConfig;
    /**
     * 个性化
     */
    personalization: ModuleConfig;
    /**
     * 在线帮助
     */
    onlineHelp: ModuleConfig;
    /**
     * 语言
     */
    languages: ModuleConfig;
    /**
     * 客户端
     */
    clients: ModuleConfig;
    /**
     * 站点管理
     */
    siteManagement: ModuleConfig;
    /**
     * 登录超时策略
     */
    loginTimePolicy: ModuleConfig;
    /**
     * 是否是涉密
     */
    isSecret: ModuleConfig;
    /**
     * 身份认证
     */
    IdentityAccess: ModuleConfig;
}
