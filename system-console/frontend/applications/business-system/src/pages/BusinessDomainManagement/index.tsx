import { useState, useEffect } from 'react';
import _ from 'lodash';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import { Dropdown, Empty } from 'antd';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Button, Table, Text } from '@/common';

import CreateAndEditDrawer from './CreateAndEditDrawer';

import domain_svg from '@/assets/images/domain.svg';
// import styles from './index.module.less';

type CAETypeType = 'create' | 'edit';
type CAEType = { open: boolean; type: CAETypeType; step: number; sourceData: any };

const BusinessDomainManagement = () => {
  // const MENU_SORT_ITEMS: MenuProps['items'] = [
  //     { key: 'model_name', label: intl.get('businessDomain.sortByBusinessDomainName') },
  //     { key: 'create_time', label: intl.get('businessDomain.sortByCreation') }
  // ];

  const { modal, message } = HOOKS.useGlobalContext();
  const { pagination, onUpdateState } = HOOKS.usePageState({ size: 50 }); // 分页信息

  const [loading, setLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<any>({ name: '' }); // 筛选条件
  const [dataSource, setDataSource] = useState<any[]>([]); // 列表数据
  const [dataSourceFilter, setDataSourceFilter] = useState<any[]>([]); //筛选后的列表数据
  const [CAEModalDrawer, setCAEDrawerData] = useState<CAEType>({ open: false, type: 'create', step: 0, sourceData: null }); // 创建和编辑弹窗数据

  const { name } = filterValues || {};

  useEffect(() => {
    // getRolePermission();
    getList();
  }, []);

  /** 获取业务域管理列表 */
  const getList = async (data?: any) => {
    try {
      setLoading(true);
      const postData = { name, ...data };
      const result = await SERVICE.businessDomain.businessDomainGet(postData);
      if (!result) return;
      onUpdateState({ ...postData, count: result.length });
      setDataSource(result);
      setFilterValues({ name: '' });
      setDataSourceFilter([]);
      setLoading(false);
      return result;
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    if (values?.name) {
      const newDataSourceFilter = _.filter(dataSource, (item: any) => {
        if (_.includes(item.name, values.name)) return true;
        return false;
      });
      setDataSourceFilter(newDataSourceFilter);
    } else {
      setDataSourceFilter([]);
    }
    setFilterValues(values);
  };

  /** 表格-分页 */
  const onChange = (pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, size: pageSize, rule: field || 'create_time', order: stateOrder };
    onUpdateState(state);
  };

  /** 打开创建和编辑侧边栏 */
  const onOpenCAEDrawer = (type: CAETypeType, step = 0, sourceData = null) => setCAEDrawerData({ open: true, type, step, sourceData });
  /** 关闭创建和编辑侧边栏 */
  const onCloseCAEDrawer = () => setCAEDrawerData({ open: false, type: 'create', step: 0, sourceData: null });

  /** 删除 */
  const onDelete = async (item: any, fn?: any) => {
    try {
      await SERVICE.businessDomain.businessDomainDelete(item?.id);
      getList();
      message.success(intl.get('businessDomain.deleteSuccess'));
      if (fn) fn();
    } catch (error: any) {
      if (error.status === 403 && error?.data?.code === 7) {
        modal.info({
          title: intl.get('businessDomain.cannotDelete'),
          content: intl.get('businessDomain.pleaseRemoveThemFirst'),
          okText: intl.get('global.understood'),
          onOk: fn ? fn() : () => {},
        });
      } else {
        message.error(error?.data?.message);
      }
    }
  };

  /** 删除 */
  const onDeleteConfirm = (item: any) => {
    const names = [`「${item?.name}」`];
    const modalConfirm = modal.confirm({
      title: intl.get('global.DeletePrompt'),
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: intl.get('global.areYouSureDelete-placeholder-cannotBeRestored', { names }),
      footer: (
        <div className='g-mt-4 g-flex-align-center' style={{ justifyContent: 'flex-end' }}>
          <Button
            className='g-mr-2'
            type='primary'
            danger
            onClick={() => {
              onDelete(item, () => modalConfirm.destroy());
            }}
          >
            {intl.get('global.Ok')}
          </Button>
          <Button onClick={() => modalConfirm.destroy()}>{intl.get('global.Cancel')}</Button>
        </div>
      ),
    });
  };

  /** 操作按钮 */
  const onOperate = (key: any, record: any) => {
    if (key === 'edit') onOpenCAEDrawer('edit', 0, record);
    if (key === 'memberManagement') onOpenCAEDrawer('edit', 1, record);
    if (key === 'delete') onDeleteConfirm(record);
  };

  const columns: any = [
    {
      title: intl.get('businessDomain.tableColumns.name'),
      dataIndex: 'name',
      fixed: 'left',
      sorter: true,
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div className='g-flex-align-center'>
          <img src={domain_svg} className='g-mr-2' style={{ width: 30, height: 30 }} />
          <div>
            <Text className=' g-ellipsis-1' title={value}>
              {value}
            </Text>
            <Text className='g-mt-1 g-ellipsis-1 g-c-text-sub' level={1} title={record.description}>
              {record.description || '--'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: intl.get('businessDomain.tableColumns.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      width: 80,
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => {
        const dropdownMenu: any = _.filter(
          [
            { key: 'edit', label: intl.get('businessDomain.tableColumns.menus.basicInformation') },
            { key: 'memberManagement', label: intl.get('businessDomain.tableColumns.menus.authorizationManagement') },
            record?.id !== 'bd_public' && { key: 'delete', label: intl.get('businessDomain.tableColumns.menus.delete') },
          ],
          Boolean,
        );
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu,
              onClick: (event: any) => {
                event.domEvent.stopPropagation();
                onOperate(event?.key, record);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={event => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    { title: intl.get('businessDomain.tableColumns.associatedProduct'), dataIndex: 'products', width: 100, __selected: true, render: () => 'DIP' },
    {
      title: intl.get('businessDomain.tableColumns.creator'),
      dataIndex: 'creator',
      width: 150,
      __selected: true,
      render: (value: string, record: any) => {
        if (record?.id === 'bd_public') return intl.get('businessDomain.tableColumns.builtIn');
        return value;
      },
    },
    {
      title: intl.get('businessDomain.tableColumns.createdTime'),
      dataIndex: 'create_time',
      width: 150,
      __selected: true,
      render: (value: string) => {
        return dayjs(value).format('YYYY/MM/DD HH:mm:ss');
      },
    },
  ];

  return (
    <div className='g-h-100' style={{ padding: '16px 32px' }}>
      <div id='business-domain-management-container' />
      <Table.PageTable
        name='business-domain'
        rowKey='id'
        loading={loading}
        columns={columns}
        dataSource={filterValues?.name ? dataSourceFilter : dataSource}
        pagination={pagination}
        locale={filterValues?.name ? { emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.get('businessDomain.sorryNoFound')} /> } : {}}
        onChange={onChange}
      >
        <Table.Operation
          nameConfig={{ key: 'name', value: name, placeholder: intl.get('businessDomain.pleaseEnterTheBusinessDomainName') }}
          // sortConfig={{ items: MENU_SORT_ITEMS, order, rule, onChange: onSortChange }}
          initialFilter={filterValues}
          onChange={onChangeFilter}
          onRefresh={getList}
        >
          <Button.Create onClick={() => onOpenCAEDrawer('create')}>{intl.get('businessDomain.drawer.name_create')}</Button.Create>
        </Table.Operation>
      </Table.PageTable>
      {CAEModalDrawer.open && (
        <CreateAndEditDrawer
          open={CAEModalDrawer.open}
          type={CAEModalDrawer.type}
          step={CAEModalDrawer.step}
          source={CAEModalDrawer.sourceData}
          onCancel={onCloseCAEDrawer}
          onRefresh={getList}
        />
      )}
    </div>
  );
};

export default BusinessDomainManagement;
