import { PNGLang, OemConfigInfo } from "../../api/oem-config/declare";
import { newBackgroundImage } from "../../components/login/background";
import { newDefaultFavicon } from "../bootstrap/favicon";
import {
    defaultLogo,
    newLogo,
    newLogo_EN,
    newLogo_ZHTW,
} from "../workshop-framework/logo";

const pngDefault: PNGLang = {
    "zh-cn": "",
    "zh-tw": "",
    "en-us": "",
};

export const oemConfigDefault: OemConfigInfo = {
    product: pngDefault,
    portalBanner: pngDefault,
    "darklogo.png": pngDefault,
    "logo.png": pngDefault,
    "defaultBackground.png": pngDefault,
    "regularBackground.png": pngDefault,
    "desktopDefaultBackground.png": pngDefault,
};

export const oemConfigWithoutSupport: OemConfigInfo = {
    product: {
        "zh-cn": "AnyShare",
        "zh-tw": "AnyShare",
        "en-us": "AnyShare",
    },
    portalBanner: pngDefault,
    "darklogo.png": {
        "zh-cn": newLogo,
        "zh-tw": newLogo_ZHTW,
        "en-us": newLogo_EN,
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

// 产品标识
export const Product = {
    Default: "global",
};
