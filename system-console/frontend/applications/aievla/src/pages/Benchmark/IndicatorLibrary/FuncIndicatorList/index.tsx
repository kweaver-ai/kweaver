import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Dropdown, Menu, message, TableColumnsType } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

import { deleteIndicatorById, getIndicatorLibraryList } from '@/services/benchmark';

import Format from '@/components/Format';
import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import { DeleteModal } from '@/components/TipModal';

import CreateIndicator from './CreateIndicator/CreateIndicator';
import EditIndicator from './EditIndicator/EditIndicator';

import emptyCreateImg from '@/assets/images/create.svg';

/**
 * 模板类型文字颜色
 */
const TYPE_COLOR: Record<number, string> = {
  0: '#096dd9',
  1: 'rgba(0,0,0,0.85)',
};
const FuncIndicatorList = () => {
  const [listProps, setListProps] = useState({
    dataSource: [],
    orderField: 'update_time',
    order: 'desc',
    loading: false,
    searchValue: '',
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [createIndicatorModal, setCreateIndicatorModal] = useState({
    visible: false,
    readOnly: false,
    editData: null as any,
  });
  const [editIndicatorModal, setEditIndicatorModal] = useState({ visible: false, editData: null as any });

  const prefixLocale = 'benchmark.indicator';

  useEffect(() => {
    getListData();
  }, [listProps.order, listProps.orderField, listProps.searchValue, listProps.page, listProps.pageSize]);

  const getListData = async () => {
    setListProps(prevState => ({ ...prevState, loading: true }));
    const res: any = await getIndicatorLibraryList({
      page: listProps.page,
      size: listProps.pageSize,
      name: listProps.searchValue,
      sort_order: listProps.order,
      sort_field: listProps.orderField,
    });
    setListProps(prevState => ({ ...prevState, loading: false }));
    if (res) {
      const data = res.res;
      setListProps(prevState => ({ ...prevState, dataSource: data, total: res.count }));
    }
  };

  /** 获取排序规则 */
  const getSortOrder = (field: string) => {
    if (listProps.orderField !== field) return null;
    return listProps.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns: TableColumnsType = [
    {
      title: intl.get(`${prefixLocale}.name`),
      dataIndex: 'name',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: getSortOrder('name'),
      render: (text: string, record: any) => {
        const { color, description } = record;
        return (
          <div className='ad-align-center ad-pointer' onClick={() => viewRecord(record)}>
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
      width: 560,
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
              <Menu>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    viewRecord(record);
                  }}
                >
                  {intl.get('global.view')}
                </Menu.Item>
                {record.type !== 1 && (
                  <Menu.Item
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      deleteRecord(record);
                    }}
                  >
                    {intl.get('global.delete')}
                  </Menu.Item>
                )}
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
      title: intl.get(`${prefixLocale}.type`),
      dataIndex: 'type',
      render: value => <div style={{ color: TYPE_COLOR[value] }}>{intl.get(`${prefixLocale}.${value === 1 ? 'neiZhi' : 'customize'}`)}</div>,
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
      render: (value, record: any) => {
        if (record.type !== 1) return value;
        return '--';
      },
    },
  ];

  const viewRecord = (record: any) => {
    setCreateIndicatorModal(prevState => ({ ...prevState, visible: true, editData: record, readOnly: true }));
  };
  const deleteRecord = async (record: any) => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      currentDeleteName: record.name || '',
      currentDeleteType: intl.get('delete.indicator'),
    });
    if (!isOk) return;
    const res = await deleteIndicatorById(record?.id);
    if (res) {
      message.success(intl.get('global.deleteSuccess'));
      getListData();
    }
  };

  const addBtn = () => {
    setCreateIndicatorModal(prevState => ({ ...prevState, visible: true, editData: null, readOnly: false }));
  };
  const refresh = () => {
    getListData();
  };
  const onOrderMenuClick = ({ key }: any) => {
    if (listProps.orderField === key) {
      const targetOrder = listProps.order === 'asc' ? 'desc' : 'asc';
      setListProps(prevState => ({ ...prevState, order: targetOrder }));
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

  const createTip = useMemo(() => {
    return intl.get(`${prefixLocale}.createTip`).split('|');
  }, []);

  return (
    <div>
      <ADTable
        searchPlaceholder={intl.get(`${prefixLocale}.searchPlaceholder`)}
        searchValue={listProps.searchValue}
        onSearchChange={onSearch}
        loading={listProps.loading}
        dataSource={listProps.dataSource}
        rowKey='id'
        lastColWidth={170}
        columns={columns}
        renderButtonConfig={[
          { key: 'upload', position: 'left', type: 'upload', label: intl.get('global.upload'), onHandle: addBtn },
          {
            key: 'order',
            position: 'right',
            type: 'order',
            orderMenu: orderMenuList,
            orderField: listProps.orderField,
            order: listProps.order,
            onOrderMenuClick,
          },
          { key: 'reFresh', position: 'right', type: 'fresh', onHandle: refresh },
        ]}
        onChange={(_pagination, _filters, sorter: any) => {
          const order = sorter.order === 'descend' ? 'desc' : 'asc';
          setListProps(prevState => ({ ...prevState, order, orderField: sorter.field }));
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
            setListProps(prevState => ({ ...prevState, page, pageSize }));
          },
        }}
      />

      <CreateIndicator
        visible={createIndicatorModal.visible}
        readOnly={createIndicatorModal.readOnly}
        editData={createIndicatorModal.editData}
        onClose={() => {
          setCreateIndicatorModal(prevState => ({ ...prevState, visible: false }));
        }}
        refresh={refresh}
      />
      <EditIndicator
        visible={editIndicatorModal.visible}
        refresh={refresh}
        editData={editIndicatorModal.editData}
        onClose={() => {
          setEditIndicatorModal(prevState => ({ ...prevState, visible: false, editData: null }));
        }}
      />
    </div>
  );
};

export default FuncIndicatorList;
