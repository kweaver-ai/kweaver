import { PNGLang, OemConfigInfo } from "../../api/oem-config/declare";
import { newBackgroundImage } from "../../components/login/background";
import { newDefaultFavicon } from "../bootstrap/favicon";
import { defaultLogo, darkLogo } from "../workshop-framework/logo";

const pngDefault: PNGLang = {
    "zh-cn": "",
    "zh-tw": "",
    "en-us": "",
};

export const oemConfigDefault: OemConfigInfo = {
    product: {
        "zh-cn": "AI Data Platform",
        "zh-tw": "AI Data Platform",
        "en-us": "AI Data Platform",
    },
    portalBanner: {
        "zh-cn": "AI Data Platform",
        "zh-tw": "AI Data Platform",
        "en-us": "AI Data Platform",
    },
    "darklogo.png": {
        "zh-cn": darkLogo,
        "zh-tw": darkLogo,
        "en-us": darkLogo,
    },
    "logo.png": {
        "zh-cn": defaultLogo,
        "zh-tw": defaultLogo,
        "en-us": defaultLogo,
    },
    "defaultBackground.png": {
        "zh-cn": newBackgroundImage,
        "zh-tw": newBackgroundImage,
        "en-us": newBackgroundImage,
    },
    "regularBackground.png": pngDefault,
    "desktopDefaultBackground.png": pngDefault,
    // 未安装deploy-support时，默认的个性化配置
    theme: "#126EE3",
    "favicon.ico": newDefaultFavicon,
    webTemplate: "default",
    regularFont: "light",
    showUserAgreement: true,
    showPrivacyPolicy: true,
    showPortalBanner: true,
};

export enum Product {
    Default = "global",
    DIP = "dip",
    ADP = "adp",
}

export const LanguageSet = ["zh-cn", "zh-tw", "en-us"];

// 登录框位置类型
export enum LoginBoxLocationType {
    // 居中
    Center = "center",

    // 居右
    Right = "right",
}

// 登录框样式类型
export enum LoginBoxStyleType {
    // 白色背景
    White = "white",

    // 半透明
    Transparent = "transparent",
}

// 登录框背景类型
export enum LoginBackgroundType {
    // 图片
    Picture = "picture",

    // 动图
    Animated = "animated",
}

// 模板类型
export enum TemplateType {
    // 默认模板
    Default = "default",

    // 常规模板
    Regular = "regular",
}

// 字体样式
export enum FontStyle {
    // 深色
    Dark = "dark",

    // 浅色
    Light = "light",
}
