/**
 * @description 表格组件，对 antd 的 Table 组件进行拓展
 * 1、增加了 Operation 组件，用以自定义表格操作栏
 * 2、增加了 ResizableTitle 组件，用以实现表格列拖动
 */
import type React from 'react';
import { useRef, useState, useEffect } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Table as AntdTable, type TableProps as AntdTableProps } from 'antd';

import HOOKS from '@/hooks';
import UTILS from '@/utils';
import ResizableTitle from './ResizableTitle';
import ColumnsController from './ColumnsController';

import styles from './index.module.less';

type CustomTableProps = AntdTableProps & {
  name: string;
  canResize?: boolean;
  autoScroll?: boolean;
};

const PageTable: React.FC<CustomTableProps> = props => {
  const {
    name,
    canResize = true,
    autoScroll = true,
    columns: _columns = [],
    bordered,
    dataSource,
    scroll = {},
    pagination = {},
    rowSelection: _rowSelection,
    style,
    ...otherProps
  } = props;
  const containerRef = useRef<HTMLDivElement>(null); // 表格容器
  const containerHeight = containerRef?.current?.getBoundingClientRect()?.height || 0; // 容器高度

  const operationBarRef = useRef(null); // 表格操作条 ref
  const { height: operationBarHeight } = HOOKS.useSize(operationBarRef); // 表格操作条高度

  const tableColumnsHeight = 38.03 + (dataSource?.length || 0) * 48.8; // 通过列的数量计算表格应有高度
  const headerOffset = (props.children ? operationBarHeight : 0) + 40; // 表格头部高度
  const footerOffset = _.isEmpty(pagination) ? 0 : 56; // 分页器高度
  const viewportHeight = containerHeight - headerOffset - footerOffset; // 表格允许设置的最大视口高度
  const hasScrollY = viewportHeight < tableColumnsHeight; // 是否开启纵向滚动
  const containerWidth = (containerRef?.current?.getBoundingClientRect()?.width || 0) - (hasScrollY ? 6 : 0) || 0;

  /** session 相关的操作 */
  const SESSION_COLUMNS_WIDTH_KEY = `${name}-columns-width`;
  const SESSION_COLUMNS_CONTROLLER_KEY = `${name}-columns-controller`;
  const sessionColumnsWidth = UTILS.SessionStorage.get(SESSION_COLUMNS_WIDTH_KEY) || {};
  const sessionColumnsController = UTILS.SessionStorage.get(SESSION_COLUMNS_CONTROLLER_KEY) || {};
  /** 构造表格宽度的 session 数据 */
  const constructSessionColumnsWidth = (columns: any[]) => {
    const temp: any = _.cloneDeep(sessionColumnsWidth);
    _.forEach(columns, item => {
      if (item.dataIndex === '__empty__') return;
      temp[item.dataIndex] = {
        width: item.width,
        initWidth: temp?.[item.dataIndex]?.initWidth || item.width,
      };
    });
    return temp;
  };
  /** 设置 session 数据, 只有在 name 存在时，才设置 session 数据 */
  const setSessionProxy = (key: string, data: any) => {
    if (name) UTILS.SessionStorage.set(key, data);
  };

  const [columnsController, setColumnsController] = useState<any>(sessionColumnsController); // 表格列是否展示的控制数据
  // 表格的复选框需要控制是否展示，所以要通过 useState 重新赋值
  const [rowSelection, setRowSelection] = useState<any>(_rowSelection);
  useEffect(() => {
    if (columnsController?.checkbox && !columnsController?.checkbox?.checked) return;
    setRowSelection(_rowSelection);
  }, [_rowSelection?.selectedRowKeys?.length]);

  const [columns, setColumns] = useState<any>([]); // 表格列数据
  useEffect(() => {
    if (containerWidth > 0) init();
  }, [_columns, containerWidth, JSON.stringify(columnsController)]);

  /** 构造表格列是否展示的 session 数据 */
  const initSessionColumnsController = (columns: any[]) => {
    const temp: any = _.cloneDeep(columnsController);
    if (!temp.checkbox && _rowSelection) {
      temp.checkbox = { dataIndex: 'checkbox', index: -1, title: '复选框', checked: true, disabled: true };
    }
    _.forEach(columns, (item, index: number) => {
      const { dataIndex, title, __selected, __fixed } = item;
      if (dataIndex === '__empty__') return;
      temp[dataIndex] = { index, dataIndex, title, checked: !!__selected, disabled: !!__fixed };
    });
    return temp;
  };
  const init = () => {
    let newColumns = _.cloneDeep(_columns);
    let newColumnsController = _.cloneDeep(columnsController);
    let tableColumnsWidth = _.isEmpty(rowSelection) ? 0 : 32;

    // 初始化表格列显示控制器数据
    if (_.isEmpty(newColumnsController)) {
      newColumnsController = initSessionColumnsController(newColumns);
    }

    // 过滤掉不展示的列，然后添加列的默认属性
    newColumns = _.filter(newColumns, (item: any) => !!newColumnsController[item.dataIndex]?.checked);
    newColumns = _.map(newColumns, (item: any) => {
      item.ellipsis = true;
      item.textWrap = 'word-break';
      item.width = sessionColumnsWidth?.[item.dataIndex]?.width || item.width || 150;
      item.showSorterTooltip = false;

      tableColumnsWidth += item.width;

      return item;
    });

    // 如果表格列总宽度小于表格容器宽度，则为每列增加平均差值宽度
    if (tableColumnsWidth < containerWidth && _.isEmpty(sessionColumnsWidth)) {
      // 计算平均插值，最后减去 6 是考虑到表格的边框宽度
      const offsetWidth = Math.round((containerWidth - tableColumnsWidth) / _columns.length) - 6;
      newColumns = _.map(newColumns, (item: any) => {
        item.width = item.width + offsetWidth;
        return item;
      });
    }

    if (canResize) newColumns.push({ dataIndex: '__empty__' }); // 增加一列不定宽度，用以自适应，这样可以使其他列按照width显示宽度

    setColumns(newColumns);
    setSessionProxy(SESSION_COLUMNS_WIDTH_KEY, constructSessionColumnsWidth(newColumns));
    setSessionProxy(SESSION_COLUMNS_CONTROLLER_KEY, newColumnsController);
  };

  // 拖动调整columns宽度
  const handleResize = (index: number, width: any) => {
    const newColumns = _.cloneDeep(columns);
    newColumns[index].width = width;

    setColumns(newColumns);
    setSessionProxy(SESSION_COLUMNS_WIDTH_KEY, constructSessionColumnsWidth(newColumns));
  };

  // 表格列是否展示控制器相关操作
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const onCloseMenu = () => setMenuVisible(false);
  const onControllerChange = (data: any) => {
    setColumnsController(data);
    setSessionProxy(SESSION_COLUMNS_CONTROLLER_KEY, data);

    if (data?.checkbox?.checked) {
      setRowSelection(_rowSelection);
    } else {
      rowSelection.onChange([]);
      setRowSelection(undefined);
    }
  };
  // 表格视口离开时，隐藏列是否展示的控制器
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        _.forEach(entries, entry => !entry.isIntersecting && setMenuVisible(false));
      },
      { root: null, rootMargin: '0px', threshold: 0.5 },
    );

    observer.observe(containerRef.current);

    return () => {
      if (!containerRef.current) return observer.disconnect();
      observer.unobserve(containerRef.current);
      observer.disconnect();
    };
  }, [containerRef.current]);
  /** 重置表格列宽度 */
  const onResetWidth = () => {
    const newSessionColumnsWidth = _.cloneDeep(sessionColumnsWidth);
    _.forEach(newSessionColumnsWidth, item => {
      item.width = item.initWidth;
    });
    const newColumns = _.map(_.cloneDeep(columns), item => {
      if (item.dataIndex !== '__empty__') item.width = newSessionColumnsWidth?.[item.dataIndex]?.width;
      return item;
    });

    setColumns(newColumns);
    setSessionProxy(SESSION_COLUMNS_WIDTH_KEY, newSessionColumnsWidth);
    onCloseMenu();
  };
  /** 适配表格列宽度 */
  const onAdapterWidth = () => {
    const _containerWidth = containerWidth - (_.isEmpty(rowSelection) ? 0 : 32);
    const width = _containerWidth / (columns.length - 1);

    const newSessionColumnsWidth = _.cloneDeep(sessionColumnsWidth);
    _.forEach(newSessionColumnsWidth, item => {
      item.width = width;
    });
    const newColumns = _.map(_.cloneDeep(columns), item => {
      if (item.dataIndex !== '__empty__') item.width = width;
      return item;
    });

    setColumns(newColumns);
    setSessionProxy(SESSION_COLUMNS_WIDTH_KEY, newSessionColumnsWidth);
    onCloseMenu();
  };

  return (
    <div ref={containerRef} style={{ width: bordered ? 'calc(100% + 2px)' : '100%', height: '100%', overflow: 'hidden' }}>
      {props.children && <div ref={operationBarRef}>{props.children}</div>}
      <AntdTable
        size='small'
        bordered={bordered}
        tableLayout='fixed'
        dataSource={dataSource}
        rowSelection={rowSelection}
        rowKey={record => record.id || record.key}
        style={{ width: '100%', height: `calc(100% - ${operationBarHeight}px)`, ...style }}
        components={{ header: { cell: canResize ? ResizableTitle : (props: any) => <th {...props} /> } }}
        scroll={autoScroll ? (hasScrollY ? { x: 'max-content', y: viewportHeight } : { x: 'max-content' }) : scroll}
        columns={_.map(columns, (item: any, index: number) => {
          if (!canResize) return item;
          return {
            ...item,
            onHeaderCell: () => ({ width: item.width, onChangeSize: (width: number) => handleResize(index, width) }),
          };
        })}
        onHeaderRow={() => ({
          className: classNames(styles['common-table-page-table-column-title']),
          onContextMenu: (event: React.MouseEvent) => {
            event.preventDefault(); // 禁用浏览器菜单
            event.stopPropagation(); // 阻止冒泡

            setMenuVisible(true);
            setMenuPosition({ x: event.clientX, y: event.clientY });
          },
        })}
        pagination={
          pagination === false
            ? false
            : {
                size: 'default',
                showSizeChanger: true,
                style: { marginTop: 24 },
                pageSizeOptions: ['20', '50', '100'],
                showTotal: total => intl.get('global.total', { total }),
                ...pagination,
              }
        }
        {...otherProps}
      />
      <ColumnsController
        open={menuVisible}
        position={menuPosition}
        SESSION_COLUMNS_CONTROLLER_KEY={SESSION_COLUMNS_CONTROLLER_KEY}
        onCloseMenu={onCloseMenu}
        onResetWidth={onResetWidth}
        onAdapterWidth={onAdapterWidth}
        onControllerChange={onControllerChange}
      />
    </div>
  );
};

export default PageTable;
