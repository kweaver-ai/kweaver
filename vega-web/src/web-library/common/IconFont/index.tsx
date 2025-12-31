/**
 * @description 使用 antd 封装 iconfont
 */
import { createFromIconfontCN } from '@ant-design/icons';
import { IconFontProps } from '@ant-design/icons/lib/components/IconFont';

const IconFontBase = createFromIconfontCN({
  scriptUrl: [require('./iconfont.js'), require('./iconfont-dip.js'), require('./iconfont-dip-color')],
});

const IconFont: React.FC<IconFontProps> = ({ type, style = {}, ...restProps }) => {
  const renderContent = () => {
    return <IconFontBase type={type} style={style} {...restProps} />;
  };
  return renderContent();
};

export default IconFont;
