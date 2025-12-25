import Vue from 'vue'
import VueI18n from 'vue-i18n'
import elementEnLocale from 'element-ui/lib/locale/lang/en'
import elementZhCNLocale from 'element-ui/lib/locale/lang/zh-CN'
import elementZhTWLocale from 'element-ui/lib/locale/lang/zh-TW'
import elementViLocale from 'element-ui/lib/locale/lang/vi'
import enLocale from './en-us'
import zhCNLocale from './zh-cn'
import zhTWLocale from './zh-tw'
import viVNLocale from './vi-vn'
import ElementLocale from 'element-ui/lib/locale'
import XEUtils from 'xe-utils'

Vue.use(VueI18n)

// 所有语言
const messages = {
  'en-us': {
    ...enLocale,
    ...elementEnLocale
  },
  'zh-cn': {
    ...zhCNLocale,
    ...elementZhCNLocale
  },
  'zh-tw': {
    ...zhTWLocale,
    ...elementZhTWLocale
  },
  'vi-vn': {
    ...viVNLocale,
    ...elementViLocale
  }
}
// 默认语言
const DEFAULT_LANG = typeof XEUtils.cookie('lang') === 'undefined' ? 'zh-cn' : XEUtils.cookie('lang')
const i18n = new VueI18n({
  locale: DEFAULT_LANG,
  messages
})
ElementLocale.i18n((key, value) => i18n.t(key, value))
export default i18n
