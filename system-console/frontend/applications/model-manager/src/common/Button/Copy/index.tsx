import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button as AntdButton, type ButtonProps as AntdButtonProps } from 'antd';

import UTILS from '@/utils';
import IconFont from '../../IconFont';

import styles from './index.module.less';

export type CopyProps = AntdButtonProps & {
  copyText: string;
  inBlock?: boolean;
  iconStyle?: React.CSSProperties;
  successIconStyle?: React.CSSProperties;
};

const Copy: React.FC<CopyProps> = props => {
  const { copyText, inBlock = true, iconStyle, successIconStyle, ...otherProps } = props;
  const [isCopyAfter, setIsCopyAfter] = useState(false);

  const timerRef = useRef<any>(null);
  useEffect(() => clearTimeout(timerRef.current), []);

  const onCopy = () => {
    UTILS.copyToBoard(copyText);
    setIsCopyAfter(true);
    timerRef.current = setTimeout(() => setIsCopyAfter(false), 3000);
  };

  if (isCopyAfter) {
    return (
      <IconFont
        className={classNames('g-c-success', { [styles['common-button-copy-after']]: inBlock })}
        style={{ fontSize: 24, ...successIconStyle }}
        type='icon-dip-check'
      />
    );
  } else {
    return (
      <AntdButton
        className={classNames({ [styles['common-button-copy']]: inBlock })}
        color='default'
        variant='text'
        title={intl.get('ModelManagement.apiGuide.copy')}
        icon={<IconFont style={iconStyle} type='icon-dip-copy' />}
        onClick={onCopy}
        {...otherProps}
      />
    );
  }
};

export default Copy;
