import intl from 'react-intl-universal';
import { Tree } from 'antd';
import styles from './index.module.less';

const Database: React.FC<{ onSelect: (selectedKey: string, info?: any) => void; selectedKey: string; treeData: any[] }> = ({
  onSelect,
  selectedKey,
  treeData,
}) => {
  return (
    <div className={styles['data-group-box']}>
      <div className={styles['all-item']}>{intl.get('Global.allDatabases')}</div>
      <div className={styles['tree-box']}>
        <Tree
          blockNode
          defaultExpandAll
          treeData={treeData}
          selectedKeys={[selectedKey]}
          onSelect={(selectedKey, info) => onSelect(selectedKey[0] as string, info)}
          showIcon
          // switcherIcon={<DownOutlined style={{ fontSize: '12px' }} />}
        />
      </div>
    </div>
  );
};

export default Database;
