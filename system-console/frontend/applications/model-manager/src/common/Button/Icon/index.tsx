import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

/** 预设按钮-图标 */
const Icon: React.FC<AntdButtonProps> = props => {
  return <AntdButton color='default' variant='text' {...props} />;
};

export default Icon;
