/**
 * @description 使用 antd 封装 iconfont
 */
import { createFromIconfontCN } from '@ant-design/icons';
import type { IconFontProps } from '@ant-design/icons/lib/components/IconFont';

const IconFontBase = createFromIconfontCN({
  scriptUrl: [require('@/assets/font/iconfont-dip.js'), require('@/assets/font/iconfont-dip-color')],
});

const IconFont: React.FC<IconFontProps> = ({ type, style = {}, ...restProps }) => {
  const renderContent = () => {
    return <IconFontBase type={type} style={style} {...restProps} />;
  };
  return renderContent();
};

export default IconFont;
