import { LanguageList } from "../../core/language";
import { SubProductCollection, OSList } from "../deploy-manager";
import { request } from "../../tools/request";
import { ModuleConfig } from "./declare";

/**
 * ShareWebStudio存在备份，需要两边同时修改
 */
export const moduleconfig = {
    url: "/api/deploy-web-service/v1/module-config",
    /**
     * 获取涉密配置
     * @returns
     */
    get: function (moduleName: string): Promise<ModuleConfig> {
        return request.get(this.url + `/${moduleName}`);
    },
    /**
     * 获取所有涉密配置
     * @returns
     */
    getAll: function (): Promise<ReadonlyArray<ModuleConfig>> {
        return request.get(this.url);
    },
    /**
     * 设置涉密配置
     * @param configs
     * @returns
     */
    put: async function <T>(configs: Array<ModuleConfig>): Promise<T> {
        return await request.put(this.url, configs);
    },
};

export const Keys = {
    // 功能模块
    Module: "module",
    // 是否显示
    Status: "status",
    // 配置json
    Config: "config",
};

export const Modules = {
    // 个性化
    Personalization: "personalization",
    // 在线帮助
    OnlineHelp: "onlineHelp",
    // 语言
    Languages: "languages",
    // 客户端
    Clients: "clients",
    // AnyShare
    AnyShare: "AnyShare",
    // 站点管理
    SiteManagement: "siteManagement",
    // 身份认证
    IdentityAccess: "IdentityAccess",
    // 子产品
    SubProduct: "subProduct",
    // 登录超时时间
    LoginTimePolicy: "loginTimePolicy",
    // 是否是涉密
    IsSecret: "isSecret",
};

export const PersonalizationModules = {
    // 品牌信息
    Brand: "brand",
    // 移动端
    Mobile: "mobile",

    // 产品信息
    Product: "product",
    // 版本
    Version: "version",
    // 版本
    Copyright: "copyright",
    // 隐私和协议
    AgreementAndPrivacy: "agreementAndPrivacy",
    // 帮助文档访问
    AccessOnlineSupport: "accessOnlineSupport",
    // ICP备案号
    RecordNumber: "recordNumber",
    // 公安备案号
    PublicCode: "publicCode",

    // 登录
    Login: "login",

    // 显示 restful API 下载
    RestfulAPIDownload: "restfulAPIDownload",
    // 显示 web组件 下载
    WebComponentDownload: "webComponentDownload",
    // 显示客户端标语
    PortalBanner: "portalBanner",

    // 语言
    Languages: "languages",
};

export const IsSecret = {
    [Keys.Module]: Modules.IsSecret,
    [Keys.Status]: 0,
    [Keys.Config]: null,
};

export const Personalization = {
    [Keys.Module]: Modules.Personalization,
    [Keys.Status]: 1,
    [Keys.Config]: {
        [PersonalizationModules.Brand]: {
            [PersonalizationModules.Mobile]: {
                status: 1,
            },
        },
        [PersonalizationModules.Product]: {
            [PersonalizationModules.Version]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.Copyright]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.AgreementAndPrivacy]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.AccessOnlineSupport]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.PublicCode]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.RecordNumber]: {
                defaultValue: undefined,
                status: 1,
            },
        },
        [PersonalizationModules.Login]: {
            [PersonalizationModules.Languages]: [...LanguageList],
            [PersonalizationModules.RestfulAPIDownload]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.WebComponentDownload]: {
                defaultValue: undefined,
                status: 1,
            },
            [PersonalizationModules.PortalBanner]: {
                defaultValue: undefined,
                status: 1,
            },
        },
    },
};

export const OnlineHelp = {
    [Keys.Module]: Modules.OnlineHelp,
    [Keys.Status]: 1,
    [Keys.Config]: null,
};

export const Languages = {
    [Keys.Module]: Modules.Languages,
    [Keys.Status]: 1,
    [Keys.Config]: [...LanguageList],
};

export const Clients = {
    [Keys.Module]: Modules.Clients,
    [Keys.Status]: 1,
    [Keys.Config]: [...OSList],
};

export const SiteManagement = {
    [Keys.Module]: Modules.SiteManagement,
    [Keys.Status]: 1,
    [Keys.Config]: null,
};

export const IdentityAccess = {
    [Keys.Module]: Modules.IdentityAccess,
    [Keys.Status]: 0,
    [Keys.Config]: null,
};

export const SubProduct = {
    [Keys.Module]: Modules.SubProduct,
    [Keys.Status]: 1,
    [Keys.Config]: [...SubProductCollection],
};

export const LoginTimePolicy = {
    [Keys.Module]: Modules.LoginTimePolicy,
    [Keys.Status]: 120,
    [Keys.Config]: null,
};

export const defaultModuleConfig = [
    IdentityAccess,
    IsSecret,
    Personalization,
    OnlineHelp,
    Languages,
    Clients,
    SiteManagement,
    SubProduct,
    LoginTimePolicy,
];
