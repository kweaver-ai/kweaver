import locales from '@/locales';
import intl from 'react-intl-universal';
import { adCookie } from '@/utils/handleFunction';

const language = adCookie.get('anyDataLang') || 'zh-CN';
intl.init({ locales, currentLocale: language, warningHandler: () => '' });

const LLM = 1; // 大模型
// const SMODEL = 2; // 小模型
// const CUSTOM = 3; // 自定义
const EXTERNAL = 4; // 外接
export const AGENT = 6; // agent

export const SIZE = 10;

export const MODEL_TYPE = { LLM, EXTERNAL, AGENT };
export const COMMON_HANDLE_TYPE = [AGENT, EXTERNAL];

/** 排序字段 */
export const orderMenuList = [
  { id: 'name', intlText: intl.get('global.orderByName') },
  { id: 'create_time', intlText: intl.get('global.orderByCreate') },
  { id: 'update_time', intlText: intl.get('global.orderByUpdate') },
];

/**
 * 算法类型
 */
export const ALGORITHM_TYPE: any = {
  6: 'Agent',
  1: intl.get('benchmarkTask.LModel'),
  2: intl.get('benchmarkTask.SModel'),
  3: intl.get('benchmarkTask.customApp'),
  4: intl.get('benchmarkTask.external'),
};

/** 下拉筛选列表 */
export const benchmarkConfig = [{ key: 'all', value: 'all', text: intl.get('global.all') }];

export const algorithmType = [
  { key: 'all', value: 'all', text: intl.get('global.all') },
  { key: 'Agent', value: AGENT, text: 'Agent' },
  { key: 'LLM', value: LLM, text: intl.get('benchmarkTask.LModel') },
  // { key: 'SM', value: SMODEL, text: intl.get('benchmarkTask.SModel') }
  // { key: 'custom', value: CUSTOM, text: intl.get('benchmarkTask.customApp') }
  { key: 'external', value: EXTERNAL, text: intl.get('benchmarkTask.external') },
];

export const TaskStatus = [
  { key: 'all', value: 'all', text: intl.get('global.all') },
  { key: 'success', value: 3, text: intl.get('global.success') },
  { key: 'failed', value: 4, text: intl.get('global.failed') },
  { key: 'partial_failure', value: 6, text: intl.get('benchmarkTask.partialException') },
  { key: 'stop', value: 5, text: intl.get('benchmarkTask.terminated') },
  { key: 'running', value: 2, text: intl.get('benchmarkTask.inProgress') },
  { key: 'waiting', value: 1, text: intl.get('benchmarkTask.waiting') },
  { key: 'normal', value: 0, text: intl.get('benchmarkTask.notrun') },
];

/** 操作菜单 */
export const operationMenu = [
  { key: 'edit', text: intl.get('global.edit') },
  { key: 'copy', text: intl.get('global.copy') },
  { key: 'detail', text: intl.get('benchmarkTask.runDetail') },
  { key: 'delete', text: intl.get('global.delete') },
];

/** 状态颜色 */
export const STATUS_COLOR: Record<number, { color: string; text: string }> = {
  4: { color: '#F5222D', text: intl.get('global.failed') },
  5: { color: '#F5222D', text: intl.get('benchmarkTask.termination') },
  2: { color: '#FAAD14', text: intl.get('benchmarkTask.inProgress') },
  3: { color: '#52C41A', text: intl.get('global.success') },
  0: { color: 'rgba(0,0,0,0.1)', text: intl.get('benchmarkTask.notrun') },
  6: { color: '#F5222D', text: intl.get('benchmarkTask.partialException') },
  1: { color: 'rgba(0,0,0,0.1)', text: intl.get('benchmarkTask.waiting') },
};
