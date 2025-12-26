import intl from 'react-intl-universal';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

import IconFont from '../../IconFont';

/** 预设按钮-创建 */
const Create: React.FC<AntdButtonProps> = props => {
  return (
    <AntdButton type='primary' icon={<IconFont type='icon-dip-add' />} {...props}>
      {props.children || intl.get('components.button.Create')}
    </AntdButton>
  );
};

export default Create;
