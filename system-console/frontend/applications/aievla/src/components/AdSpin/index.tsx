import { memo } from 'react';

import loadingSvg from '@/assets/images/jiazai.svg';
import './style.less';

const AdSpin = (props: any) => {
  const { className, style, size, desc } = props;

  return (
    <div className={`ad-spin ${className}`} style={{ ...style }}>
      <img className='spin-img' style={{ width: size }} src={loadingSvg} alt='loading' />

      {desc && <div className='spin-desc'>{desc}</div>}
    </div>
  );
};

export default memo(AdSpin);
