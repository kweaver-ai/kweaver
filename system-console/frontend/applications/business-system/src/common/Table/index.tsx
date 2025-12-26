/**
 * @description 表格组件，对 antd 的 Table 组件进行拓展
 * 1、增加了 Operation 组件，用以自定义表格操作栏
 * 2、增加了 ResizableTitle 组件，用以实现表格列拖动
 */
import { Table as AntdTable } from 'antd';

import PageCard from './PageCard';
import PageTable from './PageTable';
import Operation from './Operation';

export type TableProps = typeof AntdTable & {
  PageCard: typeof PageCard;
  PageTable: typeof PageTable;
  Operation: typeof Operation;
};

const Table = Object.assign(AntdTable, {
  PageCard,
  PageTable,
  Operation,
}) as TableProps;

export default Table;
