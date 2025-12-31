import { CronFieldValues } from './types';
import { CronFieldName } from './utils';

const { SECOND, MINUTE, HOUR, DAY, MONTH, WEEK } = CronFieldName;

export const prefixCls = 'react-cron-select';

export const DEFAULTS: CronFieldValues = {
  [SECOND]: '0',
  [MINUTE]: '*',
  [HOUR]: '*',
  [DAY]: '*',
  [MONTH]: '*',
  [WEEK]: '?',
};
