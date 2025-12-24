/**
 * 通过内核判断是否为IE浏览器
 */
export const detectIE = () => {
    const { userAgent } = window.navigator;
    // MSIE内核
    const msie = userAgent.indexOf("MSIE ");
    // Trident内核
    const trident = userAgent.indexOf("Trident/");
    if (msie > 0 || trident > 0) {
        return true;
    }

    return false;
};
