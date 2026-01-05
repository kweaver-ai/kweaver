import cookie from "js-cookie";
import {
    setTitle,
    getDisplay,
    resetTimer,
    setFavicon,
    i18nDeploy,
    session,
} from "../mediator";
import { storeUserInfo, clearUserInfo } from "../auth";
import { request } from "../../tools/request";
import { UserInfo } from "../../api/oauth/declare";
import { Domain } from "../../core/workshop-framework/declare";
import { ModuleConfig, ModuleConfigs } from "../../api/module-config/declare";
import {
    Config as WorkShopFrameWorkConfig,
    Locale,
} from "@kweaver-ai/workshop-framework-studio";
import { defaultModuleConfig, Keys } from "../../api/module-config";
import { homePathname, defaultPathList, setupDefaultPath } from "../path";
import { ServiceInfo } from "../../api/deploy-manager/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import { RegistryInfo } from "../../api/workstation-backend/declare";
import { registryInfo } from "../../api/workstation-backend";
import { token, user } from "../../api/oauth";
import { setLanguage, Language, LanguageTitle } from "../language";
import { signup } from "../auth";
import {
    workShopFrameWorkConfigFactory,
    getWorkShopFrameWorkConfig,
} from "../workshop-framework";
import { cloneDeep, isEqual, noop, isArray } from "lodash";
import __ from "../../locale";
import { getMicroWidgetProps } from "../microWidgetProps";
import { BusinessDomainConfig } from "../../api/business-domain/declare";
import { changeBusinessDomain } from "../microWidgetProps/utils";
//存储旧的subAppRegistryInfo
let cache: Readonly<{ [key: string]: RegistryInfo }> = {} as {
    [key: string]: RegistryInfo;
};

/**
 * 设置 API host和port
 * @param protocol 协议
 * @returns Promise<Domain>
 */
export const setupAPIPathBase = async (
    protocol: string,
    urlPrefix: string
): Promise<Domain> => {
    const prefix = URLPrefixFormatter(urlPrefix, URL_PREFIX_MODE.tail);
    request.setupConfig({
        prefix,
    });
    request.useInterceptors();
    setupDefaultPath((path) => {
        return `${prefix ? prefix : ""}${path}`;
    });
    // const { host, port } = await accessAddr.get(AppType.App);
    const { hostname: host, port } = window.location;
    request.setupConfig({
        headers: { "x-tclient-addr": host, "x-tclient-port": port },
    });
    return {
        protocol,
        host,
        port,
    };
};

/**
 * 获取Module配置
 * @param LanguageSet 语言集合
 * @param oemConfig oem配置
 * @returns
 */
export async function getModuleConfig(): Promise<ModuleConfigs> {
    let configs: any = {};
    const moduleConfig = [] as ModuleConfig[];
    moduleConfig.forEach((config: ModuleConfig) => {
        configs = { ...configs, ...{ [config["module"]]: config } };
    });
    defaultModuleConfig.forEach((config) => {
        if (!configs[(config as ModuleConfig)[Keys.Module]]) {
            configs = {
                ...configs,
                ...{ [(config as ModuleConfig)[Keys.Module]]: config },
            };
        }
    });
    return configs;
}

/**
 * 获取navItem
 * @param moduleConfigs 模块化配置
 * @returns
 */
export function getNavItem(moduleConfigs: any, lang: Locale) {
    const navItem = [
        {
            label: __("修改密码"),
            key: "change-pwd",
        },
        moduleConfigs &&
        moduleConfigs.languages.status &&
        !(moduleConfigs.languages.config.length === 1)
            ? {
                  label: __("语言"),
                  key: "language",
                  children: [
                      {
                          label: LanguageTitle[Language.ZHCN],
                          key: Language.ZHCN,
                      },
                      {
                          label: LanguageTitle[Language.ZHTW],
                          key: Language.ZHTW,
                      },
                      {
                          label: LanguageTitle[Language.ENUS],
                          key: Language.ENUS,
                      },
                  ].filter((item) => {
                      return moduleConfigs.languages.config.includes(item.key);
                  }),
                  defaultSelectedKeys: [lang],
              }
            : null,
        {
            label: __("退出"),
            key: "logout",
        },
    ].filter((item) => {
        return item !== null;
    });
    return navItem;
}

/**
 * 已登录逻辑
 * @param userInfo 用户信息
 * @param pathname 路径
 * @param localLang 从local获取的语言
 * @param sessionLang 从session获取的语言
 */
export const login = (
    userInfo: UserInfo,
    pathname: string,
    localLang: string,
    sessionLang: string
): void => {
    storeUserInfo(userInfo);
    if (defaultPathList.includes(pathname)) {
        setLanguage(localLang);
        window.location.assign(homePathname);
    } else {
        if (!sessionLang || sessionLang !== localLang) {
            // 新开tab||在老的tab里面刷新
            setLanguage(localLang);
            window.location.reload();
        }
    }
};

/**
 * 未登录逻辑
 * @param pathname url 的 path
 * @param href 完整url路径
 */
export const unlogin = async (
    pathname: string,
    href: string
): Promise<UserInfo | null> => {
    let userInfo = null;
    if (defaultPathList.includes(pathname)) {
        if (href.indexOf("error") !== -1) {
            const newHref = href.replace(/redirect=true$/, "");
            const po = newHref.indexOf("?");
            const loginerror = newHref.substring(po + 7, newHref.length);
            const url = newHref.substring(0, po);

            if (
                window.top &&
                window !== window.top &&
                !window.location.search.includes("redirect=true") &&
                !window.location.search.includes("fullscreen=true")
            ) {
                window.top.location.href = url;
                session.set("studio.loginerror", loginerror);
            } else {
                window.location.href = url;
                session.set("studio.loginerror", loginerror);
            }
        } else {
            clearUserInfo();
        }
    } else if (cookie.get("studio.oauth2_token")) {
        try {
            if (
                window.top &&
                window !== window.top &&
                !window.location.search.includes("redirect=true") &&
                !window.location.search.includes("fullscreen=true")
            ) {
                window.top.location.href = href;
            }
            userInfo = await user.get();
            storeUserInfo(userInfo);
        } catch (error) {}
    } else {
        signup(defaultPathList[1]);
    }
    return userInfo;
};

/**
 * 设置语言
 * @param lang 语言
 */
export const setupLocale = async (lang: string) => {
    i18nDeploy.setup({ locale: lang });
};

/**
 * 设置标题和ico
 * @param lang 语言
 * @param oemConfig oem配置
 */
export const setupAppStyle = async (lang: string, oemConfig: OemConfigInfo) => {
    setFavicon(`data:image/png;base64,${oemConfig["favicon.ico"]}`);
    setTitle(getDisplay(oemConfig["product"], lang));
};

/**
 * 获取默认的侧边栏信息
 * @param oemConfig oem配置
 * @param lang 语言
 * @param domainInfo 域
 * @param userInfo 用户信息
 * @param isDefault
 * @param siteRole 站点角色
 * @param moduleConfigs 模块配置信息
 * @param prefix 前缀
 * @returns
 */
export const getDefaultAppConfig = async (
    oemConfig: OemConfigInfo,
    lang: Locale,
    domainInfo: Domain,
    userInfo: UserInfo | any,
    isDefault: boolean,
    moduleConfigs: ModuleConfigs,
    prefix: string,
    onChangePwd: () => void,
    pathname: string,
    getConfig: (forceSetConfig?: boolean) => Promise<void>,
    businessDomainList: BusinessDomainConfig[]
): Promise<
    [boolean, WorkShopFrameWorkConfig, { [key: string]: RegistryInfo }]
> => {
    const _appConfig: WorkShopFrameWorkConfig = getWorkShopFrameWorkConfig(
        lang,
        domainInfo,
        userInfo!,
        oemConfig,
        getNavItem(moduleConfigs, lang),
        onChangePwd
    );
    const urlPrefix = URLPrefixFormatter(prefix, URL_PREFIX_MODE.tail);
    const props = {
        lang,
        username: userInfo?.user?.loginName || userInfo?.username,
        userid: userInfo?.id || "",
        oemConfigs: oemConfig,
        prefix: urlPrefix,
        toggleSideBarShow: toggleSideBarShow,
        changeCustomPathComponent: changeCustomPathComponent,
        businessDomainID: session.get("studio.businessDomainID"),
        changeBusinessDomain: (businessDomainID: string) =>
            changeBusinessDomain(
                businessDomainID,
                businessDomainList,
                getConfig
            ),
        logoutTimer: logoutTimer,
    };

    const extraProps = getMicroWidgetProps({
        oemConfig,
        lang,
        userInfo,
        prefix: urlPrefix,
    });

    if (isDefault) {
        return [
            false,
            workShopFrameWorkConfigFactory(
                _appConfig,
                {} as { [key: string]: RegistryInfo },
                {
                    ...props,
                    ...extraProps,
                },
                pathname,
                userInfo,
                undefined,
                {} as { [key: string]: RegistryInfo },
                businessDomainList
            ),
            {},
        ];
    } else {
        let subAppRegistryInfo: { [key: string]: RegistryInfo } = (
            await registryInfo.getInfoByName("root")
        ).subapp.children;

        let pluginsRegistryInfo: { [key: string]: RegistryInfo } = (
            await registryInfo.getInfoByName("plugins")
        ).subapp.children;

        //对比新旧subAppRegistryInfo
        const isChange = !isEqual(cache, subAppRegistryInfo);
        //更新cache
        if (isChange) {
            cache = cloneDeep(subAppRegistryInfo);
        }
        // isChange标志是否需要更新
        return [
            isChange,
            workShopFrameWorkConfigFactory(
                _appConfig,
                subAppRegistryInfo,
                {
                    ...props,
                    ...extraProps,
                },
                pathname,
                userInfo,
                getConfig,
                pluginsRegistryInfo,
                businessDomainList
            ),
            subAppRegistryInfo,
        ];
    }
};

/**
 * 定时更新token
 */
export function tokenRefreshTimer() {
    setInterval(() => {
        token.get();
    }, 5 * 60 * 1000);
}

/**
 * 超时自动登出
 */
export function logoutTimer() {
    resetTimer(async () => {
        signup(defaultPathList[1]);
        session.set("studio.kickedOut", 20);
    });
}

let toggleSideBarShowCallback = noop;

const toggleSideBarShow = (param: boolean | ((fn: any) => void)) => {
    if (typeof param === "boolean") {
        toggleSideBarShowCallback(param);
    } else {
        toggleSideBarShowCallback = param;
    }
};

let changeCustomPathComponentCallback = noop;

const changeCustomPathComponent = (
    param:
        | { icon?: any; label?: string; customComponent?: any }
        | ((fn: any) => void)
) => {
    if (typeof param !== "function") {
        changeCustomPathComponentCallback(param);
    } else {
        changeCustomPathComponentCallback = param;
    }
};

// search参数转化为对象
export const getSearchQuerys = (search: string): Record<string, any> => {
    if (!search) return {};
    let searchQuerys = {};
    search
        .slice(1)
        .split("&")
        .forEach((item) => {
            const queryItem = item.split("=");
            if (queryItem.length === 2) {
                if (searchQuerys[queryItem[0]]) {
                    searchQuerys[queryItem[0]] = isArray(
                        searchQuerys[queryItem[0]]
                    )
                        ? [...searchQuerys[queryItem[0]], queryItem[1]]
                        : [searchQuerys[queryItem[0]], queryItem[1]];
                } else {
                    searchQuerys[queryItem[0]] = queryItem[1];
                }
            }
        });
    return searchQuerys;
};
