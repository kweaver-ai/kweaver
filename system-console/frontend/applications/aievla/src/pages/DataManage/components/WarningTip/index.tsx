import React, { useEffect, useState } from 'react';

import { CloseOutlined } from '@ant-design/icons';

import warningImg from '@/assets/images/warning.svg';
import classNames from 'classnames';

export interface WarningTiplProps {
  children?: React.ReactNode;
  text: React.ReactNode;
  close?: boolean;
  onClose?: Function;
  style?: any;
}

export const WarningTip = (props: WarningTiplProps) => {
  const { text, close = false, onClose, style = {} } = props;
  const [show, setShow] = useState(true);

  return (
    <>
      {show ? (
        <div
          style={{
            ...{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 13px',
              height: 40,
              background: '#FFFBE6',
              marginBottom: 20,
            },
            ...style,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={warningImg} style={{ fontSize: '14px', width: 14, height: 14 }} />
            <span className='waring-tip ad-ml-2'>{text}</span>
          </div>
          {close && (
            <CloseOutlined
              onClick={() => {
                setShow(false);
                onClose?.(false);
              }}
              style={{ fontSize: 9, color: 'rgba(0,0,0,0.45)' }}
            />
          )}
        </div>
      ) : null}
    </>
  );
};
