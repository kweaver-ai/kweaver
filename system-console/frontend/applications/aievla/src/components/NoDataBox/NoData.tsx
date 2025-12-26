import React, { memo } from 'react';
import classNames from 'classnames';

export interface NoDataProps {
  className?: string;
  style?: React.CSSProperties;
  imgSrc: React.ImgHTMLAttributes<HTMLImageElement>['src'];
  imgAlt?: React.ImgHTMLAttributes<HTMLImageElement>['alt'];
  desc: React.ReactNode;
}

const NoData = (props: NoDataProps) => {
  const { className, style = {}, imgSrc, imgAlt = 'nodata', desc } = props;
  const cssStyles = { textAlign: 'center' as React.CSSProperties['textAlign'], ...style };
  return (
    // <div className={classNames('ad-empty-box ad-mt-9 ad-mb-9', className)} style={cssStyles}>
    <div className={classNames('ad-empty-box ad-mb-9', className)} style={cssStyles}>
      <img src={imgSrc} alt={imgAlt} className='ad-tip-img' />
      <div className='ad-c-text-lower ad-mt-3'>{desc}</div>
    </div>
  );
};

export default memo(NoData);
