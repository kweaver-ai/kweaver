import { Languages } from "../../core/customname";

/**
 * 根据语言获取翻译
 * @param {*} lang 环境语言
 * @param {*} param1 [中文，繁体，英文]
 * @returns
 */
export const getLocale = (lang, [zhcn, zhtw, enus]) => {
    switch (lang) {
        case Languages.ZHCN:
            return zhcn;
        case Languages.ZHTW:
            return zhtw;
        default:
            return enus;
    }
};
