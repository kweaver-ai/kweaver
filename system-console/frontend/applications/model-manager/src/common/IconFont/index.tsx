/**
 * @description 使用 antd 封装 iconfont
 */
import { createFromIconfontCN } from '@ant-design/icons';
import type { IconFontProps } from '@ant-design/icons/lib/components/IconFont';

const IconFontBase = createFromIconfontCN({
  scriptUrl: [require('@/assets/iconfont/dip/iconfont.js'), require('@/assets/iconfont/dipColor/iconfont.js')],
});

const IconFont: React.FC<IconFontProps> = ({ type, style = {}, ...restProps }) => {
  const renderContent = () => {
    return <IconFontBase type={type} style={style} {...restProps} />;
  };
  return renderContent();
};

export default IconFont;
