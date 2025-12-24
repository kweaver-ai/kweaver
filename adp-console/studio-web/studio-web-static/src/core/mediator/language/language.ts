/**
 * 语言资源服务
 */
import local from "../local";
import session from "../session";

/**
 * DeployWebStatic 存在备份，需要两边同时修改
 */
/**
 * 默认语言
 */
export const DEFAULT_LANGUAGE = "en-us";

export const Language = {
    // 简体中文
    ZHCN: "zh-cn",
    // 繁体中文
    ZHTW: "zh-tw",
    // 美式英文
    ENUS: "en-us",
};

/**
 * 根据语言获取翻译
 * @param lang 语言
 * @returns
 */
export function getLanguageTitleByLang(lang: string) {
    const envlang = getEnvLanguage();
    if (lang === Language.ZHCN) {
        switch (envlang) {
            case Language.ZHCN:
                return "简体中文";
            case Language.ZHTW:
                return "簡體中文";
            default:
                return "Simplified Chinese";
        }
    } else if (lang === Language.ZHTW) {
        switch (envlang) {
            case Language.ZHCN:
                return "繁体中文";
            case Language.ZHTW:
                return "繁體中文";
            default:
                return "Traditional Chinese";
        }
    } else {
        switch (envlang) {
            case Language.ZHCN:
                return "英文";
            case Language.ZHTW:
                return "英文";
            default:
                return "English";
        }
    }
}

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
        title: "简体中文",
    },
    {
        language: Language.ZHTW,
        title: "繁體中文",
    },
    {
        language: Language.ENUS,
        title: "English",
    },
];

/**
 * 获取当前允许的语言版本列表
 */
export async function getLanguageList(softwareType?: string) {
    return Languages;
}

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
    const lang = (
        getLanguageHash() ||
        session.get("lang") ||
        local.get("lang") ||
        window.navigator["userLanguage"] ||
        window.navigator["language"] ||
        window.navigator["browserLanguage"] ||
        DEFAULT_LANGUAGE
    )
        .trim()
        .toLowerCase();
    if (lang === "en") {
        return DEFAULT_LANGUAGE;
    }
    return lang;
}

/**
 * 设置当前语言
 * @param lang
 */
export function setLanguage(lang = "") {
    session.set("lang", lang.toLowerCase());
    local.set("lang", lang.toLowerCase());
}

/**
 * 获取当前的语言
 * @returns {Object} 返回当前语言
 */
export async function getCurrentLang(): Promise<{ language: any }> {
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
