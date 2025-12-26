import React, { CSSProperties, useEffect } from 'react';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';

import './style.less';

export type AdIconListProps = {
  className?: string;
  style?: CSSProperties;
  iconList: string[]; // icon 列表
  setIsChange?: (value: boolean) => void;
  disabled?: boolean;
  // 受控  和 antd Form表单格式保持一致
  value?: string;
  defaultValue?: string; // 默认选中的icon
  onChange?: (icon: string) => void;
  gap?: number; // 间隔
  hideIcon?: boolean; // icon 是否显示， 默认不显示
};
const AdIconList: React.FC<AdIconListProps> = props => {
  const { disabled, className, style, iconList, value, onChange, defaultValue, gap = 8, setIsChange, hideIcon = true } = props;

  const prefixCls = 'ad-icon-list';
  useEffect(() => {
    if (defaultValue) onChange?.(defaultValue);
  }, []);

  const getValue = (icon: string) => {
    if (value) {
      return value === icon;
    }
    return defaultValue === icon;
  };

  return (
    <div className={classNames(`${prefixCls}`, className)} style={style}>
      {iconList.map(icon => (
        <div
          key={icon}
          style={{ marginRight: gap }}
          className={classNames(`${prefixCls}-item ad-center`, {
            [`${prefixCls}-item-selected`]: getValue(icon),
            [`${prefixCls}-item-disabled`]: disabled,
            [`${prefixCls}-item-hideIcon`]: hideIcon,
          })}
          onClick={e => {
            if (disabled) return;
            setIsChange?.(true);
            onChange?.(icon);
          }}
        >
          <IconFont type={icon} border hideIcon={hideIcon} />
        </div>
      ))}
    </div>
  );
};

export default AdIconList;
