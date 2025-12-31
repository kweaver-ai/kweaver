import { Divider } from 'antd';
import classNames from './classNames';
import styles from './index.module.less';
import english from './locale/en-US';
import chinese from './locale/zh-CN';
import getLocaleValue from '../../utils/get-locale-value/getLocaleValue';

const getIntl = getLocaleValue.bind(null, chinese, english);
const cs = classNames.bind(styles);

interface Props {
  value?: 'and' | 'or';
  onChange?: (value: any) => void;
  className?: string;
  disabled?: boolean;
}

const LogicalOperation = ({ value = 'and', onChange, className, disabled = false }: Props): JSX.Element => {
  const onClick = (): void => {
    onChange && !disabled && onChange(value === 'and' ? 'or' : 'and');
  };

  return (
    <div className={cs('logical-content', { 'logical-content-disabled': disabled }, className ?? '')}>
      <Divider type="vertical" />
      <div onClick={onClick} className={cs('logical-select', { 'logical-select-disabled': disabled })}>
        {getIntl(value)}
      </div>
      <Divider type="vertical" />
    </div>
  );
};

export default LogicalOperation;
