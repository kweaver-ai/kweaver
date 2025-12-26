import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Table, message, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import IconFont from '@/components/IconFont';

import { benchmarkTaskResult } from '@/services/benchmarkTask';

import './style.less';

const columnAlgorithm = [
  {
    title: intl.get('benchmarkTask.algorithm'),
    dataIndex: 'algorithm',
    key: 'algorithm',
    width: 172,
    ellipsis: true,
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
];

const ResultDetailContent = (props: any, ref: any) => {
  const { resultId } = props;
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnsType<any>>([]);
  const [tableState, setTableState] = useState<{ order: string; rule: string }>({ order: 'desc', rule: 'average' });

  useEffect(() => {
    if (resultId) {
      getResult({});
    }
  }, []);

  /**
   * 查看结果
   * @param isData // 打开弹窗前判断接口是否有数据
   */
  const getResult = async (state: any, result_id?: any) => {
    try {
      const { res } = await benchmarkTaskResult({ id: resultId || result_id, ...tableState, ...state });

      const allColumns = onHandleTableHeader(res?.columns);
      if (!_.isEmpty(res?.data)) {
        onHandleData(res);
        const col = processColumns(allColumns);
        setColumns([...columnAlgorithm, ...col]);
        return;
      } else {
        setDataSource([]);
      }
      result_id && message.warning(intl.get('benchmarkTask.noResult'));
    } catch (err) {
      result_id && message.warning(intl.get('benchmarkTask.noResult'));
    }
  };

  /**
   * 表头显示顺序处理
   */
  const onHandleTableHeader = (columns: any) => {
    let filterColumns: any = {};
    const newColumns = _.filter(_.cloneDeep(columns), (item: any) => {
      if (item?.title === 'average') {
        filterColumns = item;
      }
      return item?.title !== 'average';
    });

    return _.isEmpty(filterColumns) ? [...newColumns] : [filterColumns, ...newColumns];
  };

  /**
   * 表格数据处理
   */
  const onHandleData = (res: any) => {
    let columnsId: any = [];
    _.map(_.cloneDeep(res?.columns), (item: any) => {
      if (item?.task_id) {
        _.map(item?.children, (n: any) => {
          columnsId = [...columnsId, [item?.task_id, n?.dataset_id]];
        });
      }
    });

    const handleData = _.map(_.cloneDeep(res?.data), (item: any) => {
      let handle: any = {};
      _.map(_.cloneDeep(columnsId), (i: any) => {
        if (_.isEmpty(item?.[i?.[0]])) {
          handle = { ...handle };
        } else {
          handle = {
            ...handle,
            ..._.reduce(
              item[i?.[0]][i?.[1]],
              (pre: any, key: any, index: any) => {
                pre[`${i?.[0]}.${i?.[1]}.${index}`] = key;
                return pre;
              },
              {},
            ),
          };
        }
      });
      return { ...item, ...handle };
    });

    setDataSource(handleData);
  };

  /** 处理表头 */
  const processColumns = (resCol: any[]) => {
    const processed: any[] = [];
    _.forEach(resCol, column => {
      // 处理当前列
      const processedColumn: any = {
        title: (
          <div className='ad-center'>
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
        showSorterTooltip: false,
      };
      // 处理子列
      if (column.children && column.children.length > 0) {
        processedColumn.children = processColumns(column.children);
      } else {
        processedColumn.sorter = true;
        processedColumn.sortDirections = ['descend', 'ascend', 'descend'];
        processedColumn.width = 118;
        processedColumn.ellipsis = true;
        processedColumn.render = (text: any) => <>{!text && text !== 0 ? '--' : text}</>;
      }
      processed.push(processedColumn);
    });
    return processed;
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
      setTableState({ order: 'asc', rule: field });
      getResult({ order: 'asc', rule: field });
    } else {
      setTableState({ order: 'desc', rule: field });
      getResult({ order: 'desc', rule: field });
    }
  };

  return (
    <div className='benchmarkTaskModalRoot'>
      {!_.isEmpty(dataSource) ? (
        <Table
          columns={columns}
          dataSource={dataSource}
          className='tableRoot'
          rowClassName={(record: any) => {
            return classNames({ 'row-warning': record?.ranking === 1 });
          }}
          onChange={onTableChange}
          size='middle'
          scroll={{ x: '800px', y: 47 * 7 }}
          pagination={false}
        />
      ) : null}
    </div>
  );
};

export default ResultDetailContent;
