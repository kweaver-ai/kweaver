/**
 * PNG通用信息
 */
export type PNGLang = {
    "zh-cn": string;
    "zh-tw": string;
    "en-us": string;
};

/**
 * OEM配置信息
 */
export interface OemConfigInfo {
    /**
     * 主题
     */
    theme?: string;
    /**
     * 登录模板
     */
    webTemplate?: string;
    /**
     * 字体
     */
    regularFont?: string;
    /**
     * icp备案号
     */
    recordNumber?: string;
    /**
     * 公网安备号
     */
    publicCode?: string;
    /**
     * 个性化ico
     */
    "favicon.ico"?: string;
    /**
     * 自定义版本
     */
    customVersion?: string;
    /**
     * 协议文本
     */
    agreementText?: string;
    /**
     * 客户端登录模板
     */
    desktopTemplate?: string;
    /**
     * ios 下载链接
     */
    iosDownloadLink?: string;
    /**
     *安卓 下载链接
     */
    androidDownloadLink?: string;
    /**
     * 客户端第三方型号
     */
    desktopThirdLoginSize?: string;
    /**
     * 客户端第三方登录宽度
     */
    desktopThirdLoginWidth?: string;
    /**
     * 客户端第三方登录高度
     */
    desktopThirdLoginHeight?: string;

    // 登录框位置
    loginBoxLocation?: string;

    // 登录框样式
    loginBoxStyle?: string;

    // 登录背景类型
    loginBackgroundType?: string;

    mac?: boolean;
    ios?: boolean;
    android?: boolean;
    showVersion?: boolean;
    userAgreement?: boolean;
    showCopyright?: boolean;
    openWebModule?: boolean;
    openContentBus?: boolean;
    showPublicCode?: boolean;
    showOnlineHelp?: boolean;
    isCustomVersion?: boolean;
    showRecordNumber?: boolean;
    showPortalBanner?: boolean;
    showPrivacyPolicy?: boolean;
    windows32Advanced?: boolean;
    showGettingStarted?: boolean;
    windows64Advanced?: boolean;
    showUserAgreement?: boolean;

    /**
     * 存在语言差异的配置
     */
    "desktopDefaultBackground.png": PNGLang;
    "defaultBackground.png": PNGLang;
    "regularBackground.png": PNGLang;
    portalBanner: PNGLang;
    "logo.png": PNGLang;
    "darklogo.png": PNGLang;
    product: PNGLang;
    "regularLiveBackground.gif"?: PNGLang;

    // [key: string]: string | boolean;
}
