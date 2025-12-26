import * as React from "react";
import styles from "./styles.module.css";
import __ from "../../locale";
import validator from "validator";
import { ObjectType } from "qiankun";
import {
    Locale,
    Config as WorkShopFrameWorkConfig,
    MenuType,
    MicrofrontedLoadingMode,
    PathMatchMode,
} from "@aishu-tech/workshop-framework-system";
import { Domain } from "./declare.d";
import { UserInfo } from "../../api/oauth/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { openOnlineHelp, openPrivacyPolicy, openUserAgreement } from "../about";
import { newLogo, oldLogo, newLogo_EN, newLogo_ZHTW } from "./logo";
import { getLocaleByEnv } from "../language";
import { Event } from "../../tools/event";
import { setLanguage } from "../language";
import { consolePath, defaultPathList } from "../path";
import { cloneDeep, noop } from "lodash";
import { signup } from "../auth";
import cookie from "js-cookie";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import { microWidgetConfig } from "../microWidgetConfig/config";
import { filterRoleApps, formatApps } from "../microWidgetConfig/method";
import { onSelectedKeysChange } from "./method";
import { microWidgetInfosStore } from "../microWidgetProps/store";
import { SystemRoleType } from "../roles";
import { ModuleConfigs } from "../../api/module-config/declare";

const event = new Event();

export const getWorkShopFrameWorkConfig = (
    menusItems: any,
    lang: Locale,
    domain: Domain,
    userInfo: UserInfo,
    oemConfig: OemConfigInfo,
    navItems: any,
    onChangePwd: () => void,
    isSecret: boolean
): WorkShopFrameWorkConfig => {
    const logo = isSecret
            ? oemConfig["darklogo.png"]["zh-cn"]
            : lang === "en-us"
            ? newLogo_EN
            : lang === "zh-tw"
            ? newLogo_ZHTW
            : newLogo,
        theme = oemConfig["theme"],
        showOnlineHelp = oemConfig["showOnlineHelp"],
        { protocol, port, host } = domain,
        username =
            userInfo && typeof userInfo !== "string"
                ? userInfo.user["displayName"] || userInfo.user["loginName"]
                : userInfo;

    let prefix = cookie.get("X-Forwarded-Prefix") || "";
    prefix = URLPrefixFormatter(prefix, URL_PREFIX_MODE.tail);

    const eventMap = [
        {
            name: "language",
            listener: async (props: string | undefined): Promise<void> => {
                setLanguage(props!);
                window.location.reload();
            },
        },
        {
            name: "logout",
            listener: () => signup(defaultPathList[1]),
        },
        {
            name: "online-help",
            listener: () => openOnlineHelp(lang),
        },
        {
            name: "user-agreement",
            listener: () =>
                openUserAgreement(lang, host, port, prefix, protocol),
        },
        {
            name: "privacy-policy",
            listener: () =>
                openPrivacyPolicy(lang, host, port, prefix, protocol),
        },
        {
            name: "change-pwd",
            listener: () => onChangePwd(),
        },
    ];

    eventMap.forEach(({ name, listener }) => {
        event.registry(name, listener);
    });

    return {
        appProps: {
            language: lang,
            manualLoadErrorImage: `${window.location.hostname}${
                window.location.port ? ":" + window.location.port : ""
            }${prefix}/deploy/static/media/404.svg`,
        },
        nav: {
            logo: logo,
            theme: theme,
            account: {
                name: username,
                items: navItems,
                onClick: ([name, key]: Array<string>) => {
                    switch (true) {
                        case name === "logout":
                            event.trigger(name);
                            break;
                        case name === "online-help":
                        case name === "user-agreement":
                        case name === "privacy-policy":
                        case name === "change-pwd":
                            event.trigger(name);
                            break;
                        default:
                            event.trigger(key, name);
                            break;
                    }
                },
            },
            extraElements: [],
            menu: {
                items: menusItems,
                onSelectedKeysChange: onSelectedKeysChange,
            },
            locale: lang,
        },
        microfrontedConfiguration: {
            sandbox: { experimentalStyleIsolation: true },
        },
    };
};

/**
 * 组装配置信息
 * @param workShopFrameWorkConfig 初始配置
 * @param registryInfos 注册信息
 * @param props 微服务需要的props
 * @returns
 */
export function workShopFrameWorkConfigFactory(
    workShopFrameWorkConfig: WorkShopFrameWorkConfig,
    props: ObjectType,
    userInfo: UserInfo
): WorkShopFrameWorkConfig {
    let appConfig: WorkShopFrameWorkConfig = workShopFrameWorkConfig;

    // 格式化为qiankun需要的格式
    const formattedRegistryInfos = formatApps(microWidgetConfig, props);

    const filteredRoleRegistryInfos = filterRoleApps(
        formattedRegistryInfos,
        userInfo
    );

    microWidgetInfosStore.microWidgetInfos = [...microWidgetConfig];

    return {
        ...appConfig,
        nav: {
            ...appConfig.nav,
            menu: {
                ...appConfig.nav.menu,
                items: [...filteredRoleRegistryInfos],
            },
            pathMatchMode: "prefix" as PathMatchMode,
            toggleSideBarShow: props.toggleSideBarShow,
        },
        microfrontedLoadingMode: "manual" as MicrofrontedLoadingMode,
    };
}
