import React, { useEffect, useReducer, useRef, useState } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import { Tooltip, Table } from 'antd';
import intl from 'react-intl-universal';
import type { ColumnsType } from 'antd/es/table';
import { LoadingOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import IconFont from '@/components/IconFont';
import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import NoDataBox from '@/components/NoDataBox';

import { API } from '@/services/api';
import { cancelRequest } from '@/utils/axios-http/studioAxios';
import { getLeaderboard, leaderBoardConfigList } from '@/services/benchmarkTask';

import Header from './Header';
import { onHandleTableId, onHandleTaskColumns, onHandleColumnsWidth, onHandleBody } from './assisiFunction';

import './style.less';

/**
 * 表格参数状态
 */
export type TableState = {
  config_id: string;
  algorithm_type?: number;
  rule: string;
  order: string;
  loading: boolean;
  name: string;
  task_id: string | number;
  page: number;
  total: number;
  size: number;
};

export const COLOR: Record<string, string> = {
  1: '#F53F3F',
  2: '#FF7D00',
  3: '#F7BB1D',
};

/**
 * 算法类型
 */
export const ALGORITHM_TYPE: any = {
  1: intl.get('benchmarkTask.LModel'),
  2: intl.get('benchmarkTask.SModel'),
  3: intl.get('benchmarkTask.customApp'),
  4: intl.get('benchmarkTask.external'),
  6: 'Agent',
};

export const INIT_STATE: TableState = {
  loading: false, // 搜索加载中
  config_id: '',
  rule: 'average',
  order: 'desc',
  name: '',
  task_id: -1,
  page: 1,
  total: 0,
  size: 50,
};

const reducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });

const tableColumns: ColumnsType = [
  {
    title: intl.get('benchmarkTask.rank'),
    dataIndex: 'rank',
    key: 'rank',
    width: 60,
    fixed: 'left',
    ellipsis: true,
    render: (text: any, record: any) => <div style={{ color: COLOR[text], fontWeight: _.includes([1, 2, 3], text) ? 600 : 400 }}>{text}</div>,
  },
  {
    title: intl.get('benchmarkTask.evalObj'),
    dataIndex: 'algorithm',
    key: 'algorithm',
    fixed: 'left',
    ellipsis: true,
    width: 228,
    render: (text: any, record: any) => {
      const alg = _.isArray(text) ? text?.[0] : text;
      return (
        <div className='ad-w-100'>
          <div className='ad-w-100 ad-ellipsis' title={alg}>
            {alg}
          </div>
          {record?.algorithm_type === 1 && (
            <div className='ad-c-subtext ad-ellipsis' title={text?.[1]} style={{ fontSize: 12 }}>
              {text?.[1]}
            </div>
          )}
        </div>
      );
    },
  },
  {
    title: intl.get('benchmarkTask.evalObjType'),
    dataIndex: 'algorithm_type',
    key: 'algorithm_type',
    fixed: 'left',
    width: 80,
    render: (text: any) => <>{ALGORITHM_TYPE[text]}</>,
  },
  {
    title: intl.get('benchmarkTask.publisher'),
    dataIndex: 'publish_user',
    key: 'publish_user',
    ellipsis: true,
    width: 80,
  },
];

const Leaderboard = () => {
  const titleHeaderRef = useRef<any>([]);
  const { height: winHeight } = HOOKS.useWindowSize(); // 屏幕宽度
  const [originData, setOriginData] = useState<any>([]); // 保存列表数据，用于前端搜索
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [benConfigList, setBenConfigList] = useState<any[]>([]); // Benchmark配置列表
  const [tableState, dispatchTableState] = useReducer(reducer, INIT_STATE);
  const [columns, setColumns] = useState<ColumnsType<any>>([...tableColumns]);
  const tableDataRef = useRef<any>([]);
  const tableRef = useRef<any>();
  const childrenCountRef = useRef<any>({ childrenCount: 0, isAverage: false });

  useEffect(() => {
    getBenchMarkConfig();
  }, []);

  /** 获取榜单数据 */
  const getData = async (state: any, isUpdate = false) => {
    dispatchTableState({ ...tableState, ...state });
    try {
      const body = onHandleBody(tableState, state, isUpdate);
      dispatchTableState({ ...body, loading: true });

      const { res } = await getLeaderboard(body);
      if (isUpdate) {
        titleHeaderRef.current = res?.columns;
      }
      if (body.page !== 1 && _.isEmpty(res?.data)) {
        getData({ page: body.page - 1 });
        return;
      }
      dispatchTableState({ ...body, total: res?.total });
      const allColumns = onHandleTableHeader(res?.columns, body);
      if (allColumns) {
        onHandleTableData(res, body, allColumns);
      }
    } catch (err) {
      dispatchTableState({ loading: false });
    }
  };

  const onChangeTableData = (data: any) => {
    data = _.map(_.cloneDeep(data), (item, index) => {
      item.__key = index;
      return item;
    });
    setDataSource(data);
  };

  /**
   * 处理表头&表格数据
   */
  const onHandleTableData = (res: any, body: any, allColumns: any) => {
    const data = onHandleTableId(res?.data, body);
    const { childrenCount, isAverage } = onHandleTaskColumns(res?.columns);
    childrenCountRef.current = { childrenCount, isAverage };
    tableDataRef.current = data;
    const col = processColumns([...tableColumns, ...allColumns], body?.task_id || -1);
    setColumns([...col]);
    onChangeTableData(data);
    setOriginData(data);
    dispatchTableState({ loading: false });
  };

  /**
   * 表头显示顺序处理
   */
  const onHandleTableHeader = (columns: any, body: any) => {
    const timeColumn = {
      title: intl.get('benchmarkTask.publishDate'),
      dataIndex: 'publish_time',
      key: `publish_time_${body?.config_id || ''}`,
      width: 152,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false,
    };
    let filterColumns: any = {};
    const newColumns = _.filter(_.cloneDeep(columns), (item: any) => {
      if (item?.title === 'average') {
        item.width = 120;
        filterColumns = item;
      }
      return item?.title !== 'average';
    });
    return _.isEmpty(filterColumns) ? [...[timeColumn], ...newColumns] : [filterColumns, ...[timeColumn], ...newColumns];
  };

  /** 获取benchmark配置列表 */
  const getBenchMarkConfig = async () => {
    try {
      const { res } = await leaderBoardConfigList();
      if (!_.isEmpty(res)) {
        const handleData = _.reduce(
          res,
          (pre: any, key: any, index: any) => {
            return [...pre, { id: index, name: key }];
          },
          [],
        );
        setBenConfigList(handleData);
        if (!_.isEmpty(handleData)) {
          getData({ config_id: handleData?.[0]?.id }, true);
        }
      }
    } catch (err) {
      //
    }
  };

  /** 处理表头 */
  const processColumns = (currentData: any[], task_id: any, isSpace = false) => {
    const processed: any[] = [];
    const loop = (resCol: any) => {
      _.forEach(resCol, column => {
        const dataIndexArr = _.includes(['publish_user', 'algorithm_type', 'rank', 'algorithm'], column?.dataIndex);
        // 处理当前列
        const processedColumn: any = {
          title: (
            <div style={{ borderLeft: 'none' }} className={classNames('titleCotent', { 'ad-space-between': isSpace })}>
              <div title={column.title === 'average' ? 'Average' : column.title} className='ad-ellipsis'>
                {column.title === 'average' ? 'Average' : column.title}
              </div>
              {column?.tooltip ? (
                <Tooltip title={column?.tooltip} className='ad-ml-2 ad-c-watermark'>
                  <IconFont type='icon-wenhao' />
                </Tooltip>
              ) : null}
            </div>
          ),
          dataIndex: column.dataIndex || column.title,
          ellipsis: true,
          showSorterTooptip: false,
        };
        if (column?.width) {
          processedColumn.width =
            _.includes(['publish_time', 'average', 'publish_user', 'algorithm_type'], column.dataIndex) && childrenCountRef?.current?.childrenCount <= 4
              ? onHandleColumnsWidth(childrenCountRef?.current)
              : column?.width || 120;
        }
        if (column?.render) {
          processedColumn.render = column?.render;
        }
        // 处理子列
        if (column.children && column.children.length > 0) {
          processedColumn.children = processColumns(column.children, task_id, true);
        } else {
          // 添加排序功能仅在最后一级子项上
          processedColumn.showSorterTooltip = false;
          processedColumn.sorter = !dataIndexArr;
          processedColumn.ellipsis = true;
          processedColumn.sortDirections = ['ascend', 'descend', 'ascend'];
          processedColumn.onCell = (record: any) => {
            const handleMaxData = onHandleTableMaxCell(processedColumn.dataIndex);
            let color = 'black';
            if (
              handleMaxData === record[column.dataIndex] &&
              (column?.show_max || task_id === -1) &&
              !_.includes(['algorithm_type', 'rank'], column.dataIndex)
            ) {
              color = 'red';
            }
            return { style: { color } };
          };
        }
        // 添加到处理后的数组中

        processed.push(processedColumn);
      });
    };

    loop(currentData);
    return processed;
  };

  /**
   * 表格每列最大值
   */
  const onHandleTableMaxCell = (dataIndex: string) => {
    let mapData: any[] = [];
    _.map(_.cloneDeep(tableDataRef?.current), (item: any) => {
      _.map(item, (n: any, index: string) => {
        if (index === dataIndex) mapData = [...mapData, n];
      });
    });
    return Math.max(...mapData);
  };

  /**
   * 表格变化回调
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    if (order.slice(0, 3) === 'asc') {
      getData({ order: 'asc', rule: field });
    } else {
      getData({ order: 'desc', rule: field });
    }
  };

  /**
   * 状态|搜索|benchmark改变引起表格数据变化
   */
  const onHeaderChangeToTable = (data: any, isUpdate = false) => {
    if (isUpdate) {
      data.task_id = -1;
    }

    dispatchTableState({ ...tableState, ...data });
    cancelRequest(API.getLeaderboard);
    getData({ ...data }, isUpdate);
  };

  return (
    <div className='ad-pl-6 ad-pr-6 ad-h-100 ad-flex-column leaderBoard-root'>
      {/* 配置为空时 */}
      {_.isEmpty(benConfigList) ? (
        <div className='ad-column-flex empty-box'>
          <div className='ad-center'>
            <img src={emptyImg} />
          </div>
          <div className='ad-center'>{intl.get('benchmarkTask.noData')}</div>
        </div>
      ) : (
        <>
          <Header
            originData={originData}
            saveColumns={titleHeaderRef?.current}
            setDataSource={onChangeTableData}
            onHeaderChangeToTable={onHeaderChangeToTable}
            benConfigList={benConfigList}
            tableState={tableState}
          />
          <div className='ad-flex-item-full-height'>
            {_.isEmpty(dataSource) ? (
              <NoDataBox
                style={{ marginTop: 100 }}
                imgSrc={!tableState?.algorithm_type && !tableState?.name ? emptyImg : noResImg}
                desc={!tableState?.algorithm_type && !tableState?.name ? intl.get('global.noData') : intl.get('global.noResult')}
              />
            ) : (
              <Table
                ref={tableRef}
                rowKey='__key'
                columns={columns}
                className='leaderBoard-table-root'
                dataSource={dataSource}
                size='middle'
                onChange={onTableChange}
                scroll={{ x: 1653 + 96 * (childrenCountRef?.current?.childrenCount - 9), y: winHeight - 390 }}
                loading={
                  tableState.loading && {
                    indicator: <LoadingOutlined className='ad-c-primary' style={{ fontSize: 24 }} />,
                  }
                }
                pagination={{
                  current: tableState.page,
                  pageSize: tableState.size,
                  total: tableState.total,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                  size: 'default',
                  onChange: page => getData({ page }),
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
