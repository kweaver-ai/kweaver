/**
 * 在公共库中，通过key值来获取国际化的值
 * @param key key值
 * @param chinese localeZh:国际化中文文档 value:动态匹配的值
 * @param englinsh localeZh:国际化英文文档 value:动态匹配的值
 */
const getLocaleValue = (key: any, chinese: { localeZh: any; value?: object }, englinsh: { localeEn: any; value?: object }): string => {
  console.log(localStorage.getItem('lang'), 'localStorage.getItemlang');
  const lang = localStorage.getItem('lang') || 'zh-cn';
  const { localeZh } = chinese;
  const { localeEn } = englinsh;
  const locale = lang.includes('zh-cn') ? localeZh : localeEn;
  const value: any = (lang.includes('zh-cn') ? chinese.value : englinsh.value) || {};
  const valueKeys = Object.keys(value);
  let content = locale[key] || '';

  valueKeys.map((val) => (content = content.replace(`{${val} } `, value[val])));

  return content;
};

export default getLocaleValue;
