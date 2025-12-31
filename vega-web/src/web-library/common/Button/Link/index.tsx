import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

/** 预设按钮-链接 */
const Link: React.FC<AntdButtonProps> = (props) => {
  const { style, ...other } = props;
  return (
    <AntdButton type="link" style={{ padding: 0, ...style }} {...other}>
      {props.children}
    </AntdButton>
  );
};

export default Link;
