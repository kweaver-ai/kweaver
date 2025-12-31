import type { CronProps } from './Cron/types';
import type { InputProps } from 'antd/lib/input';

export type HTMLAttributesProps = Pick<React.HTMLAttributes<HTMLDivElement>, 'style' | 'className'>;

export interface BaseCronSelectProps extends Partial<CronProps>, HTMLAttributesProps {
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onClose?: () => void;
}

export interface CronSelectProps extends BaseCronSelectProps {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  inputProps?: InputProps;
  cronSelectProps?: CronSelectProps;
}
