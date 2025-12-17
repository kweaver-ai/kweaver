/**
 * 整合国际化资源
 */
import adminManagement_zh from './adminManagement/zh-CN.json';
import adminManagement_en from './adminManagement/en-US.json';

const zh_CN = {
  ...adminManagement_zh,
};

const zh_TW = {
  ...adminManagement_zh,
};

const en_US = {
  ...adminManagement_en,
};

const locales = {
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  'en-US': en_US,
};

export default locales;
