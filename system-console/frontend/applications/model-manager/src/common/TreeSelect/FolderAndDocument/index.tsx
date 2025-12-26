import { useRef, useState, useEffect } from 'react';
import { TreeSelect } from 'antd';

import styles from './index.module.less';

const FolderAndDocument = (props: any) => {
  const {
    treeData,
    value: props_value,
    treeExpandedKeys: props_treeExpandedKeys,
    onChange,
    onSelect: props_onSelect,
    onTreeExpand: props_onTreeExpand,
    ...otherProps
  } = props;

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(open);
  }, [open]);

  const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>([]);
  useEffect(() => {
    if (!props_treeExpandedKeys) return;
    setTreeExpandedKeys(props_treeExpandedKeys);
  }, [JSON.stringify(props_treeExpandedKeys)]);

  const [treeValue, setTreeValue] = useState<any>('');
  useEffect(() => {
    if (!props_value) return;
    setTreeValue(props_value);
  }, [JSON.stringify(props_value)]);

  const isFolder = useRef(false);
  const onSelect = (value: any, node: any) => {
    if (node.children) {
      isFolder.current = true;
      return;
    } else {
      isFolder.current = false;
    }
    if (onChange) onChange(value);
    if (props_onSelect) props_onSelect(value, node);
  };

  const onOpenChange = (open: boolean) => {
    if (!open && isFolder.current) return;
    setOpen(open);
  };

  const onTreeExpand = (keys: any[]) => {
    setTreeExpandedKeys(keys);
    if (props_onTreeExpand) props_onTreeExpand(keys);
  };

  return (
    <TreeSelect
      classNames={{ popup: { root: styles['common-tree-select-folder-and-document-root'] } }}
      open={open}
      treeLine={true}
      treeIcon={false}
      treeData={treeData}
      value={treeValue}
      switcherIcon={null}
      treeExpandAction='click'
      treeExpandedKeys={treeExpandedKeys}
      getPopupContainer={() => document.getElementById('mf-model-manager-root') as any}
      onSelect={onSelect}
      onOpenChange={onOpenChange}
      onTreeExpand={onTreeExpand}
      {...otherProps}
    />
  );
};

export default FolderAndDocument;
