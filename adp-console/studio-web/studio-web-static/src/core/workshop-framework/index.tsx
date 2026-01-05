import * as React from "react";
import __ from "../../locale";
import { ObjectType } from "qiankun";
import {
    Locale,
    Config as WorkShopFrameWorkConfig,
    MenuType,
    ThemeModeType,
    MicrofrontedLoadingMode,
    PathMatchMode,
} from "@kweaver-ai/workshop-framework-studio";
import { Domain } from "./declare.d";
import { UserInfo } from "../../api/oauth/declare";
import { RegistryInfo } from "../../api/workstation-backend/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { ReactComponent as BackIcon } from "./assets/back.svg";
import { openOnlineHelp, openPrivacyPolicy, openUserAgreement } from "../about";
import { DIPLogo, defaultLogo } from "./logo";
import { getLocaleByEnv } from "../language";
import { Event } from "../../tools/event";
import { setLanguage } from "../language";
import {
    defaultPathList,
    homePathname,
    space2connector,
    PageTag,
    getPathnameByTag,
} from "../path";
import { signup } from "../auth";
import cookie from "js-cookie";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import {
    editConfig,
    filterApps,
    filterEmptyApps,
    formatApps,
    getSideBarConfig,
    onSelectedKeysChange,
    sortApps,
    splitApps,
} from "./method";
import { microWidgetInfosStore } from "../microWidgetProps/store";
import Icon from "@ant-design/icons";
import { SystemRoleType } from "../roles";
import { Modal } from "antd";
import { getSearchQuerys } from "../bootstrap";
import { BusinessDomain } from "../../components/business-domain";
import { BusinessDomainConfig } from "../../api/business-domain/declare";

const event = new Event();

export const getWorkShopFrameWorkConfig = (
    lang: Locale,
    domain: Domain,
    userInfo: UserInfo,
    oemConfig: OemConfigInfo,
    navItems: any,
    onChangePwd: () => void
): WorkShopFrameWorkConfig => {
    const logo = oemConfig["logo.png"][lang],
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
            listener: async (props: any): Promise<void> => {
                existEditingConfirm(props.isEditing, theme!, () => {
                    setLanguage(props?.name);
                    window.location.reload();
                });
            },
        },
        {
            name: "logout",
            listener: (props: any) => {
                existEditingConfirm(props.isEditing, theme!, () =>
                    signup(defaultPathList[1])
                );
            },
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
            listener: (props: any) => {
                existEditingConfirm(props.isEditing, theme!, () =>
                    onChangePwd()
                );
            },
        },
    ];

    eventMap.forEach(({ name, listener }) => {
        event.registry(name, listener);
    });

    return {
        // appProps: {
        //     language: lang,
        //     token: {
        //         getToken: () => {},
        //         refreshToken: () => {},
        //         onTokenExpired: () => {},
        //     },
        // },
        nav: {
            logo: logo,
            onLogoClick: (isEditing: boolean) =>
                existEditingConfirm(isEditing, theme!, () =>
                    window.location.assign(homePathname)
                ),
            theme: theme,
            themeMode: "light" as ThemeModeType,
            account: {
                name: username,
                items: navItems,
                onClick: (
                    [name, key]: Array<string>,
                    props: Record<string, any>
                ) => {
                    switch (true) {
                        case name === "logout":
                        case name === "change-pwd":
                            event.trigger(name, props);
                            break;
                        case name === "online-help":
                        case name === "user-agreement":
                        case name === "privacy-policy":
                            event.trigger(name);
                            break;
                        default:
                            event.trigger(key, { ...props, name });
                            break;
                    }
                },
            },
            menu: {
                onSelectedKeysChange: onSelectedKeysChange,
            },
            locale: lang,
            extraElements: [
                {
                    icon: (
                        <Icon
                            component={BackIcon}
                            style={{
                                fontSize: "18px",
                            }}
                        />
                    ),
                    key: "home",
                    float: "left",
                    onClick: (key: string, props: any, isEditing: boolean) => {
                        existEditingConfirm(isEditing, theme!, () =>
                            window.location.assign(homePathname)
                        );
                    },
                },
            ],
        },
        microfrontedConfiguration: {
            sandbox: { experimentalStyleIsolation: true },
        },
    };
};

const existEditingConfirm = (
    isEditing: boolean,
    theme: string,
    callback: any
) => {
    if (isEditing) {
        Modal.confirm({
            title: __("您存在尚未保存的内容"),
            content: __(
                "您即将离开编辑菜单界面，尚未保存的内容在离开后将全部清空，请确定是否离开？"
            ),
            okText: __("确认"),
            cancelText: __("取消"),
            onOk: () => {
                callback && callback();
            },
            okButtonProps: {
                style: {
                    background: theme,
                    borderColor: theme,
                },
            },
            cancelButtonProps: {
                style: {
                    color: "rgba(0, 0, 0, 0.85)",
                    borderColor: "#d9d9d9",
                },
            },
        });
    } else {
        callback && callback();
    }
};

export function getFirstAppPathname(
    registryInfos: MenuType[]
): string | undefined {
    if (registryInfos[0]?.children) {
        return getFirstAppPathname(registryInfos[0]?.children);
    } else {
        return registryInfos[0]?.path;
    }
}

/**
 * 组装配置信息
 * @param workShopFrameWorkConfig 初始配置
 * @param registryInfos 注册信息
 * @param props 微服务需要的props
 * @returns
 */
export function workShopFrameWorkConfigFactory(
    workShopFrameWorkConfig: WorkShopFrameWorkConfig,
    registryInfos: { [key: string]: RegistryInfo },
    props: ObjectType,
    pathname: string,
    userInfo: UserInfo,
    getConfig: ((force?: boolean) => void) | undefined,
    pluginsRegistryInfo: { [key: string]: RegistryInfo },
    businessDomainList: BusinessDomainConfig[]
): WorkShopFrameWorkConfig {
    let appConfig: WorkShopFrameWorkConfig = workShopFrameWorkConfig;

    // 过滤customVisible
    const filteredRegistryInfos = filterApps(Object.values(registryInfos));
    // 格式化为qiankun需要的格式
    const formattedRegistryInfos = formatApps(
        filteredRegistryInfos,
        props,
        userInfo
    );
    // 过滤children为空
    const filteredEmptyRegistryInfos = filterEmptyApps(formattedRegistryInfos);
    // 根据orderIndex排序
    const sortedRegistryInfos = sortApps(filteredEmptyRegistryInfos);

    // 根据bottom分割
    const splitedRegistryInfos = splitApps(sortedRegistryInfos);

    if (pathname === homePathname) {
        window.location.assign(
            `${
                getFirstAppPathname(sortedRegistryInfos) ||
                defaultPathList[0] + "/home/"
            }`
        );
    }

    microWidgetInfosStore.microWidgetInfos = [
        ...Object.values(registryInfos),
        ...Object.values(pluginsRegistryInfo),
    ];

    return {
        ...appConfig,
        nav: {
            ...appConfig.nav,
            menu: {
                ...appConfig.nav.menu,
                sideBarMethods: {
                    // 获取默认侧边栏配置
                    getDefaultSideBarConfig: () =>
                        getSideBarConfig(props, userInfo, true),
                    editConfig: (payload) => editConfig(payload, getConfig),
                    getSideBarConfig: () =>
                        getSideBarConfig(props, userInfo, false),
                },
                items: [...splitedRegistryInfos],
            },
            pathMatchMode: "prefix" as PathMatchMode,
            toggleSideBarShow: props.toggleSideBarShow,
            changeCustomPathComponent: props.changeCustomPathComponent,
            getHideSideBar: () =>
                getSearchQuerys(location.search)?.fullscreen === "true",
            onBreadcrumbClick: (name: string, isEditing: boolean) =>
                existEditingConfirm(isEditing, appConfig.nav.theme!, async () =>
                    window.location.assign(
                        await props.history.getBasePathByName(name)
                    )
                ),
            CustomComponent: (
                <BusinessDomain businessDomainList={businessDomainList} />
            ),
            businessDomainText:
                businessDomainList.find(
                    (item) => item.id === props.businessDomainID
                )?.name || "",
        },
        microfrontedLoadingMode: "manual" as MicrofrontedLoadingMode,
    };
}
