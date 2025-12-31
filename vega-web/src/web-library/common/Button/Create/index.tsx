import intl from 'react-intl-universal';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';
import IconFont from '../../IconFont';

/** 预设按钮-创建 */
const Create: React.FC<AntdButtonProps> = (props) => {
  return (
    <AntdButton type="primary" icon={<IconFont type="icon-add" />} {...props}>
      {props.children || intl.get('Global.create')}
    </AntdButton>
  );
};

export default Create;
