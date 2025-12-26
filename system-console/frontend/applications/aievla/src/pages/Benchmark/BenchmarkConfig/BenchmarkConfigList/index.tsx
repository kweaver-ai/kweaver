import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import type { TableColumnsType } from 'antd';
import { Dropdown, Menu, message } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import Hooks from '@/hooks';
import { sessionStore } from '@/utils/handleFunction';
import { configIsUsedByTask, deleteBenchmarkConfig, getBenchmarkConfigList, getDatasetIndicatorOptions } from '@/services/benchmark';

import Format from '@/components/Format';
import ADTable from '@/components/ADTable';
import AdBadge from '@/components/AdBadge';
import IconFont from '@/components/IconFont';
import { DeleteModal } from '@/components/TipModal';

import BenchmarkRelationModal from './BenchmarkRelationModal';
import BenchmarkConfigModal from './BenchmarkConfigModal/BenchmarkConfigModal';

import emptyCreateImg from '@/assets/images/create.svg';
import './style.less';

const { useRouteCache, useAdHistory } = Hooks;
const BenchmarkConfigList = () => {
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const history = useAdHistory(); // 路由
  const [selectOptions, setSelectOptions] = useState({
    dataSet: [] as any,
    indicator: [] as any,
  });
  const [listProps, setListProps] = useState({
    dataSource: [],
    relationDataSetName: routeCache.relationDataSetName ?? '',
    relationIndicatorName: routeCache.relationIndicatorName ?? '',
    orderField: routeCache.orderField ?? 'update_time',
    order: routeCache.order ?? 'desc',
    loading: false,
    searchValue: routeCache.searchValue ?? '',
    page: routeCache.page ?? 1,
    pageSize: 10,
    total: 0,
    defaultDisplayType: routeCache.defaultDisplayType ?? 'card',
    activeRowKey: routeCache.activeRowKey ?? '',
  });
  const [configModal, setConfigModal] = useState({
    visible: false,
    editData: null as any,
    copyData: null as any,
  });
  const [relationModal, setRelationModal] = useState({
    visible: false,
    configId: '',
    type: '',
  });

  const [guideExpand, setGuideExpand] = useState(sessionStore.get('benchMarkGuide'));
  const prefixLocale = 'benchmark.config';

  useEffect(() => {
    getSelectOptions();
  }, []);

  const getSelectOptions = async () => {
    const data = await getDatasetIndicatorOptions();
    if (data) {
      const datasetOptions = data.dataset_list.map((item: any) => ({
        text: item.name,
        value: item.id,
        key: item.id,
      }));
      const indicatorOptions = data.metric_list.map((item: any) => ({
        text: item.name,
        value: item.id,
        key: item.id,
      }));
      setSelectOptions(() => ({
        dataSet: [{ text: intl.get('global.all'), value: '', key: 'all' }, ...datasetOptions],
        indicator: [{ text: intl.get('global.all'), value: '', key: 'all' }, ...indicatorOptions],
      }));
    }
  };

  useEffect(() => {
    getListData();
  }, [
    listProps.order,
    listProps.orderField,
    listProps.searchValue,
    listProps.relationDataSetName,
    listProps.relationIndicatorName,
    listProps.page,
    listProps.pageSize,
  ]);

  const getListData = async () => {
    setListProps(prevState => ({ ...prevState, loading: true }));
    try {
      const res: any = await getBenchmarkConfigList({
        page: listProps.page,
        size: listProps.pageSize,
        name: listProps.searchValue,
        sort_order: listProps.order,
        sort_field: listProps.orderField,
        dataset_id: listProps.relationDataSetName,
        metric_id: listProps.relationIndicatorName,
      });
      setListProps(prevState => ({ ...prevState, loading: false }));
      if (res) {
        const configIds = res.res.map((item: any) => item.id);
        const usedRes: any = await configIsUsedByTask(configIds);
        if (usedRes) {
          const newData = res.res.map((item: any) => ({ ...item, usedByTask: usedRes[item.id] }));
          setListProps(prevState => ({ ...prevState, dataSource: newData, total: res.count }));
        }
      }
    } catch (error) {
      setListProps(prevState => ({ ...prevState, loading: false }));
    }
  };

  /** 获取排序规则 */
  const getSortOrder = (field: string) => {
    if (listProps.orderField !== field) return null;
    return listProps.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns: TableColumnsType = [
    {
      title: intl.get(`${prefixLocale}.configName`),
      dataIndex: 'name',
      render: (text: string, record: any) => {
        const { color, description } = record;
        return (
          <div
            className='ad-align-center ad-pointer'
            onClick={() => {
              viewRecord(record);
            }}
          >
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
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: getSortOrder('name'),
      width: 460,
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      width: 80,
      render: (_text: any, record: any, _index: number) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu style={{ width: 120 }}>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onJumpConfigPage(record.id, true);
                  }}
                >
                  {intl.get('global.view')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    editRecord(record);
                  }}
                  disabled={record.usedByTask || record.published !== 0}
                >
                  {intl.get('global.edit')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    copy(record);
                  }}
                >
                  {intl.get('global.copy')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    deleteRecord(record);
                  }}
                  disabled={record.usedByTask}
                >
                  {intl.get('global.delete')}
                </Menu.Item>
              </Menu>
            }
          >
            <Format.Button onClick={event => event.stopPropagation()} className='ad-table-operate' type='icon'>
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('global.status'),
      dataIndex: 'published',
      render: (value: any) => (
        <AdBadge status={value === 1 ? 'success' : 'default'} text={value === 1 ? intl.get('global.published') : intl.get('global.unpublished')} />
      ),
    },
    {
      title: intl.get(`${prefixLocale}.relationDataSetCount`),
      dataIndex: 'dataset_num',
    },
    {
      title: intl.get(`${prefixLocale}.relationIndicatorCount`),
      dataIndex: 'metric_num',
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user',
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user',
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
  ];

  const viewRecord = async (record: any) => {
    if (record.published === 1) {
      onJumpConfigPage(record.id, true);
      return;
    }
    const res: any = await configIsUsedByTask([record.id]);
    if (res) {
      onJumpConfigPage(record.id, res[record.id]);
    }
  };
  const editRecord = (record: any) => {
    onJumpConfigPage(record.id);
  };
  const copy = async (record: any) => {
    setConfigModal(prevState => ({ ...prevState, visible: true, editData: null, copyData: record }));
  };
  const deleteRecord = async (record: any) => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      currentDeleteName: record.name || '',
      currentDeleteType: intl.get('delete.config'),
    });
    if (!isOk) return;
    const data = await deleteBenchmarkConfig(record?.id);
    if (data) {
      message.success(intl.get('global.deleteSuccess'));
      getListData();
    }
  };

  const addBtn = () => {
    setConfigModal(prevState => ({ ...prevState, visible: true, editData: null, copyData: null }));
  };
  const refresh = () => {
    getListData();
  };
  const onOrderMenuClick = ({ key }: any) => {
    if (listProps.orderField === key) {
      const targetOrder = listProps.order === 'asc' ? 'desc' : 'asc';
      setListProps(prevState => ({ ...prevState, order: targetOrder, page: 1 }));
    } else {
      setListProps(prevState => ({ ...prevState, orderField: key }));
    }
  };

  const onSearch = (value: string) => {
    setListProps(prevState => ({ ...prevState, searchValue: value, page: 1 }));
  };

  const orderMenuList = [
    { id: 'name', intlText: intl.get('global.orderByName') },
    { id: 'create_time', intlText: intl.get('global.orderByCreate') },
    { id: 'update_time', intlText: intl.get('global.orderByUpdate') },
  ];

  const onJumpConfigPage = (id: string, readOnly = false) => {
    setRouteCache({
      searchValue: listProps.searchValue,
      activeRowKey: id,
      order: listProps.order,
      orderField: listProps.orderField,
      relationDataSetName: listProps.relationDataSetName,
      relationIndicatorName: listProps.relationIndicatorName,
      defaultDisplayType: listProps.defaultDisplayType,
      page: listProps.page,
      guideExpand: guideExpand,
    });
    history.push('/effect-evaluation/config-graph', { configId: id, readOnly });
  };

  const onFiltersToolsClose = () => {
    setListProps(prevState => ({
      ...prevState,
      page: 1,
      searchValue: '',
      relationDataSetName: '',
      relationIndicatorName: '',
    }));
  };

  const createTip = useMemo(() => {
    return intl.get(`${prefixLocale}.createTip`).split('|');
  }, []);

  return (
    <div className='BenchmarkConfigList ad-w-100 ad-flex-column'>
      <ADTable
        rowKey='id'
        onDisplayTypeChange={type => {
          setListProps(prevState => ({
            ...prevState,
            defaultDisplayType: type,
          }));
        }}
        searchPlaceholder={intl.get(`${prefixLocale}.searchPlaceholder`)}
        searchValue={listProps.searchValue}
        onSearchChange={onSearch}
        loading={listProps.loading}
        dataSource={listProps.dataSource}
        showFilter={true}
        lastColWidth={170}
        columns={columns}
        onFiltersToolsClose={onFiltersToolsClose}
        filterToolsOptions={[
          {
            id: 'relationDataSetName',
            label: intl.get(`${prefixLocale}.relationDataSetName`),
            optionList: selectOptions.dataSet,
            onHandle: (value: any) => {
              setListProps(prevState => ({
                ...prevState,
                relationDataSetName: value,
                page: 1,
              }));
            },
            value: listProps.relationDataSetName,
            showSearch: true,
          },
          {
            id: 'relationIndicatorName',
            label: intl.get(`${prefixLocale}.relationIndicatorName`),
            optionList: selectOptions.indicator,
            onHandle: (value: any) => {
              setListProps(prevState => ({
                ...prevState,
                relationIndicatorName: value,
                page: 1,
              }));
            },
            value: listProps.relationIndicatorName,
            showSearch: true,
          },
        ]}
        renderButtonConfig={[
          {
            key: 'add',
            position: 'left',
            type: 'add',
            label: intl.get('global.create'),
            onHandle: addBtn,
          },
          {
            key: 'order',
            position: 'right',
            type: 'order',
            orderMenu: orderMenuList,
            orderField: listProps.orderField,
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
          setListProps(prevState => ({
            ...prevState,
            order,
            orderField: sorter.field,
          }));
        }}
        emptyImage={emptyCreateImg}
        emptyText={
          <div>
            {createTip[0]}
            <span className='ad-c-primary ad-pointer' onClick={addBtn}>
              {createTip[1]}
            </span>
            {createTip[2]}
          </div>
        }
        pagination={{
          current: listProps.page,
          pageSize: listProps.pageSize,
          total: listProps.total,
          onChange: (page, pageSize) => {
            setListProps(prevState => ({
              ...prevState,
              page,
              pageSize,
            }));
          },
        }}
        activeRowKey={listProps.activeRowKey}
      />

      <BenchmarkConfigModal
        editData={configModal.editData}
        onJumpConfigPage={onJumpConfigPage}
        getListData={refresh}
        visible={configModal.visible}
        onClose={() => {
          setConfigModal(prevState => ({
            ...prevState,
            visible: false,
            editData: null,
            copyData: null,
          }));
        }}
        copyData={configModal.copyData}
        tableData={listProps.dataSource}
      />
      <BenchmarkRelationModal
        onClose={() => {
          setRelationModal(prevState => ({
            ...prevState,
            visible: false,
          }));
        }}
        visible={relationModal.visible}
        configId={relationModal.configId}
        type={relationModal.type}
      />
    </div>
  );
};

export default BenchmarkConfigList;
