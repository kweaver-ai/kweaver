import { useMemo, useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Dropdown } from 'antd';

import { IconFont } from '@/common';
import FolderAndDocument from '../FolderAndDocument';

import styles from './index.module.less';

const FolderAndDocumentSelect = (props: any) => {
  const { open: props_open, value: props_value, treeData: props_treeData, onChange, placeholder, ...otherProps } = props;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(props_open);
  }, [props_open]);

  /** 查找选中的数据 */
  const findItem = (id: string, data: any) => {
    let result: any;
    const traversalItems = (items: any) => {
      _.forEach(items, item => {
        if (item?.id === id || item?.key === id) result = item;
        if (item.children) traversalItems(item.children);
      });
    };
    traversalItems(data);
    return result;
  };

  /** 构建label */
  const constructLabel = (project: any) => {
    const result: any = [];
    const traversalItems = (data: any) => {
      result.unshift(data?.name);
      if (data?._parentData) traversalItems(data?._parentData);
    };
    traversalItems(project);

    return result.join('-');
  };

  const label = useMemo(() => {
    const data = findItem(props_value, props_treeData);
    return constructLabel(data?.sourceData);
  }, [props_value]);

  /** 选择 */
  const onSelect = (selectedKeys: any, info: any) => {
    if (info?.node?.children?.length > 0) return;
    setOpen(false);
    onChange(selectedKeys[0]);
  };

  return (
    <Dropdown
      open={open}
      destroyOnHidden
      onOpenChange={open => setOpen(open)}
      popupRender={() => (
        <div className='g-dropdown-menu-root' style={{ paddingRight: 4 }}>
          <div style={{ overflowY: 'auto', maxHeight: 200, paddingRight: 8 }}>
            <FolderAndDocument treeData={props_treeData} {...otherProps} selectedKeys={[props_value]} onSelect={onSelect} />
          </div>
        </div>
      )}
      trigger={['click']}
    >
      <div
        className={classNames('g-ellipsis-1', styles['common-tree-folder-and-document-select-root'], {
          [styles['common-tree-folder-and-document-select-placeholder-root']]: !props_value,
        })}
      >
        {props_value ? label : placeholder}
        <IconFont className={styles['common-tree-folder-and-document-select-icon']} type='icon-dip-right' />
      </div>
    </Dropdown>
  );
};

export default FolderAndDocumentSelect;
