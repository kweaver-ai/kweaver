import cookie from "js-cookie";
import { tokenStore } from "./store";
import { token as tokenRequest } from "../../api/oauth";
import { signup } from "../auth";
import { RegistryInfo } from "../../api/workstation-backend/declare";
import { BusinessDomainConfig } from "../../api/business-domain/declare";
import { session } from "../mediator";

export const hexToRgbA = (hex: string) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = "0x" + c.join("");
        return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",");
    }
    throw new Error("Bad Hex");
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

// 提供给插件刷新token
export const getRefreshToken = async () => {
    try {
        const isHasRefreshToken = cookie.get("studio.refresh_token");
        if (!isHasRefreshToken) {
            throw new Error("参数不合法，缺少refreshToken");
        }
        if (tokenStore.isRefreshingToken) {
            return new Promise((reslove: (value: void) => void) => {
                tokenStore.microWidgetNeedRefreshAPiQueue.push(async () => {
                    reslove();
                });
            });
        } else {
            tokenStore.isRefreshingToken = true;
            await tokenRequest.get();

            await sleep(1000);
            tokenStore.microWidgetNeedRefreshAPiQueue.forEach((callback) =>
                callback.apply(this)
            );
            tokenStore.microWidgetNeedRefreshAPiQueue = [];
            tokenStore.isRefreshingToken = false;
        }
    } catch (error) {
        console.error(error);
        tokenStore.isRefreshingToken = false;
        signup();
    }
};

export const getMicroWidgetByName = (
    registryInfos: RegistryInfo[],
    name: string
): RegistryInfo | undefined => {
    const result = registryInfos.find(
        (registryInfo) => registryInfo.name === name
    );
    if (result) return result;
    for (let i = 0; i < registryInfos.length; i++) {
        if (registryInfos[i].subapp.children[name]) {
            return registryInfos[i].subapp.children[name];
        } else {
            const data = getMicroWidgetByName(
                Object.values(registryInfos[i].subapp.children),
                name
            );
            if (data) return data;
        }
    }
    return undefined;
};

export const formatEntry = (
    registryInfo: RegistryInfo | undefined,
    prefix: string
) => {
    if (!registryInfo) return undefined;
    if (Object.keys(registryInfo?.subapp?.children).length > 0) {
        let newChildren = {};
        Object.keys(registryInfo?.subapp?.children).forEach((key) => {
            newChildren = {
                ...newChildren,
                [key]: formatEntry(registryInfo?.subapp?.children[key], prefix),
            };
        });
        return {
            ...registryInfo,
            subapp: {
                ...registryInfo.subapp,
                children: newChildren,
            },
        };
    } else {
        return {
            ...registryInfo,
            subapp: {
                ...registryInfo.subapp,
                entry: (registryInfo?.subapp?.entry as string)?.replace(
                    /\/\/ip:port/,
                    `${location.protocol}//${location.host}${prefix}`
                ),
            },
        };
    }
};

// 格式化entry  (//ip:port/xxx -> ${location.protocol}/${prefix}/xxx)
export const formatEntryForArray = (
    registryInfos: RegistryInfo[],
    prefix: string
) => {
    return registryInfos.map((registryInfo) => {
        return formatEntry(registryInfo, prefix);
    });
};

export const changeBusinessDomain = async (
    businessDomainID: string,
    businessDomainList: BusinessDomainConfig[],
    getConfig: (forceSetConfig?: boolean) => Promise<void>
) => {
    if (businessDomainList.some((item) => item.id === businessDomainID)) {
        const currentBusinessDomainID = session.get("studio.businessDomainID");
        if (currentBusinessDomainID !== businessDomainID) {
            session.set("studio.businessDomainID", businessDomainID);
            await getConfig(true);
        }
    } else {
        throw new Error("业务域ID错误");
    }
};
