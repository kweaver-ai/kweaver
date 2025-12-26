/**
 * @description TreeSelect 组件，对 antd 的 Tree 组件进行拓展
 */
import { TreeSelect as AntdTreeSelect } from 'antd';

import FolderAndDocument from './FolderAndDocument';

export type TreeSelectProps = typeof AntdTreeSelect & {
  FolderAndDocument: typeof FolderAndDocument;
};

const TreeSelect = Object.assign(AntdTreeSelect, {
  FolderAndDocument,
}) as TreeSelectProps;

export default TreeSelect;
