import type React from 'react';
import { useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Tree as AntdTree, type TreeProps as AntdTreeProps } from 'antd';

import IconFont from '../../IconFont';

import styles from './index.module.less';

type CustomTreeProps = AntdTreeProps & {};

export const FolderAndDocumentTitle = (props: any) => {
  const { type, title, hasSwitcherIcon, switcherIcon, icon, operate } = props;
  const operateLength = operate?.props?.children?.length || 0;

  return (
    <span
      className={classNames(styles['common-tree-custom-tree-title'], {
        [styles['common-tree-custom-tree-document-title']]: type === 'document',
        [styles['common-tree-custom-tree-has-operate-title']]: !!operateLength,
        [styles['common-tree-custom-tree-not-switcher-title']]: type === 'folder' && !hasSwitcherIcon,
      })}
    >
      <span className='g-flex-align-center' style={{ width: `calc(100% - ${operateLength ? 50 : 0}px)` }}>
        {type === 'folder' && (
          <div style={{ position: 'relative' }}>
            {hasSwitcherIcon && <span className={styles['common-tree-custom-tree-title-switcher']}>{switcherIcon || <IconFont type='icon-dip-right' />}</span>}
            {icon || <IconFont type='icon-dip-folder' style={{ fontSize: 16 }} />}
          </div>
        )}
        {type === 'document' && (icon || <IconFont type='icon-dip-document' style={{ fontSize: 16 }} />)}
        <span className='g-ml-2 g-ellipsis-1' title={title}>
          {title}
        </span>
      </span>
      {/* 操作按钮 */}
      {operateLength ? (
        <div style={{ width: operateLength * 24, minWidth: operateLength * 24, height: 24, minHeight: 24 }}>
          {_.map(operate.props?.children, (item, index) => {
            return (
              <span key={index} className={styles['common-tree-custom-tree-title-button']}>
                {item}
              </span>
            );
          })}
        </div>
      ) : (
        <span className={styles['common-tree-custom-tree-title-button']}>{operate}</span>
      )}
    </span>
  );
};

const FolderAndDocument: React.FC<CustomTreeProps> = props => {
  const { selectedKeys: props_selectedKeys, onSelect: props_onSelect, onExpand: props_onExpand, ...otherProps } = props;
  const [selectedKeys, setSelectedKeys] = useState<any[]>([]);

  useEffect(() => {
    if (props_selectedKeys) setSelectedKeys(props_selectedKeys);
  }, [JSON.stringify(props_selectedKeys)]);

  const onSelect = (selectedKeys: any[], info: any) => {
    if (props_onSelect) props_onSelect(selectedKeys, info);
  };

  const onExpand = (keys: any, info: any) => {
    if (props_onExpand) props_onExpand(keys, info);
    if (!selectedKeys[0] || info.node.type === 'document') return;
    const currentKey = info.node.key;
    const selectedKey = selectedKeys[0];
    if (!_.includes(selectedKey as string, currentKey)) return;

    const expanded = info.expanded;
    if (expanded) {
      setSelectedKeys(_.filter(selectedKeys, key => key !== currentKey));
    } else {
      setSelectedKeys([...selectedKeys, currentKey]);
    }
  };

  return (
    <div className={styles['common-tree-folder-and-document-root']}>
      <AntdTree.DirectoryTree
        multiple
        blockNode
        showLine={true}
        showIcon={false}
        switcherIcon={null}
        selectedKeys={selectedKeys}
        onSelect={onSelect}
        onExpand={onExpand}
        {...otherProps}
      />
    </div>
  );
};

export default FolderAndDocument;
