import session from "../session";

export interface UserAgent {
    // 系统架构 32/64 位
    platform?: number;

    // 浏览器详细版本
    version?: number;

    // 浏览器型号
    app?: number;

    // 是否是移动设备
    mobile?: boolean;

    // 操作系统
    os?: any;
}

/**
 * 浏览器类型
 */
export enum Browser {
    MSIE,
    Edge,
    Safari,
    Firefox,
    Chrome,
    WeChat,
}

/**
 * 系统类型
 */
export enum OSType {
    Windows,
    Mac,
    Android,
    IOS,
    WindowsPhone,
}

/**
 * 支持的语言
 */
enum SupportedLanguage {
    ZH_CN = "zh-cn",
    ZH_TW = "zh-tw",
    EN_US = "en-us",
    VI_VN = "vi-vn",
}

/**
 * 获取UserAgent信息
 */
export function userAgent(): UserAgent {
    const userAgent = window.navigator.userAgent;
    const os = (() => {
        switch (true) {
            case /Iphone|Ipad|Ipod/i.test(userAgent):
                return OSType.IOS;

            case /Android/i.test(userAgent):
                return OSType.Android;

            default:
                return undefined;
        }
    })();
    const app = (() => {
        switch (true) {
            // 微信中含有Safari
            case /MicroMessenger/i.test(userAgent):
                return Browser.WeChat;

            case /Edge/i.test(userAgent):
                return Browser.Edge;

            case /Trident/i.test(userAgent):
                return Browser.MSIE;

            // Chrome的UA包含Safari字样，Safari的UA不包含Chrome字样，因此要区分Chrome还是Safari必须先判断Chrome字样
            case /Chrome\/[\d.]+/i.test(userAgent):
                return Browser.Chrome;

            case /Safari\/[\d.]+$/i.test(userAgent):
                return Browser.Safari;

            case /Firefox\/[\d.]+$/i.test(userAgent):
                return Browser.Firefox;
        }
    })();
    const platform =
        /win64|wow64/i.test(userAgent.toLowerCase()) ||
        navigator.platform === "MacIntel"
            ? 64
            : 32;
    const mobile = /Mobile/i.test(navigator.userAgent);
    const version = (() => {
        let verMatch;

        switch (app) {
            case Browser.MSIE:
                switch (true) {
                    case userAgent.indexOf("Trident/4.0") !== -1:
                        return 8;

                    case userAgent.indexOf("Trident/5.0") !== -1:
                        return 9;

                    case userAgent.indexOf("Trident/6.0") !== -1:
                        return 10;

                    case userAgent.indexOf("Trident/7.0") !== -1:
                        return 11;

                    default:
                        return undefined;
                }

            case Browser.Edge:
                verMatch = userAgent.match(/Edge\/([\d.]+)/i);
                return verMatch ? Number(verMatch[1]) : undefined;

            case Browser.Safari:
                verMatch = userAgent.match(/Safari\/([\d.]+)/i);
                return verMatch ? Number(verMatch[1]) : undefined;

            case Browser.Firefox:
                verMatch = userAgent.match(/Firefox\/([\d.]+)/i);
                return verMatch ? Number(verMatch[1]) : undefined;

            case Browser.Chrome:
                verMatch = userAgent.match(/Chrome\/([\d.]+)/i);
                return verMatch ? Number(verMatch[1]) : undefined;

            case Browser.WeChat:
                verMatch = userAgent.match(/MicroMessenger\/([\d.]+)/i);
                return verMatch ? Number(verMatch[1]) : undefined;
        }
    })();

    return {
        app,
        mobile,
        version,
        platform,
        os,
    };
}

/**
 * 获取浏览器当前语言临时解决方案
 * @see http://jira.eisoo.com:8080/browse/DAEG-18392
 */
export function envLanguage() {
    const getLanguageHash = () => {
        const [match, language] = /\blang=([a-zA-Z-]+)\b/.exec(
            window.location.hash
        ) || [undefined, undefined];

        if (language) {
            session.set("lang", language.toLowerCase());

            return language;
        }
    };
    const navigatorLanguage = (
        window.navigator.language || (window.navigator as any).browserLanguage
    ).toLowerCase();
    const transLanguage =
        navigatorLanguage === "vi" ? "vi-vn" : navigatorLanguage;

    return (
        getLanguageHash() ||
        session.get("lang") ||
        transLanguage
    ).toLowerCase();
}

/**
 * 获取适配后的语言环境
 * @param lang 输入的语言
 * @return 返回适配后支持的语言
 */
export function getSupportedLanguage(lang = ""): SupportedLanguage {
    const [language, region] = lang
        .split(/[-_]/)
        .map((x) => x && x.toLowerCase());

    if (language === "zh") {
        switch (region) {
            case "cn":
                return SupportedLanguage.ZH_CN;

            case "tw":
                return SupportedLanguage.ZH_TW;

            default:
                return SupportedLanguage.ZH_CN;
        }
    } else if (language === "vi-vn" || language === "vi") {
        return SupportedLanguage.VI_VN;
    } else {
        return SupportedLanguage.EN_US;
    }
}

/**
 * 设置tab页title
 * @param title
 */
export function setTitle(title: string) {
    // 当页面中嵌入了flash，并且页面的地址中含有“片段标识”（即网址#之后的文字）IE标签页标题被自动修改为网址片段标识
    if (userAgent().app === Browser.MSIE || userAgent().app === Browser.Edge) {
        setTimeout(function () {
            document.title = title;
        }, 1000);
    } else {
        document.title = title;
    }
}

/**
 * 设置favicon
 */
export function setFavicon(favicon: string) {
    const link = document.createElement("link");
    link.rel = "shortcut icon";
    link.type = "image/x-icon";
    link.href = favicon;
    document.querySelector("head")?.appendChild(link);
}
