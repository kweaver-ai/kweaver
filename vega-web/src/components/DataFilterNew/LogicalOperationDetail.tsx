import { Divider } from 'antd';
import getLocaleValue from '@/utils/get-locale-value/getLocaleValue';
import classNames from './classNames';
import styles from './index.module.less';
import english from './locale/en-US';
import chinese from './locale/zh-CN';

const getIntl = getLocaleValue.bind(null, chinese, english);
const cs = classNames.bind(styles);

interface Props {
  value?: 'and' | 'or';
  className?: string;
}

const LogicalOperation = ({ value = 'and', className }: Props): JSX.Element => {
  return (
    <div className={cs('logical-content-detail', 'logical-content-disabled', className ?? '')}>
      <Divider type="vertical" />
      <div className={cs('logical-select-detail', 'logical-select-disabled')}>{getIntl(value)}</div>
      <Divider type="vertical" />
    </div>
  );
};

export default LogicalOperation;
