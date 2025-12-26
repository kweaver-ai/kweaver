/**
 * 文件icon, 封装成可缓存的组件
 */
import React, { memo } from 'react';
import classNames from 'classnames';
import { switchIcon } from '@/utils/handleFunction';
import './style.less';

export interface FileIconProps {
  className?: string;
  style?: React.CSSProperties;
  type?: 'file' | 'sheet' | 'dir' | 'sql' | 'anyRobot' | 'childDir';
  name?: string;
  size?: number;
}

const FileIcon = (props: FileIconProps) => {
  const { className, style = {}, type = 'file', name, size } = props;
  return (
    <span className={classNames('c-file-icon', className)} style={style}>
      {switchIcon(type, name, size)}
    </span>
  );
};

export default memo(FileIcon);
