import businessDomain_us from './businessDomain/en-us.json';
import common_us from './common/en-us.json';
import enums_us from './enums/en-us.json';
import global_us from './global/en-us.json';

import businessDomain_cn from './businessDomain/zh-cn.json';
import common_cn from './common/zh-cn.json';
import enums_cn from './enums/zh-cn.json';
import global_cn from './global/zh-cn.json';

import businessDomain_tw from './businessDomain/zh-tw.json';
import common_tw from './common/zh-tw.json';
import enums_tw from './enums/zh-tw.json';
import global_tw from './global/zh-tw.json';

const en_us = { ...businessDomain_us, ...common_us, ...enums_us, ...global_us };
const zh_cn = { ...businessDomain_cn, ...common_cn, ...enums_cn, ...global_cn };
const zh_tw = { ...businessDomain_tw, ...common_tw, ...enums_tw, ...global_tw };

const locales = {
  'en-us': en_us,
  'zh-cn': zh_cn,
  'zh-tw': zh_tw,
};

export default locales;
