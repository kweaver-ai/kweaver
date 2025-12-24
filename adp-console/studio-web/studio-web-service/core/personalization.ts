export enum QueryMap {
    Section = "f_section",
    Option = "f_option",
    Value = "f_value",
}

export enum SectionMap {
    Anyshare = "anyshare",
    Mobile = "mobile",
    Windows = "windows",
    Desktop = "desktop",
    ShareWebZHCN = "shareweb_zh-cn",
    ShareWebZHTW = "shareweb_zh-tw",
    ShareWebENUS = "shareweb_en-us",
    IOS = "ios",
    Android = "android",
}

export enum OptionMap {
    Theme = "theme",

    CustomVersion = "customVersion",
    IsCustomVersion = "isCustomVersion",
    ShowVersion = "showVersion",

    PublicCode = "publicCode",
    ShowPublicCode = "showPublicCode",

    RecordNumber = "recordNumber",
    ShowRecordNumber = "showRecordNumber",

    PortalBanner = "portalBanner",
    ShowPortalBanner = "showPortalBanner",

    ShowCopyright = "showCopyright",
    ShowPrivacyPolicy = "showPrivacyPolicy",
    UserAgreement = "userAgreement",
    AgreementText = "agreementText",
    ShowUserAgreement = "showUserAgreement",

    Android = "android",
    AndroidDownloadLink = "androidDownloadLink",
    Ios = "ios",
    IosDownloadLink = "iosDownloadLink",
    Mac = "mac",
    Windows32Advanced = "windows32Advanced",
    Windows64Advanced = "windows64Advanced",

    RegularFont = "regularFont",
    DesktopTemplate = "desktopTemplate",
    WebTemplate = "webTemplate",
    OpenContentBus = "openContentBus",
    OpenWebModule = "openWebModule",

    FaviconIco = "favicon.ico",
    TitlePng = "title.png",
    BackgroundPng = "background.png",
    RegularBackgroundPng = "regularBackground.png",
    DefaultBackgroundPng = "defaultBackground.png",
    DesktopDefaultBackgroundPng = "desktopDefaultBackground.png",
    LogoPng = "logo.png",
    DarkLogoPng = "darklogo.png",
    OrgPng = "org.png",

    Product = "product",
    PrimaryColor = "primaryColor",

    DocDomainHostName = "docDomainHostName",
    DocDomainPort = "docDomainPort",

    ShowOnlineHelp = "showOnlineHelp",
    ShowGettingStarted = "showGettingStarted",

    ShowHomePageSlogan = "showHomePageSlogan",
    HomePageSlogan = "homePageSlogan",
}

export const QueryList = [QueryMap.Section, QueryMap.Option];

/**根据语言接口做特殊返回处理
 * "logo.png" 产品logo
 * "product" 产品名称
 * "regularBackground.png" 模板1 背景图
 * "defaultBackground.png" 板2 背景图
 * "portalBanner" 产品标语
 * "title.png" 浏览器title
 */
export const OptionByLanguageList = [
    OptionMap.LogoPng,
    OptionMap.DarkLogoPng,
    OptionMap.Product,
    OptionMap.DefaultBackgroundPng,
    OptionMap.DesktopDefaultBackgroundPng,
    OptionMap.RegularBackgroundPng,
    OptionMap.PortalBanner,
    OptionMap.TitlePng,
    OptionMap.HomePageSlogan,
];

export const SectionList = [
    SectionMap.Anyshare,
    SectionMap.ShareWebZHCN,
    SectionMap.ShareWebZHTW,
    SectionMap.ShareWebENUS,
    SectionMap.IOS,
    SectionMap.Android,
    SectionMap.Desktop,
    SectionMap.Mobile,
    SectionMap.Windows,
];

export const OptionList = [
    OptionMap.Theme,
    OptionMap.CustomVersion,
    OptionMap.IsCustomVersion,
    OptionMap.ShowVersion,
    OptionMap.PublicCode,
    OptionMap.ShowPublicCode,
    OptionMap.RecordNumber,
    OptionMap.ShowRecordNumber,
    OptionMap.PortalBanner,
    OptionMap.ShowPortalBanner,
    OptionMap.ShowCopyright,
    OptionMap.ShowPrivacyPolicy,
    OptionMap.UserAgreement,
    OptionMap.AgreementText,
    OptionMap.ShowUserAgreement,
    OptionMap.Android,
    OptionMap.AndroidDownloadLink,
    OptionMap.Ios,
    OptionMap.IosDownloadLink,
    OptionMap.Mac,
    OptionMap.Windows32Advanced,
    OptionMap.Windows64Advanced,
    OptionMap.RegularFont,
    OptionMap.DesktopTemplate,
    OptionMap.WebTemplate,
    OptionMap.OpenContentBus,
    OptionMap.OpenWebModule,
    OptionMap.FaviconIco,
    OptionMap.TitlePng,
    OptionMap.BackgroundPng,
    OptionMap.RegularBackgroundPng,
    OptionMap.DefaultBackgroundPng,
    OptionMap.DesktopDefaultBackgroundPng,
    OptionMap.LogoPng,
    OptionMap.OrgPng,
    OptionMap.Product,
    OptionMap.PrimaryColor,
    OptionMap.ShowGettingStarted,
    OptionMap.ShowOnlineHelp,
    OptionMap.DocDomainHostName,
    OptionMap.DocDomainPort,
];
