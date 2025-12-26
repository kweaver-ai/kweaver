import { Select as AntdSelect, type SelectProps as AntdSelectProps } from 'antd';
import classNames from 'classnames';

import { Text } from '../../Text';

export type SelectProps = AntdSelectProps & {
  label?: string;
  dir?: 'horizontal' | 'vertical';
};

const LabelSelect: React.FC<SelectProps> = props => {
  const { dir = 'horizontal', ...otherProps } = props;
  return (
    <div className={classNames('g-flex-center', { 'g-flex-column': dir === 'vertical' })}>
      <Text className={classNames({ 'g-mb-1': dir === 'vertical', 'g-mr-2': dir === 'horizontal' })}>{props.label}</Text>
      <AntdSelect {...otherProps} />
    </div>
  );
};

export default LabelSelect;
