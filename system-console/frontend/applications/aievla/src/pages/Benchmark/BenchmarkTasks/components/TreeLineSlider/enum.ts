import locales from '@/locales';
import intl from 'react-intl-universal';
import { adCookie } from '@/utils/handleFunction';

const language = adCookie.get('anyDataLang') || 'zh-CN';
intl.init({ locales, currentLocale: language, warningHandler: () => '' });

export const ALG_TYPE_TWO: any = {
  1: `${intl.get('benchmarkTask.LModelTwo')}|${intl.get('benchmarkTask.modelPath')}`,
  2: `${intl.get('benchmarkTask.SModelTwo')}|${intl.get('benchmarkTask.smallPath')}`,
  3: `${intl.get('benchmarkTask.customAppTwo')}|${intl.get('benchmarkTask.customPath')}`,
  6: `Agent|${intl.get('benchmarkTask.agentPath')}`,
};

export const TYPE: Record<number, string> = {
  1: intl.get('benchmarkTask.LModelTwo'),
  2: intl.get('benchmarkTask.SModelTwo'),
  3: intl.get('benchmarkTask.customAppTwo'),
  4: intl.get('benchmarkTask.externalTwo'),
  6: 'Agent',
};

export const TYPE_TO_ID: Record<number, string> = {
  1: 'model_id',
  2: 'id',
  3: 'id',
  6: 'agent_id',
};

export const TYPE_TO_NAME: Record<number, string> = {
  1: 'model_name',
  2: 'name',
  3: 'name',
  6: 'name',
};

/**
 * Agent数据状态
 */
export const AGENT_STATUS: Record<string, string> = {
  published: intl.get('benchmarkTask.published'),
  unpublished: intl.get('benchmarkTask.unpublishedChanges'),
  draft: intl.get('benchmarkTask.draft'),
};

/**
 * Agent数据状态颜色
 */
export const AGENT_STATUS_COLOR: Record<string, string> = {
  published: 'success',
  unpublished: 'warning',
  draft: 'default',
};
