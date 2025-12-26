import { useEffect, useState } from 'react';
import _ from 'lodash';
import moment from 'moment';
import intl from 'react-intl-universal';
import { Dropdown, message } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';

import Hooks from '@/hooks';
import HELPER from '@/utils/helper';
import { getTextByHtml } from '@/utils/handleFunction';
import { dataSetList, dataSetDeleteById } from '@/services/dataSet';

import ADTable from '@/components/ADTable';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { DeleteModal } from '@/components/TipModal';

import { ASCEND, DESCEND, DataSetItem } from '../enum';
import DataSetConfigModal from '../components/DataSetConfigModal';

import emptySvg from '@/assets/images/empty.svg';
import noResImg from '@/assets/images/noResult.svg';
import emptyCreateImg from '@/assets/images/create.svg';
import './style.less';

const { useRouteCache, useAdHistory } = Hooks;

const DataSetList = () => {
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const history = useAdHistory(); // 路由
  const [loading, setLoading] = useState(false); // 是否加载中
  const [showDataSetModal, setShowDataSetModal] = useState(false);
  const [actionStatus, setActionStatus] = useState({ action: 'create', data: {} as any });
  const isCreate = true;

  const [listStatus, setListStatus] = useState({
    dataSource: [],
    name: '',
    orderField: routeCache.orderField ?? 'update_time',
    order: routeCache.order ?? 'desc',
    loading: false,
    searchValue: routeCache.searchValue ?? '',
    displayType: routeCache.displayType ?? 'table',
  });

  const { width: screenWidth } = Hooks.useWindowSize();

  useEffect(() => {
    if (screenWidth > 1200) resetTableCols();
  }, [screenWidth]);

  /**
   * 重置表列宽
   */
  const resetTableCols = () => {
    const length = sessionStorage.length;
    if (length > 0) {
      for (let i = 0; i < length; i++) {
        const key = sessionStorage.key(i);
        if (key?.includes('ADTableCols')) sessionStorage.removeItem(key);
      }
    }
  };

  useEffect(() => {
    getListData();
  }, [listStatus.order, listStatus.orderField, listStatus.searchValue]);

  /** 排序规则 */
  const getSortOrder = (field: string) => {
    if (listStatus.orderField !== field) return null;
    return listStatus.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns: ColumnsType<DataSetItem> = [
    {
      title: intl.get('dataSet.config.dataSetName'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('name'),
      showSorterTooltip: false,
      render: (name, record) => {
        const { color, description: desc } = record;
        return (
          <div className='ad-align-center ad-pointer' onClick={() => onIsEdit(record)}>
            <IconFont type={color} border style={{ width: 32, height: 32, marginRight: 8 }} />
            <div className='ad-flex-item-full-width'>
              <div className='ad-ellipsis ad-c-header' title={name}>
                {name}
              </div>
              <div className='ad-ellipsis' style={{ fontSize: 12, color: getTextByHtml(desc) ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)' }} title={desc}>
                {getTextByHtml(desc) || intl.get('global.notDes')}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      render: (_text: any, record: any, _index: number) => {
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'view', label: intl.get('global.view') },
                { key: 'edit', label: intl.get('global.edit') },
                { key: 'rename', label: intl.get('dataSet.reName') },
                { key: 'delete', label: intl.get('global.delete') },
              ],
              onClick: (e: any) => {
                e.domEvent.stopPropagation();
                onOperate(e.key, record);
              },
            }}
          >
            <Format.Button onClick={event => event.stopPropagation()} className='ad-table-operate' type='icon'>
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('dataSet.config.size'),
      dataIndex: 'size',
      ellipsis: true,
      render: size => {
        const formatSize = HELPER.formatFileSize(size);
        return formatSize === '-' ? '0 KB' : formatSize;
      },
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('size'),
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user',
      ellipsis: true,
      render: user => user || '- -',
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('create_time'),
      showSorterTooltip: false,
      render: time => (time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user',
      ellipsis: true,
      render: user => user || '- -',
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      key: 'update_time',
      ellipsis: true,
      sorter: true,
      sortDirections: [ASCEND, DESCEND, ASCEND],
      sortOrder: getSortOrder('update_time'),
      showSorterTooltip: false,
      render: time => (time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
  ];

  /**
   * 没有编辑权限禁止进入编辑页面
   */
  const onIsEdit = (record: any) => {
    onOperate?.('edit', record);
  };

  const orderMenuList = [
    { id: 'name', intlText: intl.get('dataSet.config.dataSetName') },
    { id: 'size', intlText: intl.get('dataSet.config.size') },
    { id: 'create_time', intlText: intl.get('global.creationTime') },
    { id: 'update_time', intlText: intl.get('global.finalOperatorTime') },
  ];

  const saveFilterConfig = () => {
    setRouteCache({
      searchValue: listStatus.searchValue,
      order: listStatus.order,
      orderField: listStatus.orderField,
      displayType: listStatus.displayType,
    });
  };

  /**
   * 各种操作的回调
   * @param key 操作的key标识
   * @param data 操作的数据
   */
  const onOperate = (key: string, data?: any) => {
    saveFilterConfig();
    key === 'create' && toCreate();
    _.includes(['edit', 'view'], key) && toEdit(key, data);
    key === 'check' && toCheck(data);
    key === 'delete' && confirmDelete(data);
    key === 'rename' && toReName(data);
  };

  const toCreate = () => {
    setActionStatus(preState => {
      return { ...preState, action: 'create', data: {} };
    });
    setShowDataSetModal(true);
  };

  const toEdit = (action: string, data: DataSetItem) => {
    history.push(`/evaluation-data/manager?action=${action}&_dataSet=${data.id}&name=${data.name}`);
  };

  const toCheck = (data: DataSetItem) => {
    history.push(`/evaluation-data/manager?action=check&_dataSet=${data?.id}&name=${data.name}`);
  };

  const toReName = (data: DataSetItem) => {
    setActionStatus(preState => {
      return { ...preState, action: 'rename', data };
    });
    setShowDataSetModal(true);
  };

  const confirmDelete = async (record: any) => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      currentDeleteName: record.name || '',
      currentDeleteType: intl.get('delete.dataSet'),
    });
    if (!isOk) return;
    try {
      const res = await dataSetDeleteById(record?.id);
      if (res) {
        refresh();
        message.success(intl.get('global.delSuccess'));
      }
    } catch (err) {
      // console.log('err', err);
    }
  };

  const refresh = () => {
    getListData();
  };

  const getListData = async () => {
    setLoading(true);
    const res: any = await dataSetList({
      page: -1,
      query: listStatus.searchValue,
      order: listStatus.order,
      rule: listStatus.orderField,
    });
    setLoading(false);
    if (res) {
      const temp_data: any = _.map(res, item => {
        return { ...item, description: getTextByHtml(item.description) };
      });

      setListStatus((preState: any) => ({ ...preState, dataSource: temp_data }));
    }
  };

  const onOrderMenuClick = ({ key }: any) => {
    if (listStatus.orderField === key) {
      const curOrder = listStatus.order === 'asc' ? 'desc' : 'asc';
      setListStatus(preState => ({ ...preState, order: curOrder }));
    } else {
      setListStatus(preState => ({ ...preState, orderField: key }));
    }
  };

  const handleSearch = (value: string) => {
    setListStatus(preState => ({ ...preState, searchValue: value }));
  };

  const prefixCls = 'dataSet-list';
  return (
    <div className={prefixCls}>
      <ADTable
        rowKey='id'
        title={<>{intl.get('dataSet.config.dataSet_')}</>}
        loading={
          loading
            ? {
                indicator: <LoadingOutlined className='icon' style={{ fontSize: 24, top: '200px' }} spin />,
              }
            : false
        }
        defaultDisplayType={listStatus.displayType as any}
        autoScrollY
        showHeader={true}
        lastColWidth={170}
        columns={columns}
        dataSource={listStatus.dataSource}
        renderButtonConfig={[
          {
            key: 'add',
            position: 'left',
            type: 'add',
            label: intl.get('global.create'),
            visible: isCreate,
            onHandle: () => onOperate('create'),
          },
          {
            key: 'order',
            position: 'right',
            type: 'order',
            orderMenu: orderMenuList,
            orderField: listStatus.orderField,
            order: listStatus.order,
            onOrderMenuClick,
          },
          { key: 'reFresh', position: 'right', type: 'fresh', onHandle: refresh },
        ]}
        onSearchChange={handleSearch} // 搜索handle
        searchPlaceholder={intl.get('dataSet.config.searchDataSetName')}
        onChange={(_pagination, _filters, sorter: any) => {
          const order = sorter.order === 'descend' ? 'desc' : 'asc';
          setListStatus(preState => ({ ...preState, order, orderField: sorter.field }));
        }}
        emptyImage={!listStatus.searchValue ? (isCreate ? emptyCreateImg : emptySvg) : noResImg}
        emptyText={
          !listStatus.searchValue ? (
            <div>
              {isCreate ? (
                <>
                  {intl.get('dataSet.config.createTip').split('|')[0]}
                  <span className='ad-c-primary ad-pointer' onClick={() => onOperate('create')}>
                    {intl.get('dataSet.config.createTip').split('|')[1]}
                  </span>
                  {intl.get('dataSet.config.createTip').split('|')[2]}
                </>
              ) : (
                intl.get('global.noContent')
              )}
            </div>
          ) : (
            intl.get('global.noResult')
          )
        }
      />
      {showDataSetModal ? (
        <DataSetConfigModal action={actionStatus.action} ds_id={actionStatus.data?.id} setShow={setShowDataSetModal} onOk={getListData} />
      ) : null}
    </div>
  );
};

export default DataSetList;
