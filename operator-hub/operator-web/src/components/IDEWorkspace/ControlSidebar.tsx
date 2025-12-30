import { useMemo } from 'react';
import { Menu } from 'antd';
import classNames from 'classnames';
import DebugIcon from '@/assets/icons/debug.svg';
import ConsoleIcon from '@/assets/icons/console.svg';
import styles from './ControlSidebar.module.less';

interface ControlSidebarProps {
  panelVisible: {
    debugPanel: boolean;
    consolePanel: boolean;
  };
  changePanelVisible: (visible: { debugPanel?: boolean; consolePanel?: boolean }) => void;
}

enum KeyEnum {
  DebugPanel = 'debugPanel',
  ConsolePanel = 'consolePanel',
}

const ControlSidebar = ({ panelVisible, changePanelVisible }: ControlSidebarProps) => {
  const selectedKeys = useMemo(() => {
    const keys: KeyEnum[] = [];
    if (panelVisible.debugPanel) {
      keys.push(KeyEnum.DebugPanel);
    }
    if (panelVisible.consolePanel) {
      keys.push(KeyEnum.ConsolePanel);
    }
    return keys;
  }, [panelVisible.debugPanel, panelVisible.consolePanel]);

  const items = useMemo(() => {
    const renderLabel = (label: string, Icon: any) => (
      <div className="dip-flex-column-center dip-pt-8">
        <Icon className={classNames('dip-font-24', styles.icon)} />
        <span className="dip-font-12" style={{ marginTop: '-8px' }}>
          {label}
        </span>
      </div>
    );
    return [
      {
        label: renderLabel('调试', DebugIcon),
        key: KeyEnum.DebugPanel,
      },
      {
        label: renderLabel('控制台', ConsoleIcon),
        key: KeyEnum.ConsolePanel,
      },
    ];
  }, []);

  return (
    <div className={classNames('dip-pt-20 dip-flex-column dip-gap-20', styles.container)}>
      <Menu
        theme="light"
        mode="vertical"
        selectedKeys={selectedKeys}
        style={{ background: 'transparent' }}
        items={items}
        onClick={({ key }) => {
          changePanelVisible(
            key === KeyEnum.DebugPanel
              ? {
                  debugPanel: !panelVisible.debugPanel,
                }
              : {
                  consolePanel: !panelVisible.consolePanel,
                }
          );
        }}
      />
    </div>
  );
};

export default ControlSidebar;
