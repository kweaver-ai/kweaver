/* @description: 获取国家化值的函数 */
import UTILS from '@/utils';

/**
 * 在公共库中，通过key值来获取国际化的值
 * @param key key值
 * @param chinese localeZh:国际化中文文档 value:动态匹配的值
 * @param englinsh localeZh:国际化英文文档 value:动态匹配的值
 */
const getLocaleValue = (key: any, chinese: { localeZh: any; value?: object }, englinsh: { localeEn: any; value?: object }): string => {
  const lang = UTILS.SessionStorage.get('language') || 'zh-cn';
  const { localeZh } = chinese;
  const { localeEn } = englinsh;
  const locale = lang === 'zh-cn' ? localeZh : localeEn;
  const value: any = (lang === 'zh-cn' ? chinese.value : englinsh.value) || {};
  const valueKeys = Object.keys(value);
  let content = locale[key] || '';

  valueKeys.map((val) => (content = content.replace(`{${val}}`, value[val])));

  return content;
};

export default getLocaleValue;
