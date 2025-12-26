import { local, session } from "../mediator";
import { setLanguage as setup } from "../../store/language";

/**
 * ShareWebDeploy存在备份，需要两边同时修改
 */
export const Language = {
    // 简体中文
    ZHCN: "zh-cn",
    // 繁体中文
    ZHTW: "zh-tw",
    // 美式英文
    ENUS: "en-us",
};

export const LanguageTitle = {
    // 简体中文
    [Language.ZHCN]: "简体中文",
    // 繁体中文
    [Language.ZHTW]: "繁體中文",
    // 美式英文
    [Language.ENUS]: "English",
};

export const LanguageList = [Language.ZHCN, Language.ZHTW, Language.ENUS];

/**
 * 语言资源列表
 */
export const Languages = [
    {
        language: Language.ZHCN,
        title: LanguageTitle[Language.ZHCN],
    },
    {
        language: Language.ZHTW,
        title: LanguageTitle[Language.ZHTW],
    },
    {
        language: Language.ENUS,
        title: LanguageTitle[Language.ENUS],
    },
];

/**
 * 设置语言
 * @param language 语言
 */
export const setLanguage = (language = "") => {
    setup(language);
    session.set("lang", language.toLowerCase());
    local.set("lang", language.toLowerCase());
};

/**
 * 从Hash参数中获取语言
 * @returns {*}
 */
export function getLanguageHash() {
    let hash = window.location.hash;
    let match = /\blang=([a-zA-Z-]+)\b/.exec(hash);
    let lang;

    if (match) {
        lang = match[1];
        setLanguage(lang);

        return lang;
    }
}

/**
 * 获取当前的语言
 * @returns {Object} 返回当前语言
 */
export function getEnvLanguage(): string {
    return (
        getLanguageHash() ||
        session.get("lang") ||
        local.get("lang") ||
        window.navigator["userLanguage"] ||
        window.navigator["language"] ||
        window.navigator["browserLanguage"] ||
        Languages[0].language
    )
        .trim()
        .toLowerCase();
}

/**
 * 通过语言环境获取翻译
 * @param textZHCN 中文翻译
 * @param textZHTW 繁体翻译
 * @param textENUS 英文翻译
 * @returns 翻译
 */
export const getLocaleByEnv = (
    textZHCN: string,
    textZHTW: string,
    textENUS: string,
    language?: string
) => {
    const lang = language ? language : getEnvLanguage();
    switch (lang) {
        case Languages[0].language:
            return textZHCN;
        case Languages[1].language:
            return textZHTW;
        default:
            return textENUS;
    }
};

/**
 * 获取当前的语言
 * @returns {Object} 返回当前语言
 */
export async function getCurrentLang(softwareType?: string) {
    const language = getEnvLanguage();

    return new Promise((resolve, reject) => {
        if (language === "zh-tw") {
            setLanguage("zh-tw");
            resolve(Languages[1]);
        } else if (/^en/.test(language)) {
            setLanguage("en-us");
            resolve(Languages[2]);
        } else if (language === "zh-cn" || language === "zh-hans-cn") {
            setLanguage("zh-cn");
            resolve(Languages[0]);
        } else {
            // 中/英/繁/华为较新系统浏览器语言为zh-hans-cn 以外的语言默认返回英文
            setLanguage("en-us");
            resolve(Languages[2]);
        }
    });
}

/**
 * 获取当前允许的语言版本列表
 */
export async function getLanguageList(softwareType?: string) {
    return Languages;
}
