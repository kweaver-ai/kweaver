import { envLanguage, getSupportedLanguage } from "../browser";

export interface Settings {
    /**
     * 支持的语言列表
     */
    translations: Array<string>;

    /**
     * 当前使用的语言
     */
    locale: string;
}

/**
 * 匹配函数
 * @param key 要查找的资源
 * @param [replacements] 要替换的模版值
 * @return string 返回匹配的资源
 */
export type Matcher = (
    key: string,
    replacements?: Record<string, any>
) => string;

/**
 * 更改配置
 * @param locale 当前使用的语言
 */
export type Setup = ({ locale }: { locale: string }) => void;

/**
 * i18n实例
 */
export interface I18N {
    (resources: Array<Array<string>>): Matcher;
    setup: Setup;
}

/**
 * i18n工厂函数
 * @param options.translations 支持的语言
 * @param options.locale 当前语言
 */
export default function I18NFactory({
    translations,
    locale = envLanguage(),
}: Settings) {
    let useLocale = locale;

    // eslint-disable-next-line
    const i18n: I18N = <I18N>function (resources = []) {
        const KeyIndex = 0;

        /**
         * 将国际化资源转换为字典
         * @param resources 国际化资源
         */
        const transSourcesToDict = function (resources: any) {
            // 如果使用对象扩展操作，编译结果会调用tslib.__assign，时间复杂度太高影响性能。
            // 因此使用属性赋值的方式
            const result = {};

            resources.forEach((resource: any) => {
                result[resource[KeyIndex]] = resource;
            });

            return result;
        };

        /**
         * 在资源中查找匹配项
         * @params key 查找关键字
         */
        const findMatch = function (key: string): string {
            const sourceDict = transSourcesToDict(resources);
            const match = sourceDict[key] || []; // 书写语言下标
            const result =
                match[translations.indexOf(getSupportedLanguage(useLocale))];

            return result !== undefined ? result : match[KeyIndex] || ""; // 返回匹配项或Config.key对应的语言
        };

        return function (key, replacements) {
            const match = findMatch(key);

            if (replacements) {
                return match.replace(/\${(.+?)}/g, (match, capture) => {
                    if (!match || !capture) {
                        return "";
                    }

                    return replacements[capture] !== undefined
                        ? replacements[capture]
                        : "";
                });
            } else {
                return match;
            }
        };
    };

    i18n.setup = function ({ locale }) {
        useLocale = locale;
    };

    return i18n;
}
