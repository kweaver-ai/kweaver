import React from 'react';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import intl from 'react-intl-universal';
import './style.less';
import { Divider } from 'antd';
import classNames from 'classnames';
import useAdHistory from '@/hooks/useAdHistory';

interface AdExitBarProps {
  exitText?: React.ReactNode;
  title?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onExit?: () => void; // 自行控制退出按钮的点击事件逻辑
  extraContent?: React.ReactNode;
}

const AdExitBar: React.FC<AdExitBarProps> = props => {
  const { exitText, title, style, className, extraContent, onExit } = props;
  const history = useAdHistory();
  const renderTitle = () => {
    if (typeof title === 'string') {
      if (title.includes('：')) {
        const [label, value] = title.split('：');
        return (
          <span className='ad-align-center'>
            <span>{label}</span>
            {value && (
              <>
                <span>：</span>
                <span title={value} className='ad-ellipsis' style={{ maxWidth: 240, display: 'inline-block' }}>{`${value}`}</span>
              </>
            )}
          </span>
        );
      }
      return (
        <span title={title} className='ad-ellipsis' style={{ maxWidth: 240, display: 'inline-block' }}>
          {title}
        </span>
      );
    }
    return title;
  };
  return (
    <div className={classNames('ad-exit-bar ad-align-center ad-border-b', className)} style={style}>
      <Format.Button
        type='text'
        onClick={() => {
          if (onExit) {
            onExit();
          } else {
            history.goBack();
          }
        }}
        style={{ display: 'flex' }}
        className='ad-align-center'
      >
        <IconFont className='ad-mr-1' type='icon-shangfanye' style={{ fontSize: 12 }} />
        {exitText || intl.get('global.exit')}
      </Format.Button>
      {(title || extraContent) && <Divider type='vertical' style={{ height: 21, margin: '0 12px' }} />}
      {title && renderTitle()}
      {extraContent && <div className='ad-exit-bar-extra ad-flex-item-full-width'>{extraContent}</div>}
    </div>
  );
};

export default AdExitBar;
