/**
 * 跳转用户协议
 */
export const openUserAgreement = (
    language: string,
    host: string,
    port: string | number,
    prefix: string,
    protocol: string
) => {
    switch (language) {
        case "zh-tw":
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/UserAgreement/ServiceAgreement-Hant.html`
            );
            break;
        case "en-us":
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/UserAgreement/ServiceAgreement-EN.html`
            );
            break;
        default:
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/UserAgreement/ServiceAgreement-CN.html`
            );
            break;
    }
};

/**
 * 跳转隐私政策
 */
export const openPrivacyPolicy = (
    language: string,
    host: string,
    port: string | number,
    prefix: string,
    protocol: string
) => {
    switch (language) {
        case "zh-tw":
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/Privacy/Privacy-Hant.html`
            );
            break;
        case "en-us":
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/Privacy/Privacy-EN.html`
            );
            break;
        default:
            window.open(
                `${protocol}//${host}:${port}${prefix}/deployResource/Agreement/Privacy/Privacy-CN.html`
            );
            break;
    }
};

/**
 * 查看帮助
 */
export const openOnlineHelp = (
    language: string,
    apiVersion: string = "7.0.5.2"
) => {
    switch (language) {
        case "zh-tw":
            window.open(
                `https://docs.aishu.cn/help/router/anyshare/${apiVersion}/anyshare-deployment-console-overview?lan=zh-hant`
            );
            break;
        case "en-us":
            window.open(
                `https://docs.aishu.cn/help/router/anyshare/${apiVersion}/anyshare-deployment-console-overview?lan=en-US`
            );
            break;
        default:
            window.open(
                `https://docs.aishu.cn/help/router/anyshare/${apiVersion}/anyshare-deployment-console-overview?lan=zh-CN`
            );
            break;
    }
};
