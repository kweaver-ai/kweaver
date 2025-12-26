import component_us from './component/en-us.json';
import global_us from './global/en-us.json';
import modelDefault_us from './ModelDefault/en-us.json';
import ModelManagement_us from './ModelManagement/en-us.json';
import ModelQuota_us from './ModelQuota/en-us.json';
import ModelStatistics_us from './ModelStatistics/en-us.json';
import Prompt_us from './Prompt/en-us.json';

import component_cn from './component/zh-cn.json';
import global_cn from './global/zh-cn.json';
import modelDefault_cn from './ModelDefault/zh-cn.json';
import ModelManagement_cn from './ModelManagement/zh-cn.json';
import ModelQuota_cn from './ModelQuota/zh-cn.json';
import ModelStatistics_cn from './ModelStatistics/zh-cn.json';
import Prompt_cn from './Prompt/zh-cn.json';

import component_tw from './component/zh-tw.json';
import global_tw from './global/zh-tw.json';
import modelDefault_tw from './ModelDefault/zh-tw.json';
import ModelManagement_tw from './ModelManagement/zh-tw.json';
import ModelQuota_tw from './ModelQuota/zh-tw.json';
import ModelStatistics_tw from './ModelStatistics/zh-tw.json';
import Prompt_tw from './Prompt/zh-tw.json';

const en_us = {
  ...component_us,
  ...global_us,
  ...modelDefault_us,
  ...ModelManagement_us,
  ...ModelQuota_us,
  ...ModelStatistics_us,
  ...Prompt_us,
};
const zh_cn = {
  ...component_cn,
  ...global_cn,
  ...modelDefault_cn,
  ...ModelManagement_cn,
  ...ModelQuota_cn,
  ...ModelStatistics_cn,
  ...Prompt_cn,
};

const zh_tw = {
  ...component_tw,
  ...global_tw,
  ...modelDefault_tw,
  ...ModelManagement_tw,
  ...ModelQuota_tw,
  ...ModelStatistics_tw,
  ...Prompt_tw,
};

const locales = {
  'en-us': en_us,
  'zh-cn': zh_cn,
  'zh-tw': zh_tw,
};

export default locales;
