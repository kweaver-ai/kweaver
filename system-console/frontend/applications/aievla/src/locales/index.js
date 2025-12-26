import benchmark_zh from './benchmark/zh-CN.json';
import benchmarkTask_zh from './benchmarkTask/zh-CN.json';
import dataSet_zh from './dataSet/zh-CN.json';
import delete_zh from './delete/zh-CN.json';
import global_zh from './global/zh-CN.json';
import prompt_zh from './prompt/zh-CN.json';

import benchmark_tw from './benchmark/zh-TW.json';
import benchmarkTask_tw from './benchmarkTask/zh-TW.json';
import dataSet_tw from './dataSet/zh-TW.json';
import delete_tw from './delete/zh-TW.json';
import global_tw from './global/zh-TW.json';
import prompt_tw from './prompt/zh-TW.json';

import benchmark_en from './benchmark/en-US.json';
import benchmarkTask_en from './benchmarkTask/en-US.json';
import dataSet_en from './dataSet/en-US.json';
import delete_en from './delete/en-US.json';
import global_en from './global/en-US.json';
import prompt_en from './prompt/en-US.json';

const zh_CN = {
  ...benchmark_zh,
  ...benchmarkTask_zh,
  ...dataSet_zh,
  ...delete_zh,
  ...global_zh,
  ...prompt_zh,
};

const zh_TW = {
  ...benchmark_tw,
  ...benchmarkTask_tw,
  ...dataSet_tw,
  ...delete_tw,
  ...global_tw,
  ...prompt_tw,
};

const en_US = {
  ...benchmark_en,
  ...benchmarkTask_en,
  ...dataSet_en,
  ...delete_en,
  ...global_en,
  ...prompt_en,
};

const locales = {
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
  'en-US': en_US,
};

export default locales;
