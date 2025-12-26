import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import type { TableColumnsType } from 'antd';
import { Dropdown, Menu, Tooltip } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import ADTable from '@/components/ADTable';
import AdBadge from '@/components/AdBadge';
import IconFont from '@/components/IconFont';
import noResImg from '@/assets/images/noResult.svg';
import emptyCreateImg from '@/assets/images/create.svg';

import { SIZE, ALGORITHM_TYPE, algorithmType, operationMenu, orderMenuList, STATUS_COLOR, TaskStatus } from './enums';

import './style.less';

const { useAdHistory } = HOOKS;
export default function TaskTable(props: any) {
  const { listProps, dataSource, configOptions, setRouteCache, selectedRow, setSelectedRow } = props;
  const { onClickOpMenu, setListProps, getTaskList, onViewEunDetail } = props;

  const history = useAdHistory();

  /** 获取排序规则 */
  const getSortOrder = (field: string) => {
    if (listProps.rule !== field) return null;
    return listProps.order === 'asc' ? 'ascend' : 'descend';
  };

  const onSearch = (e: string) => {
    getTaskList({ page: 1, name: e });
  };

  /**
   * 新建benchmark任务
   */
  const onAdd = () => {
    setRouteCache({
      name: listProps.name,
      algorithm_type: listProps.algorithm_type,
      status: listProps.status,
      order: listProps.order,
      rule: listProps.rule,
      config_id: listProps.config_id,
      page: listProps.page,
      size: listProps.size,
      activeRowKey: '',
    });
    history.push('/effect-evaluation/create-task?action=create');
  };

  /**
   * 关闭
   */
  const onClose = () => {
    getTaskList({
      config_id: 'all',
      algorithm_type: 'all',
      status: 'all',
      rule: 'create_time',
      order: 'desc',
      loading: false,
      name: '',
      page: 1,
      size: SIZE,
    });
  };

  /** 排序 */
  const onOrderMenuClick = ({ key }: any) => {
    if (listProps.rule === key) {
      const targetOrder = listProps.order === 'asc' ? 'desc' : 'asc';
      setListProps((prevState: any) => ({ ...prevState, order: targetOrder }));
    } else {
      setListProps((prevState: any) => ({ ...prevState, rule: key }));
    }
  };

  const refresh = () => {
    getTaskList({});
  };

  /**
   * 操作列下拉框按钮禁止状态判断
   */
  const isDisabled = (record: any, item: any) => {
    return (
      (!_.includes([3, 6], record?.status) && item.key === 'result') ||
      (_.includes([1, 2], record?.status) && _.includes(['edit', 'delete'], item?.key)) ||
      (record?.status === 0 && item.key === 'log') ||
      (_.includes([0, 1], record?.status) && item.key === 'detail')
    );
  };

  const columns: TableColumnsType = [
    {
      title: intl.get('benchmarkTask.taskName'),
      dataIndex: 'name',
      sorter: true,
      sortOrder: getSortOrder('name'),
      width: 304,
      fixed: 'left',
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: string, record: any) => {
        const { color, description } = record;
        return (
          <div className='ad-align-center ad-pointer' onClick={() => onClickOpMenu(_.includes([1, 2], record?.status) ? 'view' : 'edit', record)}>
            <IconFont type={color} border />
            <div className='ad-ml-2 ad-flex-item-full-width'>
              <div className='ad-ellipsis ad-c-text' title={text}>
                {text}
              </div>
              {description ? (
                <div title={description} style={{ fontSize: 12 }} className='ad-ellipsis ad-c-subtext'>
                  {description}
                </div>
              ) : (
                <div style={{ fontSize: 12 }} className='ad-c-watermark'>
                  {intl.get('global.notDes')}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      width: 80,
      fixed: 'left',
      render: (_text: any, record: any, _index: number) => {
        return (
          <Dropdown trigger={['click']} overlay={dropDownMenu(record)}>
            <Format.Button onClick={event => event.stopPropagation()} className='ad-table-operate' type='icon'>
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('benchmarkTask.runDetail'),
      dataIndex: 'status',
      width: 172,
      render: (text: number, record: any) => {
        return (
          <div
            className={classNames('ad-align-center', { 'ad-pointer': !_.includes([0, 1], text) })}
            onClick={() => {
              if (_.includes([0, 1], text)) return;
              setSelectedRow(record);
              onViewEunDetail(record);
            }}
          >
            <AdBadge text={STATUS_COLOR?.[text]?.text} color={STATUS_COLOR?.[text]?.color} />
            {!_.includes([0, 1], text) && (
              <Tooltip title={intl.get('global.detail')}>
                <IconFont className='ad-ml-2 ad-pointer' type='icon-wendang-xianxing' onClick={() => setSelectedRow(record)} />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: intl.get('benchmarkTask.BenchmarkConfig'),
      dataIndex: 'benchmark_config',
      width: 176,
    },
    {
      title: intl.get('benchmarkTask.evalObjType'),
      dataIndex: 'algorithm_type',
      width: 176,
      render: (text: any) => <>{ALGORITHM_TYPE[text]}</>,
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user',
      width: 170,
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      width: 170,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user',
      width: 170,
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
  ];

  const dropDownMenu = (record: any) => (
    <Menu>
      <Menu.Item
        key={_.includes([1, 2], record?.status) ? 'stop' : 'run'}
        onClick={({ domEvent }) => {
          domEvent.stopPropagation();
          onClickOpMenu('run', record);
        }}
      >
        {_.includes([1, 2], record?.status) ? intl.get('benchmarkTask.termination') : intl.get('benchmarkTask.run')}
      </Menu.Item>
      {_.map(operationMenu, item => {
        return (
          <Menu.Item
            onClick={({ domEvent }) => {
              domEvent.stopPropagation();
              onClickOpMenu(item?.key, record);
            }}
            disabled={isDisabled(record, item)}
          >
            {item.text}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  /**
   * 判断数据为空或是没有搜索结果
   */
  const emptyOrNoResult = listProps.name || listProps.algorithm_type !== 'all' || listProps.status !== 'all' || listProps.config_id !== 'all';

  return (
    <ADTable
      rowKey='id'
      defaultDisplayType='table'
      persistenceID={listProps?.config_id}
      autoScrollY
      onSearchChange={onSearch}
      searchValue={listProps?.name}
      loading={listProps.loading}
      dataSource={dataSource}
      showFilter={true}
      searchPlaceholder={intl.get('benchmarkTask.searchPlace')}
      lastColWidth={170}
      columns={columns}
      scroll={{ x: '1000px' }}
      rowClassName={(record: any) => {
        if (selectedRow?.id === record?.id) return 'selectedRow';
        return '';
      }}
      emptyImage={emptyOrNoResult ? noResImg : emptyCreateImg}
      emptyText={
        emptyOrNoResult ? (
          intl.get('global.noResult')
        ) : (
          <div>
            <span>{intl.get('benchmarkTask.emptyText').split('|')[0]}</span>
            <span className='ad-c-primary ad-pointer' onClick={onAdd}>
              {intl.get('benchmarkTask.emptyText').split('|')[1]}
            </span>
            <span>{intl.get('benchmarkTask.emptyText').split('|')[2]}</span>
          </div>
        )
      }
      onFiltersToolsClose={onClose}
      filterToolsOptions={[
        {
          id: 'config',
          label: intl.get('benchmarkTask.BenchmarkConfig'),
          optionList: configOptions,
          onHandle: (value: any) => {
            setListProps((prevState: any) => ({ ...prevState, config_id: value, page: 1 }));
          },
          value: listProps.config_id,
          showSearch: true,
        },
        {
          id: 'type',
          label: intl.get('benchmarkTask.evalObjType'),
          optionList: algorithmType as any,
          onHandle: (value: any) => {
            setListProps((prevState: any) => ({ ...prevState, algorithm_type: value, page: 1 }));
          },
          value: listProps.algorithm_type,
        },
        {
          id: 'status',
          label: intl.get('benchmarkTask.status'),
          optionList: TaskStatus as any,
          onHandle: (value: any) => {
            setListProps((prevState: any) => ({ ...prevState, status: value, page: 1 }));
          },
          value: listProps.status,
        },
      ]}
      renderButtonConfig={[
        {
          key: 'add',
          position: 'left',
          type: 'add',
          label: intl.get('global.create'),
          onHandle: onAdd,
        },
        {
          key: 'order',
          position: 'right',
          type: 'order',
          orderMenu: orderMenuList,
          orderField: listProps.rule,
          order: listProps.order,
          onOrderMenuClick,
        },
        {
          key: 'reFresh',
          position: 'right',
          type: 'fresh',
          onHandle: refresh,
        },
      ]}
      onChange={(_pagination, _filters, sorter: any) => {
        const order = sorter.order === 'descend' ? 'desc' : 'asc';
        setListProps((prevState: any) => ({ ...prevState, order, orderField: sorter.field, rule: sorter.field }));
      }}
      pagination={{
        current: listProps.page,
        total: listProps.total,
        pageSize: listProps.size,
        onChange: (page, pageSize) => {
          setListProps((prevState: any) => ({ ...prevState, page, size: pageSize }));
        },
      }}
      activeRowKey={listProps.activeRowKey}
    />
  );
}
