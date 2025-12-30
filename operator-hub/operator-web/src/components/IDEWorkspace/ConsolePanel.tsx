import { type FC } from 'react';
import { Tooltip } from 'antd';
import { CloseOutlined, ClearOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import styles from './ConsolePanel.module.less';

interface ConsolePanelProps {
  stdoutLines: string[][];
  onClose: () => void;
  onClearStdout: () => void;
}

const ConsolePanel: FC<ConsolePanelProps> = ({ stdoutLines, onClose, onClearStdout }) => {
  return (
    <div className={classNames(styles['container'], 'dip-h-100')}>
      <div
        className={classNames(
          styles['header'],
          'dip-font-16 dip-flex-space-between dip-c-bold dip-pt-16 dip-pb-16 dip-pl-20 dip-pr-20'
        )}
      >
        <span className="dip-flex-align-center">
          控制台
          <Tooltip title="清除">
            <ClearOutlined
              className={classNames(
                'dip-flex-content-center dip-font-16 dip-pointer dip-ml-8 dip-border-radius-8',
                styles['clear-icon']
              )}
              onClick={onClearStdout}
            />
          </Tooltip>
        </span>

        <CloseOutlined className="dip-font-16 dip-pointer" onClick={onClose} />
      </div>
      <div className={classNames(styles['content'], 'dip-pl-18 dip-pr-18 dip-pt-2 dip-pb-2')}>
        {stdoutLines.map(([time, stdout], index) => (
          <div key={index} className="dip-flex dip-gap-6 dip-c-999 dip-pt-2 dip-pb-2">
            <div className={styles['time']}>[{time}]</div>
            <div className={styles['stdout']}>{stdout}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsolePanel;
