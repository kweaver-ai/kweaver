/**
 * @description Tree组件，对 antd 的 Tree 组件进行拓展
 */
import { Tree as AntdTree } from 'antd';

import FolderAndDocument, { FolderAndDocumentTitle } from './FolderAndDocument';
import FolderAndDocumentSelect from './FolderAndDocumentSelect';

export type TreeProps = typeof AntdTree & {
  FolderAndDocument: typeof FolderAndDocument;
  FolderAndDocumentTitle: typeof FolderAndDocumentTitle;
  FolderAndDocumentSelect: typeof FolderAndDocumentSelect;
};

const Tree = Object.assign(AntdTree, {
  FolderAndDocument,
  FolderAndDocumentTitle,
  FolderAndDocumentSelect,
}) as TreeProps;

export default Tree;
