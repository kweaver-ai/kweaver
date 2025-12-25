import zh_cn from './translations/zh-cn';
import zh_tw from './translations/zh-tw';
import en_us from './translations/en-us';
import { getLang } from '@/utils/auth'

//提供转换器
export default function customTranslate(template, replacements) {
  replacements = replacements || {};

  const lang = getLang()
  if (lang === 'zh-cn') {
    template = zh_cn[template] || template;
  } else if (lang === 'zh-tw') {
    template = zh_tw[template] || template;
  } else if (lang === 'en-us') {
    template = en_us[template] || template;
  } else {
    template = zh_cn[template] || template;
  }
  // Translate


  // Replace
  return template.replace(/{([^}]+)}/g, function(_, key) {
    return replacements[key] || '{' + key + '}';
  });
}
