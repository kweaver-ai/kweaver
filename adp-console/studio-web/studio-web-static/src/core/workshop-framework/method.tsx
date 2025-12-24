import React from "react";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import cookie from "js-cookie";
import Image from "./image";
import { defaultPathList } from "../path";
import { getMicroWidgetByName } from "../microWidgetProps/utils";
import { microWidgetInfosStore } from "../microWidgetProps/store";
import {
    OpenMethod,
    RegistryInfo,
} from "../../api/workstation-backend/declare.d";
import { registryConfig, registryInfo } from "../../api/workstation-backend";
import { handleError } from "../../tools/request-utils/handleError";
import { CDLManage } from "../../components/cdl-manage";
import { UserInfo } from "../../api/oauth/declare";
import { defaultAccountNames } from "../roles";
import { getLocaleByEnv } from "../language";
import { MenuType } from "@aishu-tech/workshop-framework-studio";

export const getIcon = (icon: string) => {
    if (!icon) return undefined;
    const urlPrefix = cookie.get("X-Forwarded-Prefix") || "";
    const prefix = URLPrefixFormatter(urlPrefix, URL_PREFIX_MODE.tail);
    const src = icon?.replace("ip:port", `${location.host}${prefix}`);
    return (
        <span>
            <Image
                src={
                    (src?.includes("localhost") ? "" : location.protocol) + src
                } // 方便其他团队本地调试
            />
        </span>
    );
};

export const getPageTagByPathname = (pathname: string) => {
    const match = pathname.match(/studio\/([^/]+)/);
    return match ? match[1] : "";
};

// 选中菜单项变化事件
export const onSelectedKeysChange = (
    keys: string[],
    updateRoute: (keys: string[]) => void,
    toggleSideBarShow: (isShow: boolean) => void,
    changeCustomPathComponent: (customPathComponent: any) => void
) => {
    const { protocol, host } = window.location;
    const urlPrefix = cookie.get("X-Forwarded-Prefix") || "";
    const prefix = URLPrefixFormatter(urlPrefix, URL_PREFIX_MODE.tail);
    const name = keys[keys.length - 1];
    const micoroWidgetInfo = getMicroWidgetByName(
        microWidgetInfosStore.microWidgetInfos,
        name!
    );
    if (micoroWidgetInfo?.app?.openMethod === OpenMethod.Blank) {
        window.open(
            (micoroWidgetInfo?.subapp.entry as string).replace(
                /\/\/ip:port/,
                `${protocol}//${host}${prefix}`
            ),
            "_blank"
        );
    } else {
        toggleSideBarShow(true);
        changeCustomPathComponent(null);
        updateRoute(keys);
    }
};

// 过滤掉不在侧边栏展示的插件
export function filterApps(registryInfos: RegistryInfo[]): RegistryInfo[] {
    // 过滤掉customVisible为false的应用
    const filteredApps = registryInfos.filter(
        (registryInfo) => registryInfo.app.customVisible !== false
    );
    // 处理每个应用的subapp.children
    return filteredApps.map((registryInfo) => {
        let newSubapp = registryInfo.subapp;
        if (Object.keys(registryInfo?.subapp?.children).length !== 0) {
            const originalChildren = registryInfo.subapp.children;
            const filteredChildren = {};

            Object.keys(originalChildren).forEach((key) => {
                const childNode = originalChildren[key];
                const filteredChildApps = filterApps([childNode]);
                if (filteredChildApps.length > 0) {
                    filteredChildren[key] = filteredChildApps[0];
                }
            });

            newSubapp = { ...registryInfo.subapp, children: filteredChildren };
        }

        return { ...registryInfo, subapp: newSubapp };
    });
}

// 格式化插件信息为qiankun框架所需的格式
export function formatApps(
    registryInfos: RegistryInfo[],
    props: any,
    userInfo: UserInfo
): any[] {
    return registryInfos.map((registryInfo) => {
        const {
            app: {
                textZHCN,
                textZHTW,
                textENUS,
                icon,
                pathname,
                customVisible,
                type,
                isDefaultOpen,
            },
            bottom,
            subapp,
            orderIndex,
            pageTag,
            name,
        } = registryInfo;
        if (name === "cdl-manage") {
            const username =
                userInfo && typeof userInfo !== "string"
                    ? userInfo.user["loginName"] || userInfo.user["displayName"]
                    : userInfo;
            if (defaultAccountNames.includes(username)) {
                return null;
            }
            return {
                label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                orderIndex,
                pageTag,
                customVisible,
                bottom,
                key: name,
                path: `${defaultPathList[0]}${pathname}`,
                registryRouter: subapp?.registryRouter
                    ? `${defaultPathList[0]}${subapp?.registryRouter}`
                    : undefined,
                icon: getIcon(icon),
                app: () => (
                    <CDLManage
                        entry={subapp.entry as string}
                        label={getLocaleByEnv(textZHCN, textZHTW, textENUS)}
                        prefix={props.prefix}
                    />
                ),
            };
        }
        if (Object.keys(registryInfo?.subapp?.children).length === 0) {
            if (registryInfo?.subapp?.entry) {
                return {
                    label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                    orderIndex,
                    pageTag,
                    bottom,
                    customVisible,
                    key: name,
                    path: `${defaultPathList[0]}${pathname}`,
                    registryRouter: subapp?.registryRouter
                        ? `${defaultPathList[0]}${subapp?.registryRouter}`
                        : undefined,
                    icon: getIcon(icon),
                    app: {
                        name: registryInfo.name,
                        entry: (subapp?.entry as string)?.replace(
                            "ip:port",
                            `${window.location.hostname}${
                                window.location.port
                                    ? ":" + window.location.port
                                    : ""
                            }${props.prefix}`
                        ),
                        props: subapp.baseRouter
                            ? {
                                  ...props,
                                  baseRouter: subapp.baseRouter,
                                  history: {
                                      ...props.history,
                                      getBasePath: `${defaultPathList[0]}${
                                          subapp?.registryRouter || pathname
                                      }`,
                                  },
                              }
                            : {
                                  ...props,
                                  history: {
                                      ...props.history,
                                      getBasePath: `${defaultPathList[0]}${
                                          subapp?.registryRouter || pathname
                                      }`,
                                  },
                              },
                    },
                };
            } else if (registryInfo?.subapp?.useEntryByRoute) {
                return {
                    label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                    orderIndex,
                    pageTag,
                    bottom,
                    customVisible,
                    key: name,
                    path: `${defaultPathList[0]}${pathname}`,
                    registryRouter: subapp?.registryRouter
                        ? `${defaultPathList[0]}${subapp?.registryRouter}`
                        : undefined,
                    icon: getIcon(icon),
                };
            } else {
                return null;
            }
        } else {
            return {
                label: getLocaleByEnv(textZHCN, textZHTW, textENUS),
                key: name,
                orderIndex,
                pageTag,
                bottom,
                customVisible,
                isDefaultOpen,
                icon: getIcon(icon),
                type: formatType(type),
                children: Object.keys(registryInfo?.subapp?.children).map(
                    (key: string) => {
                        return formatApps(
                            [registryInfo?.subapp?.children[key]],
                            props,
                            userInfo
                        )[0];
                    }
                ),
                ...(registryInfo?.subapp?.entry
                    ? {
                          path: `${defaultPathList[0]}${pathname}`,
                          registryRouter: subapp?.registryRouter
                              ? `${defaultPathList[0]}${subapp?.registryRouter}`
                              : undefined,
                          app: {
                              name: registryInfo.name,
                              entry: (subapp?.entry as string)?.replace(
                                  "ip:port",
                                  `${window.location.hostname}${
                                      window.location.port
                                          ? ":" + window.location.port
                                          : ""
                                  }${props.prefix}`
                              ),
                              props: subapp.baseRouter
                                  ? {
                                        ...props,
                                        baseRouter: subapp.baseRouter,
                                        history: {
                                            ...props.history,
                                            getBasePath: `${
                                                defaultPathList[0]
                                            }${
                                                subapp?.registryRouter ||
                                                pathname
                                            }`,
                                        },
                                    }
                                  : {
                                        ...props,
                                        history: {
                                            ...props.history,
                                            getBasePath: `${
                                                defaultPathList[0]
                                            }${
                                                subapp?.registryRouter ||
                                                pathname
                                            }`,
                                        },
                                    },
                          },
                      }
                    : {}),
            };
        }
    });
}

// 过滤null对象以及children为空数组的
export function filterEmptyApps(registryInfos: MenuType[]): any[] {
    return registryInfos.filter((registryInfo) => {
        if (registryInfo?.children) {
            if (registryInfo?.children.every((item) => !item)) return false;
            registryInfo.children = filterEmptyApps(registryInfo.children);
            return registryInfo.children?.length;
        } else {
            return registryInfo;
        }
    });
}

export function sortApps(
    registryInfos: (MenuType & { orderIndex: number })[]
): (MenuType & { pageTag?: string })[] {
    const sorted = registryInfos.sort((a, b) => {
        return a.orderIndex - b.orderIndex;
    });
    return sorted.map((item) => {
        if (item.children?.length) {
            return {
                ...item,
                children: sortApps(item.children as any),
            };
        }
        return item;
    });
}

export function splitApps(
    registryInfos: (MenuType & { bottom?: boolean; pageTag?: string })[]
): any[] {
    let topRegistryInfos: (MenuType & { pageTag?: string })[] = [];
    let bottomRegistryInfos: (MenuType & { pageTag?: string })[] = [];
    registryInfos.forEach((item) => {
        if (item?.bottom) {
            bottomRegistryInfos = [...bottomRegistryInfos, item];
        } else {
            topRegistryInfos = [...topRegistryInfos, item];
        }
    });
    return [
        ...topRegistryInfos,
        ...(topRegistryInfos.length && bottomRegistryInfos.length
            ? [{ type: "divider" }]
            : []),
        ...bottomRegistryInfos,
    ];
}

export const getSideBarConfig = async (
    props: any,
    userInfo: UserInfo,
    isDefault: boolean
) => {
    try {
        const registryInfos: { [key: string]: RegistryInfo } = (
            await registryInfo.getInfoByName(
                "root",
                isDefault ? { clean: true } : {}
            )
        ).subapp.children; //特殊处理

        // 格式化为qiankun需要的格式
        const formattedRegistryInfos = formatApps(
            Object.values(registryInfos),
            props,
            userInfo
        );
        // 过滤children为空
        const filteredEmptyRegistryInfos = filterEmptyApps(
            formattedRegistryInfos
        );
        // 根据orderIndex排序
        const sortedRegistryInfos = sortApps(filteredEmptyRegistryInfos);

        // 根据bottom分割菜单项
        const splitedRegistryInfos = splitApps(sortedRegistryInfos);

        return splitedRegistryInfos;
    } catch (e) {
        handleError(e);
    }
};

let sleepTimeOut: number = 0;
const sleep = async (time: number) => {
    clearTimeout(sleepTimeOut);
    return new Promise((resolve) => {
        sleepTimeOut = window.setTimeout(() => {
            resolve(true);
        }, time);
    });
};

export const editConfig = async (
    payload: object,
    getConfig?: (force?: boolean) => void
) => {
    try {
        await registryConfig.batchEditConfig(payload);
        await sleep(500);
        getConfig && getConfig();
    } catch (e) {
        handleError(e);
        return null;
    }
};

// 格式化菜单类型
export const formatType = (type?: string) => {
    switch (type) {
        case "group":
        case undefined:
            return "group";

        default:
            return undefined;
    }
};
