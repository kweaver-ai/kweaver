import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { ConfigProvider, setDefaultConfig } from "antd-mobile";
import zhCN from "antd-mobile/es/locales/zh-CN";
import zhTW from "antd-mobile/es/locales/zh-TW";
import enUS from "antd-mobile/es/locales/en-US";
import viVN from "antd-mobile/es/locales/en-US";    // 没有越南语言包
import cookies from "js-cookie";
import {
    MicroAppContext,
    Translations,
    CommonTranslations,
    LocaleType,
} from "./common";
import { generate } from "@ant-design/colors";
import API from "../../api";
import { IntlProvider, MissingTranslationError } from "react-intl";
import { useMount } from "../../hooks";

export type MicroWidgetProps = any;

export interface MicroAppMobileProps {
    microWidgetProps: MicroWidgetProps;
    container?: HTMLElement;
    translations: Translations;
    platform?: "client" | "console";
}

const antdLocales = {
    "zh-cn": zhCN,
    "zh-tw": zhTW,
    "en-us": enUS,
    "vi-vn": viVN
};

const MISSING_MESSAGES: Translations = {
    "en-us": {},
    "zh-cn": {},
    "zh-tw": {},
    "vi-vn": {}
};

if (process.env.NODE_ENV === "development") {
    Object.assign(Error, {
        [`__${APP_NAME}_MISSING_MESSAGES`]: MISSING_MESSAGES,
    });
}

export function MicroAppMobileProvider({
    container,
    microWidgetProps,
    translations,
    platform = "client",
    children,
}: PropsWithChildren<MicroAppMobileProps>) {
    const realLocation: Location =
        (microWidgetProps?.config?.systemInfo?.realLocation as any) ||
        window.location;

    let prefix = cookies.get("X-Forwarded-Prefix") || microWidgetProps?.config?.systemInfo?.as_access_prefix;
    if (!prefix || prefix === "/") {
        prefix = "";
    }
    const prefixUrl: string = realLocation.origin + prefix;

    const colorPalette = useMemo(
        () => generate(microWidgetProps?.theme || "#126ee3"),
        [microWidgetProps?.theme]
    );

    const getLanguage =
        platform === "client"
            ? microWidgetProps?.language?.getLanguage
            : microWidgetProps?.lang;

    const [isSecretMode, setIsSecretMode] = useState<boolean>();

    const locale = useMemo<LocaleType>(() => {
        switch (getLanguage) {
            case "zh-cn":
            case "zh":
                return "zh-cn";
            case "zh-tw":
            case "zh-hk":
                return "zh-tw";
            case "vi-vn":
                return "vi-vn";
            default:
                return "en-us";
        }
    }, [getLanguage]);

    const messages = useMemo(() => {
        return {
            ...CommonTranslations[locale],
            ...translations[locale],
        };
    }, [locale, translations]);

    useEffect(() => {
        // 获取涉密配置开关
        async function getSecretConfig() {
            try {
                const {
                    data: { is_security_level = false },
                } = await API.axios.get(
                    `${prefixUrl}/api/appstore/v1/secret-config`
                );
                setIsSecretMode(is_security_level);
            } catch (error) {
                console.warn(error);
            }
        }
        getSecretConfig();
    }, []);

    useMount(() => {
        const langMap: Record<LocaleType, string> = {
            'zh-cn': 'zh-CN',
            'zh-tw': 'zh-TW',
            'en-us': 'en-US',
            'vi-vn': 'en-US',
        }
        setDefaultConfig({ locale: enUS });
        API.setup({
            baseURL: realLocation.origin,
            pathPrefix: prefix,
            language: langMap[locale],
            token:
                platform === "client"
                    ? microWidgetProps?.token?.getToken?.access_token
                    : typeof microWidgetProps?.getToken === "function"
                        ? microWidgetProps?.getToken()
                        : microWidgetProps?.token?.getToken?.access_token,
            async refreshToken() {
                let oldToken = "";
                if (platform === "console") {
                    oldToken = microWidgetProps?.getToken();
                }
                let refreshTokenFn =
                    platform === "client"
                        ? microWidgetProps?.token?.refreshOauth2Token
                        : microWidgetProps?.refreshToken;
                if (typeof refreshTokenFn === "function") {
                    const token = await refreshTokenFn();
                    if (
                        platform === "console" &&
                        oldToken !== microWidgetProps?.getToken()
                    ) {
                        return microWidgetProps?.getToken();
                    }
                    if (token?.access_token) {
                        return token.access_token;
                    }
                }

                /**
                 * 移动 app 调用 onTokenExpired, 触发页面重新加载
                 */
                if (
                    platform === "client" &&
                    typeof microWidgetProps?.token?.onTokenExpired ===
                    "function"
                ) {
                    microWidgetProps.token.onTokenExpired(401001001);
                }

                // 客户端onTokenExpired已废弃
                if (
                    platform === "console" &&
                    typeof microWidgetProps?.onTokenExpired === "function"
                ) {
                    microWidgetProps?.onTokenExpired();
                }

                throw new Error("refresh token failed");
            },
        });
    });

    return (
        <MicroAppContext.Provider
            value={{
                container,
                microWidgetProps,
                modal: {} as any,
                getTheme: {
                    normal: colorPalette[5] || "#126ee3",
                    hover: colorPalette[4] || "#3a8ff0",
                    active: colorPalette[6] || "#064fbd",
                    disabled: colorPalette[3] || "#65b1fc ",
                },
                message: {} as any,
                destroy() { },
                notification: {} as any,
                realLocation,
                prefixUrl,
                functionid: microWidgetProps?.config?.systemInfo?.functionid,
                functionId: microWidgetProps?.config?.systemInfo?.functionid,
                platform,
                isSecretMode,
                locale,
            }}
        >
            <IntlProvider
                locale={locale}
                messages={messages}
                onError={(e) => {
                    if (e.code === "MISSING_TRANSLATION") {
                        MISSING_MESSAGES[locale][e.descriptor.id] =
                            typeof e.descriptor.defaultMessage === "string"
                                ? e.descriptor.defaultMessage
                                : "";
                    }
                }}
            >
                <ConfigProvider locale={antdLocales[locale]}>
                    {children}
                </ConfigProvider>
            </IntlProvider>
        </MicroAppContext.Provider>
    );
}
