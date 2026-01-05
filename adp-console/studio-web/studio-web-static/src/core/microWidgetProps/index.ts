import { loadMicroApp } from "qiankun";
import { UserInfo } from "../../api/oauth/declare";
import { OemConfigInfo } from "../../api/oem-config/declare";
import { Locale } from "@kweaver-ai/workshop-framework-studio";
import { generate } from "@ant-design/colors";
import {
    formatEntry,
    formatEntryForArray,
    getMicroWidgetByName,
    getRefreshToken,
    hexToRgbA,
} from "./utils";
import cookie from "js-cookie";
import { signup } from "../auth";
import { microWidgetInfosStore } from "./store";
import { getMicroWidgetMessage } from "./getMicroWidgetMessage";
import { SysUserRoles } from "../roles";

export const getMicroWidgetProps = ({
    oemConfig,
    lang,
    userInfo,
    prefix,
}: {
    oemConfig: OemConfigInfo;
    lang: Locale;
    userInfo: UserInfo;
    prefix: string;
}) => {
    return {
        _qiankun: {
            get loadMicroApp() {
                return loadMicroApp;
            },
        },
        config: {
            get systemInfo() {
                const config = {
                    location: window.location,
                    as_access_prefix: prefix,
                };
                return config;
            },
            get getTheme() {
                const colorPalette = generate(oemConfig.theme || "#126EE3");

                return {
                    disabled: colorPalette[3],
                    hover: colorPalette[4],
                    normal: colorPalette[5],
                    active: colorPalette[6],
                    disabledRgba: hexToRgbA(colorPalette[3]),
                    hoverRgba: hexToRgbA(colorPalette[4]),
                    normalRgba: hexToRgbA(colorPalette[5]),
                    activeRgba: hexToRgbA(colorPalette[6]),
                };
            },
            getMicroWidgetByName(name: string, isFormatEntry?: boolean) {
                const microWidgetInfo = getMicroWidgetByName(
                    microWidgetInfosStore.microWidgetInfos,
                    name
                );
                if (isFormatEntry === true) {
                    return formatEntry(microWidgetInfo, prefix);
                } else {
                    return microWidgetInfo;
                }
            },
            getMicroWidgets(isFormatEntry?: boolean) {
                if (isFormatEntry === true) {
                    return formatEntryForArray(
                        microWidgetInfosStore.microWidgetInfos,
                        prefix
                    );
                } else {
                    return microWidgetInfosStore.microWidgetInfos;
                }
            },
            get userInfo() {
                if (userInfo && typeof userInfo !== "string") {
                    return {
                        ...userInfo,
                        user: {
                            ...userInfo?.user,
                            roles: userInfo?.user?.roles?.map((roleInfo) => {
                                return {
                                    ...roleInfo,
                                    role: SysUserRoles[roleInfo.id],
                                };
                            }),
                        },
                    };
                }
                return userInfo;
            },
            // get userRoles() {
            //     if (userInfo && typeof userInfo !== "string") {
            //         return userInfo?.user?.roles
            //             ?.map((roleInfo) => {
            //                 return SysUserRoles[roleInfo.id];
            //             })
            //             .filter((item) => item);
            //     }
            //     return [];
            // },
        },
        language: {
            get getLanguage() {
                return lang;
            },
        },
        token: {
            onTokenExpired() {
                signup();
            },
            refreshOauth2Token: async () => {
                await getRefreshToken();
                return {
                    access_token: cookie.get("studio.oauth2_token") || "",
                    id_token: cookie.get("studio.id_token") || "",
                    refresh_token: cookie.get("studio.refresh_token") || "",
                };
            },
            get getToken() {
                return {
                    access_token: cookie.get("studio.oauth2_token") || "",
                    id_token: cookie.get("studio.id_token") || "",
                    refresh_token: cookie.get("studio.refresh_token") || "",
                };
            },
        },
        history: {
            async getBasePathByName(microWidgetName: string) {
                const micoroWidgetInfo = getMicroWidgetByName(
                    microWidgetInfosStore.microWidgetInfos,
                    microWidgetName
                );
                return `${prefix}/studio${micoroWidgetInfo?.app?.pathname}`;
            },
            navigateToMicroWidget({
                name,
                path = "",
                isNewTab = false,
            }: {
                name: string;
                path?: string;
                isNewTab?: boolean;
            }) {
                const micoroWidgetInfo = getMicroWidgetByName(
                    microWidgetInfosStore.microWidgetInfos,
                    name
                );
                window.open(
                    `${location.protocol}//${location.hostname}${prefix}/studio${micoroWidgetInfo?.app?.pathname}${path}`,
                    isNewTab ? "_blank" : "_self"
                );
            },
        },
        component: {
            toast: getMicroWidgetMessage(),
        },
    };
};
