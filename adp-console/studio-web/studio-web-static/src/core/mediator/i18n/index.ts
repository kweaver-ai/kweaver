import I18NFactory from "./I18NFactory";
import { envLanguage } from "../browser";

/**
 * 导出i18n实例
 */
export default I18NFactory({
    translations: ["zh-cn", "zh-tw", "en-us", "vi-vn"],
    locale: envLanguage(),
});
