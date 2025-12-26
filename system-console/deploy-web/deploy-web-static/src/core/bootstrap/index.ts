import cookie from "js-cookie";
import {
    session,
    resetTimer,
    setTitle,
    setFavicon,
    getDisplay,
    i18nDeploy,
} from "../mediator";
import { clearUserInfo, storeUserInfo } from "../auth";
import { request } from "../../tools/request";
import { UserInfo } from "../../api/oauth/declare";
import { oemconfig, Section } from "../../api/oem-config";
import { Domain } from "../../core/workshop-framework/declare";
import { ModuleConfig, ModuleConfigs } from "../../api/module-config/declare";
import {
    Config as WorkShopFrameWorkConfig,
    Locale,
} from "@aishu-tech/workshop-framework-system";
import { defaultModuleConfig, Keys } from "../../api/module-config";
import { defaultPathList, setupDefaultPath, getFirstPathname } from "../path";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import { token, user } from "../../api/oauth";
import { setLanguage, Language, LanguageTitle } from "../language";
import { signup } from "../auth";
import {
    workShopFrameWorkConfigFactory,
    getWorkShopFrameWorkConfig,
} from "../workshop-framework";
import { oldDefaultFavicon, newDefaultFavicon } from "./favicon";
import { noop } from "lodash";
import __ from "../../locale";
import { Product } from "../oem-config";
import { getMicroWidgetProps } from "../microWidgetProps";

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
 * 获取oem配置
 * @param LanguageSet 语言集合
 * @param oemConfig oem配置
 * @returns
 */
export async function getOemConfig(
    LanguageSet: Array<string>,
    oemConfig: OemConfigInfo
): Promise<{ anyshareConfig: OemConfigInfo; languageConfig: OemConfigInfo }> {
    let _oemConfig: OemConfigInfo = { ...oemConfig };
    const [anyshareConfig, ...languageConfig] = await Promise.all([
        await oemconfig.get(Section.AnyShare, Product.Default),
        ...LanguageSet.map(async (lang: string) => {
            return await oemconfig.getArray(
                `shareweb_${lang}`,
                Product.Default
            );
        }),
    ]);
    languageConfig.forEach((config) => {
        for (let option of config) {
            if (oemConfig.hasOwnProperty(option["option"])) {
                _oemConfig[option["option"]] = {
                    ..._oemConfig[option["option"]],
                    [option["section"].slice(-5)]: option["value"],
                };
            }
        }
    });
    for (let option of Object.values(_oemConfig)) {
        LanguageSet.forEach((language) => {
            option[language] = getDisplay(option, language);
        });
    }
    return {
        anyshareConfig,
        languageConfig: _oemConfig,
    };
}

/**
 * 获取Module配置
 * @param LanguageSet 语言集合
 * @param oemConfig oem配置
 * @returns
 */
export async function getModuleConfig(): Promise<ModuleConfigs> {
    let configs: any = {};
    const moduleConfig: any = [];
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

export const getNavItemForDeployMini = (lang: Locale) => {
    return [
        {
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
            ],
            defaultSelectedKeys: [lang],
        },
    ];
};

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
        window.location.assign(getFirstPathname(userInfo as UserInfo));
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
            const po = href.indexOf("?");
            const loginerror = href.substring(po + 7, href.length);
            const url = href.substring(0, po);

            if (window.top && window !== window.top) {
                window.top.location.href = url;
                session.set("deploy.loginerror", loginerror);
            } else {
                window.location.href = url;
                session.set("deploy.loginerror", loginerror);
            }
        } else {
            clearUserInfo();
        }
    } else if (cookie.get("deploy.oauth2_token")) {
        try {
            if (window.top && window !== window.top) {
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
 * 检查访问路径
 * @param origin 源路径
 * @param hash 当前hash
 */
export const checkVisitedOrigin = (origin: string, hash: string): void => {
    const lastVisitedOrigin = cookie.get("lastVisitedOrigin");
    cookie.set("lastVisitedOrigin", origin);
    if (lastVisitedOrigin && origin !== unescape(lastVisitedOrigin) && hash) {
        signup(defaultPathList[1]);
    }
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
export const setupAppStyle = async (
    lang: string,
    oemConfig: OemConfigInfo,
    isSecret: boolean
) => {
    setFavicon(
        `data:image/png;base64,${
            isSecret ? oemConfig["favicon.ico"] : newDefaultFavicon
        }`
    );
    setTitle(
        isSecret
            ? oemConfig.product["zh-cn"]
            : lang === "en-us"
            ? "System Console"
            : lang === "zh-tw"
            ? "系統工作台"
            : "系统工作台"
    );
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
    moduleConfigs: ModuleConfigs,
    prefix: string,
    onChangePwd: () => void
): Promise<[boolean, WorkShopFrameWorkConfig]> => {
    const _appConfig: WorkShopFrameWorkConfig = getWorkShopFrameWorkConfig(
        [],
        lang,
        domainInfo,
        userInfo!,
        oemConfig,
        getNavItem(moduleConfigs, lang),
        onChangePwd,
        !!moduleConfigs.isSecret.status
    );
    const urlPrefix = URLPrefixFormatter(prefix, URL_PREFIX_MODE.tail);
    const props = {
        lang,
        username: userInfo?.user?.loginName || userInfo?.username,
        userid: userInfo?.id || "",
        oemConfigs: oemConfig,
        prefix: urlPrefix,
        toggleSideBarShow: toggleSideBarShow,
    };

    const extraProps = getMicroWidgetProps({
        oemConfig,
        lang,
        userInfo,
        prefix: urlPrefix,
    });

    return [
        false,
        workShopFrameWorkConfigFactory(
            _appConfig,
            {
                ...props,
                ...extraProps,
            },
            userInfo
        ),
    ];
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
        session.set("deploy.kickedOut", 20);
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
