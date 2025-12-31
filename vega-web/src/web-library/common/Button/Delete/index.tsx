import intl from 'react-intl-universal';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';
import IconFont from '../../IconFont';

/** 预设按钮-删除 */
const Delete: React.FC<AntdButtonProps> = (props) => {
  return (
    <AntdButton icon={<IconFont type="icon-delete" />} {...props}>
      {props.children || intl.get('Global.delete')}
    </AntdButton>
  );
};

export default Delete;
