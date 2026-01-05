import React from "react";
import { URLPrefixFormatter, URL_PREFIX_MODE } from "../url";
import cookie from "js-cookie";
import Image from "./image";
import { defaultPathList } from "../path";
import { getMicroWidgetByName } from "../microWidgetProps/utils";
import { microWidgetInfosStore } from "../microWidgetProps/store";
import { OpenMethod, MicroWidgetInfo } from "../microWidgetConfig/index.d";
// import { registryConfig, registryInfo } from "../../api/workstation-backend";
// import { handleError } from "../../tools/request-utils/handleError";
import { UserInfo } from "../../api/oauth/declare";
import { defaultAccountNames } from "../roles";
import { getLocaleByEnv } from "../language";
import { MenuType } from "@kweaver-ai/workshop-framework-system";

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
    ) as any;
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
