import React, { createContext } from "react";
import commonZh from "../../locales/zh-cn.json";
import commonEn from "../../locales/en-us.json";
import commonTw from "../../locales/zh-tw.json";
import commonVi from "../../locales/vi-vn.json";
import { type MessageInstance } from "antd/es/message";
import { type ModalStaticFunctions } from "antd/es/modal/confirm";
import { type NotificationInstance } from "antd/es/notification";

export { type MessageInstance } from "antd/es/message";
export { type ModalStaticFunctions } from "antd/es/modal/confirm";

export interface IMicroWidgetProps {
    config?: any;
    getToken?: () => string;
    refreshToken?: () => Promise<any>;
    onTokenExpired?: () => void;
    lang?: any;
    theme?: string;
    components?: Record<string, React.ComponentType>;
    getUserInfo?: () => { id: string };
    mountComponent?: any;
    unmountComponent?: any;
    [key: string]: any;
}

export interface ITheme {
    normal: string;
    hover: string;
    active: string;
    disabled: string;
}

export interface MicroAppContextType {
    container: HTMLElement;
    microWidgetProps: Partial<any & IMicroWidgetProps>;
    modal: Omit<ModalStaticFunctions, "warn">;
    message: MessageInstance;
    destroy: () => void;
    notification: NotificationInstance;
    realLocation: Location;
    prefixUrl: string;
    functionid: string;
    functionId: string;
    getTheme?: ITheme;
    platform: "client" | "console" | "operator";
    userInfo?: { userid: string; name: string;[key: string]: any };
    isSecretMode?: boolean;
    strategyMode?: string;
    locale: LocaleType;
}

function notImpl(name: string): () => any {
    return () => console.error("Function not implemented");
}

const fakeModal: Omit<ModalStaticFunctions, "warn"> = {
    info: notImpl("info"),
    success: notImpl("success"),
    error: notImpl("error"),
    warning: notImpl("warning"),
    confirm: notImpl("confirm"),
};

const fakeMessage: MessageInstance = {
    info: notImpl("info"),
    success: notImpl("success"),
    error: notImpl("error"),
    warning: notImpl("warning"),
    loading: notImpl("loading"),
    open: notImpl("open"),
};

const fakeNotification: NotificationInstance = {
    info: notImpl("info"),
    success: notImpl("success"),
    error: notImpl("error"),
    warning: notImpl("warning"),
    open: notImpl("open"),
};

export const MicroAppContext = createContext<MicroAppContextType>({
    container: document.body,
    microWidgetProps: {},
    modal: fakeModal,
    message: fakeMessage,
    destroy: () => { },
    notification: fakeNotification,
    realLocation: window.location,
    prefixUrl: window.location.origin,
    functionid: "",
    functionId: "",
    platform: "client",
    isSecretMode: undefined,
    strategyMode: "",
    locale: 'en-us'
});

/**导航栏配置中文档中心固定的page_config */
export const DocumentID = "const_230411xext1ej4sur94lbmt";

export type LanguageType = "zh_cn" | "zh_tw" | "en_us" | "vi_vn";
export type LocaleType = 'zh-cn' | 'zh-tw' | 'en-us' | 'vi-vn'

export interface NavigationItem {
    id: string;
    locales: Record<LanguageType, string>;
    page_type: string;
    page_config: string;
    open_type: string;
    nodes: NavigationItem[];
}

export type NavigationContextType = {
    config?: Record<string, NavigationItem>;
    getLocale?: (name: string) => string;
};

export const NavigationContext = createContext<NavigationContextType>({});

export type Translations = Record<LocaleType, Record<string, string>>

export const CommonTranslations: Translations = {
    "zh-cn": commonZh,
    "zh-tw": commonTw,
    "en-us": commonEn,
    "vi-vn": commonVi,
};
