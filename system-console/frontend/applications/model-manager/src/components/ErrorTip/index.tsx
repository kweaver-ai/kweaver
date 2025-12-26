import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Popover } from 'antd';

import './style.less';

export type ErrorTipProps = {
  errorText?: string;
  getPopupContainer?: any;
  className?: string;
};

const ErrorTip = (props: React.PropsWithChildren<ErrorTipProps>) => {
  const { errorText, children, getPopupContainer, className } = props;
  const isFocus = useRef(false);
  const [visible, setVisible] = useState(!!errorText);

  useEffect(() => {
    if (!isFocus.current) return;
    setVisible(!!errorText);
  }, [errorText]);

  /** 劫持focus */
  const handleFocus = () => {
    isFocus.current = true;
    errorText && setVisible(true);
  };

  /** 劫持blur */
  const handleBlur = () => {
    isFocus.current = false;
  };

  /** 开关控制 */
  const onVisibleChange = (isOpen: boolean) => setVisible(isOpen);

  return (
    <Popover
      className='onto-pro-error-tip'
      trigger={['hover']}
      content={errorText}
      placement='bottomLeft'
      destroyOnHidden
      open={visible}
      getPopupContainer={getPopupContainer ? getPopupContainer : node => node.parentElement}
      onOpenChange={onVisibleChange}
    >
      <div className={classNames(className, { 'ad-error-tip': !!errorText })} onFocus={handleFocus} onBlur={handleBlur}>
        {children}
      </div>
    </Popover>
  );
};

export default ErrorTip;
