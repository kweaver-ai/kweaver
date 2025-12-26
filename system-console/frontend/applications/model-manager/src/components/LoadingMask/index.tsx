import type React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import styles from './index.module.less';

export interface LoadingMaskProps {
  classname?: string;
  style?: React.CSSProperties;
  loading: boolean;
  text?: string;
}

/**
 * loading状态，有一层遮罩防止点击, 外层需指定position：relative, 全覆盖
 */
const LoadingMask = (props: LoadingMaskProps) => {
  const { classname, style, loading, text } = props;

  return loading ? (
    <div className={classNames(styles['component-loading-mask'], classname)} style={style}>
      <span className={styles['component-loading-mask-icon']}>
        <LoadingOutlined style={{ fontSize: 24 }} className='g-c-primary' />
        {text && (
          <span style={{ fontSize: 14 }} className='g-mt-2 g-c-text-sub'>
            {text}
          </span>
        )}
      </span>
    </div>
  ) : null;
};

export default LoadingMask;
