import React, {
    createContext,
    FC,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Modal,
    ConfigProvider,
    message as antdMessage,
    notification as antNotification,
} from "antd";
import cookies from "js-cookie";
import zh from "antd/es/locale/zh_CN";
import tw from "antd/es/locale/zh_TW";
import en from "antd/es/locale/en_US";
import vi from "antd/es/locale/vi_VN";
import API from "../../api";
import { useMount } from "../../hooks/use-mount";
import { generate } from "@ant-design/colors";
import { UserGetRes } from "@applet/api/lib/efast";
import { IntlProvider } from "react-intl";
import "moment/locale/zh-cn";
import "moment/locale/zh-tw";
import "moment/locale/vi";
import moment from "moment";
import {
    MicroAppContext,
    NavigationContext,
    IMicroWidgetProps,
    Translations,
    NavigationItem,
    DocumentID,
    CommonTranslations,
    LocaleType,
} from "./common";

export const MicroAppProvider: FC<{
    microWidgetProps: Partial<any & IMicroWidgetProps>;
    container?: HTMLElement;
    translations: Translations;
    prefixCls: string;
    iconPrefixCls: string;
    platform?: "client" | "console" | "operator";
    supportCustomNavigation?: boolean;
    strategyMode?: string;
}> = ({
    microWidgetProps,
    container = document.body,
    translations,
    prefixCls,
    iconPrefixCls,
    platform = "client",
    supportCustomNavigation = true,
    strategyMode,
    children,
}) => {
        const realLocation: Location =
            (microWidgetProps?.config?.systemInfo?.realLocation as any) ||
            window.location;
        // 富客户端无法获取到cookie。从cookie读不到尝试从插件props获取
        let prefix = cookies.get("X-Forwarded-Prefix") || microWidgetProps?.config?.systemInfo?.as_access_prefix;
        if (!prefix || prefix === "/") {
            prefix = "";
        }
        const prefixUrl: string = realLocation.origin + prefix;
        const colorPalette = () => generate(microWidgetProps?.theme || "#126ee3");
        const getLanguage =
            platform === "client"
                ? microWidgetProps?.language?.getLanguage
                : microWidgetProps?.lang;

        const locale = (getLanguage as keyof Translations) || "zh-cn";

        useMount(() => {
            const langMap: Record<LocaleType, string> = {
                'zh-cn': 'zh-CN',
                'zh-tw': 'zh-TW',
                'en-us': 'en-US',
                'vi-vn': 'en-US',
            }

            ConfigProvider.config({
                prefixCls,
                iconPrefixCls,
            });

            API.setup({
                baseURL: realLocation.origin,
                language: langMap[locale],
                pathPrefix: prefix,
                token: microWidgetProps?.token?.getToken?.access_token ||
                cookies.get("client.oauth2_token"),
                businessDomainID: microWidgetProps?.businessDomainID,
                async refreshToken() {
                    let oldToken = "";
                    // if (platform === "console") {
                    //     oldToken = microWidgetProps?.getToken();
                    // }
                    let refreshTokenFn = microWidgetProps?.token?.refreshOauth2Token
                            || microWidgetProps?.refreshToken;
                    if (typeof refreshTokenFn === "function") {
                        const token = await refreshTokenFn();
                        // if (
                        //     platform === "console" &&
                        //     oldToken !== microWidgetProps?.getToken()
                        // ) {
                        //     return microWidgetProps?.getToken();
                        // }
                        if (token?.access_token) {
                            return token.access_token;
                        }
                    }
                    // 客户端onTokenExpired已废弃
                    // if (
                    //     platform === "console" &&
                    //     typeof microWidgetProps?.onTokenExpired === "function"
                    // ) {
                    //     microWidgetProps?.onTokenExpired();
                    // }
                    throw new Error("refresh token failed");
                },
            });
        });
        const [modal, modalContextHolder] = Modal.useModal();
        const [message, messageContextHolder] = antdMessage.useMessage();
        const [notification, notificationContextHolder] =
            antNotification.useNotification();
        const [userInfo, setUserInfo] = useState<UserGetRes>();

        const [isSecretMode, setIsSecretMode] = useState<boolean>();

        const [antdLocale, setAntdLocale] = useState(zh);
        const [navigation, setNavigation] = useState<
            Record<string, NavigationItem>
        >({
            documents: {
                id: "480415569892393210",
                locales: {
                    zh_cn: "文档中心",
                    zh_tw: "文件中心",
                    en_us: "Documents",
                    vi_vn: "Trung tâm tư liệu"
                },
                page_type: "inner",
                page_config: DocumentID,
                open_type: "docked",
                nodes: [],
            },
        });

        useEffect(() => {
            const locale = getLanguage || "zh-cn";
            switch (locale) {
                case "zh-cn":
                case "zh":
                    moment.locale("zh-cn");
                    setAntdLocale(zh);
                    return;
                case "zh-tw":
                    moment.locale("zh-tw");
                    setAntdLocale(tw);
                    return;
                case "vi-vn":
                    moment.locale("vi");
                    setAntdLocale(vi);
                    return;
                default:
                    moment.locale("en-us");
                    setAntdLocale(en);
                    return;
            }
        }, [getLanguage]);

        useEffect(() => {
            const getTargetNavigation = (
                page_config: string,
                data: NavigationItem[]
            ) => {
                let res;
                if (data?.length) {
                    data.forEach((item) => {
                        if (item.page_config === page_config) {
                            res = item;
                        } else {
                            const childRes = getTargetNavigation(
                                page_config,
                                item.nodes
                            );
                            if (childRes) {
                                res = childRes;
                            }
                        }
                    });
                }
                return res;
            };
            const getNavigationConfig = async () => {
                try {
                    const { data } = await API.axios.get(
                        `${prefixUrl}/api/portal-management/v1/portal-navigation/items`
                    );
                    const documents = getTargetNavigation(DocumentID, data);
                    if (documents) {
                        setNavigation((pre) => ({ ...pre, documents }));
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            if (supportCustomNavigation) {
                getNavigationConfig();
            }
        }, []);

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

        useEffect(() => {
            const getUserInfo = async () => {
                try {
                    const { data } = await API.efast.eacpV1UserGetPost();
                    setUserInfo(data);
                } catch (error) {
                    console.error(error);
                }
            };
            if (platform === "client") {
                getUserInfo();
            }
        }, [platform]);

        const messages = useMemo(() => {
            return {
                ...CommonTranslations[locale],
                ...translations[locale],
            };
        }, [locale, translations]);

        const getNavigationLocale = useCallback(
            (name: string) => {
                const lang = getLanguage || "zh-cn";
                switch (lang) {
                    case "zh-tw":
                        return navigation[name].locales["zh_tw"];
                    case "en-us":
                        return navigation[name].locales["en_us"];
                    case "vi-vn":
                        return navigation[name].locales["vi_vn"];
                    default:
                        return navigation[name].locales["zh_cn"];
                }
            },
            [getLanguage, navigation]
        );

        return (
            <MicroAppContext.Provider
                value={{
                    container,
                    microWidgetProps,
                    modal,
                    getTheme: {
                        normal: colorPalette()[5] || "#126ee3",
                        hover: colorPalette()[4] || "#3a8ff0",
                        active: colorPalette()[6] || "#064fbd",
                        disabled: colorPalette()[3] || "#65b1fc ",
                    },
                    message: microWidgetProps?.components?.toast || message,
                    destroy: antdMessage.destroy,
                    notification,
                    realLocation,
                    prefixUrl,
                    functionid: microWidgetProps?.config?.systemInfo?.functionid,
                    functionId: microWidgetProps?.config?.systemInfo?.functionid,
                    platform,
                    userInfo,
                    isSecretMode,
                    strategyMode,
                    locale,
                }}
            >
                <NavigationContext.Provider
                    value={{ config: navigation, getLocale: getNavigationLocale }}
                >
                    <IntlProvider
                        locale={getLanguage || "zh-cn"}
                        messages={messages}
                        onError={(e) => {
                            if (
                                process.env.NODE_ENV === "development" &&
                                e.code === "MISSING_TRANSLATION" &&
                                e.descriptor?.id
                            ) {
                                const missingMessages =
                                    (Error as any)[
                                    `__${APP_NAME}_MISSING_MESSAGES`
                                    ] ||
                                    ((Error as any)[
                                        `__${APP_NAME}_MISSING_MESSAGES`
                                    ] = {});
                                const messages =
                                    missingMessages[locale] ||
                                    (missingMessages[locale] = {});
                                messages[e.descriptor.id!] =
                                    typeof e.descriptor.defaultMessage === "string"
                                        ? e.descriptor.defaultMessage
                                        : "";
                            }
                        }}
                    >
                        <ConfigProvider
                            locale={antdLocale}
                            getPopupContainer={() => container}
                            prefixCls={prefixCls}
                            iconPrefixCls={iconPrefixCls}
                            autoInsertSpaceInButton={false}
                        >
                            <>
                                {children}
                                <Fragment key="modal">
                                    {modalContextHolder}
                                </Fragment>
                                <Fragment key="message">
                                    {messageContextHolder}
                                </Fragment>
                                <Fragment key="notification">
                                    {notificationContextHolder}
                                </Fragment>
                            </>
                        </ConfigProvider>
                    </IntlProvider>
                </NavigationContext.Provider>
            </MicroAppContext.Provider>
        );
    };
