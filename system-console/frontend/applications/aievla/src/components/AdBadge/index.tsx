import React, { useEffect, useRef } from 'react';
import type { BadgeProps } from 'antd';
import { Badge } from 'antd';
import classNames from 'classnames';
import './style.less';

export interface AdBadgeProps extends BadgeProps {
  dotSize?: number; // 圆点大小
  isBackground?: boolean; // 是否作为文字背景显示
  onClick?: () => void; // 圆点大小
}

const AdBadge: React.FC<AdBadgeProps> = props => {
  const { dotSize = 8, className, onClick, title, isBackground = false, ...resetProps } = props;
  const domRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isBackground) {
      const domWrapper = domRef.current as HTMLSpanElement;
      if (domWrapper) {
        const dom = domWrapper.querySelector('.ant-badge .ant-badge-status-dot') as HTMLSpanElement;
        dom.style.width = `${dotSize}px`;
        dom.style.height = `${dotSize}px`;
      }
    }
  }, []);

  return (
    <span
      onClick={onClick}
      className={classNames('ad-badge', className, {
        'ad-pointer': !!onClick,
      })}
      ref={domRef}
      title={title}
    >
      <Badge {...resetProps} />
    </span>
  );
};

export default AdBadge;
