import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Dropdown, Empty, message } from 'antd';
import { SorterResult } from 'antd/es/table/interface';
import { TableProps } from 'antd/lib/table';
import dayjs from 'dayjs';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import Tags from '@/components/Tags';
import frameworkProps from '@/utils/axios-http/frameworkProps';
import downFile from '@/utils/down-file';
import api from '@/services/Knowledge-network';
import KnowledgeNetworkType from '@/services/Knowledge-network/type';
import createImage from '@/assets/images/common/create.svg';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import { Table, Button, Select, Title, IconFont } from '@/web-library/common';
import CreateAndEditForm from './CreateAndEditForm';
import styles from './index.module.less';
import ImportCom from './Operation/import';

const KnowledgeNetwork = () => {
  const history = useHistory();
  const { modal } = HOOKS.useGlobalContext();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageStateNew(); // 分页信息
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<KnowledgeNetworkType.Detail[]>([]);
  const [tableData, setTableData] = useState<KnowledgeNetworkType.Detail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<Pick<KnowledgeNetworkType.ListQuery, 'name_pattern' | 'tag'>>({ name_pattern: '', tag: 'all' }); // 筛选条件
  const [checkId, setCheckId] = useState<string>();
  const [open, setOpen] = useState<boolean>(false);
  const { page, limit, direction, sort } = pageState || {};
  const { name_pattern, tag } = filterValues || {};

  // 使用全局 Hook 获取国际化常量
  const { KN_MENU_SORT_ITEMS } = HOOKS.useConstants();

  /** 获取列表数据 */
  const getTableData = async (val?: any): Promise<void> => {
    const postData = { offset: val?.page ? limit * (val?.page - 1) : limit * (page - 1), limit, direction, sort, name_pattern, tag, ...val };
    if (!postData.tag || postData.tag === 'all') delete postData.tag;
    const curPage = val?.page || page;
    if (val?.page) delete postData.page;
    setIsLoading(true);
    // 根据指标模型名称排序，向后端传参为 model_name
    try {
      const res = await api.queryNetworks(postData);
      if (!res) return;
      const { total_count, entries } = res;

      onUpdateState({ ...postData, page: curPage, count: total_count });
      setTableData(entries);

      setIsLoading(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error) {
      setIsLoading(false);
      console.log('error', error);
    }
  };

  useEffect(() => {
    frameworkProps.data.toggleSideBarShow(true);
    getTableData();
  }, []);

  /** 筛选条件变更 */
  const onChangeTableOperation = (values: Pick<KnowledgeNetworkType.ListQuery, 'name_pattern' | 'tag'>) => {
    getTableData({ offset: 0, ...values });
    setFilterValues(values);
  };

  /** table Change */
  const handleTableChange: TableProps['onChange'] = async (pagination, _filters, sorter): Promise<void> => {
    const { field, order } = sorter as SorterResult;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, limit: pageSize, sort: (field as string) || 'update_time', direction: stateOrder };
    onUpdateState(state);
    getTableData(state);
  };

  const onCancel = () => {
    setCheckId(undefined);
    setOpen(false);
  };

  const changeDel = (row?: KnowledgeNetworkType.Detail) => {
    const content = row
      ? intl.get('Global.deleteConfirm', { name: row.name })
      : intl.get('Global.deleteConfirmMultiple', { names: selectedRows.map((val) => val.name).join(','), count: selectedRows.length });
    modal.confirm({
      title: '',
      content: content,
      icon: <ExclamationCircleFilled />,
      async onOk() {
        await api.deleteNetwork(row ? [row.id] : selectedRowKeys);
        message.success(intl.get('Global.deleteSuccess'));
        getTableData({ offset: 0 });
      },
    });
  };

  const exportData = async (id: string): Promise<void> => {
    const res = await api.detailNetwork({ knIds: [id], mode: 'export' });
    downFile(JSON.stringify(res, null, 2), res.name, 'json');
    message.success(intl.get('Global.exportSuccess'));
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: KnowledgeNetworkType.Detail) => {
    if (key === 'view') {
      localStorage.setItem('KnowledgeNetwork.id', record.id);
      history.push(`/ontology/main/overview?id=${record.id}`);
    }
    if (key === 'edit') {
      setCheckId(record.id);
      setOpen(true);
    }
    if (key === 'export') exportData(record.id);
    if (key === 'delete') changeDel(record);
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      sorter: true,
      width: 350,
      __fixed: true,
      __selected: true,
      render: (value: string, record: KnowledgeNetworkType.Detail) => (
        <div className="g-flex-align-center" style={{ lineHeight: '22px' }} title={value}>
          <div className={styles['name-icon']} style={{ background: record.color }}>
            <IconFont type={record.icon} style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <a style={{ fontSize: 14, color: '#000' }} onClick={() => onOperate('view', record)}>
              {record.name}
            </a>
            <p className="g-ellipsis-1" style={{ fontSize: 12, opacity: 0.45 }} title={record.comment}>
              {record.comment || intl.get('Global.noComment')}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      width: 80,
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => {
        const allOperations = [
          { key: 'view', label: intl.get('Global.view'), visible: matchPermission(PERMISSION_CODES.VIEW, record.operations) },
          { key: 'edit', label: intl.get('Global.edit'), visible: matchPermission(PERMISSION_CODES.MODIFY, record.operations) },
          { key: 'export', label: intl.get('Global.export'), visible: matchPermission(PERMISSION_CODES.EXPORT, record.operations) },
          { key: 'delete', label: intl.get('Global.delete'), visible: matchPermission(PERMISSION_CODES.DELETE, record.operations) },
        ];
        const dropdownMenu: any = allOperations.filter((val) => val.visible);
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
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      width: 150,
      __selected: true,
      render: (value: string[]) => <Tags value={value} />,
    },
    {
      title: intl.get('Global.modifier'),
      dataIndex: 'updater',
      width: 150,
      __selected: true,
      render: (value: any, record: any) => record?.updater?.name || '--',
    },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      width: 200,
      __selected: true,
      render: (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm:ss') : '--'),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any): void => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    onSelectAll: (selected: any): void => {
      const newSelectedRowKeys = selected ? tableData.map((item) => item.id) : [];
      const newSelectedRows = selected ? tableData : [];

      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
    getCheckboxProps: (row: any): Record<string, any> => ({
      disabled: row.builtin,
    }),
  };

  /** 排序 */
  const handleSortChange = (val: { key: string }) => {
    const state = {
      sort: val.key,
      direction: val.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc',
    };
    getTableData(state);
  };

  return (
    <div className={styles['box']}>
      <div id="userCom"></div>
      <Title>{intl.get('KnowledgeNetwork.businessKnowledgeNetwork')}</Title>
      <div style={{ height: 'calc(100% - 30px)' }}>
        <Table.PageTable
          name="metric-model"
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={tableData}
          // rowSelection={rowSelection}
          pagination={pagination}
          onChange={handleTableChange}
          locale={{
            emptyText:
              filterValues.name_pattern || filterValues.tag !== 'all' ? (
                <Empty image={noSearchResultImage} description={intl.get('Global.emptyNoSearchResult')} />
              ) : matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('knowledge_network')) ? (
                <Empty
                  image={createImage}
                  description={
                    <span>
                      {intl.get('KnowledgeNetwork.emptyCreate')}
                      <Button type="link" style={{ padding: 0 }} onClick={() => setOpen(true)}>
                        {intl.get('Global.emptyCreateButton')}
                      </Button>
                      {intl.get('KnowledgeNetwork.emptyCreateTip')}
                    </span>
                  }
                />
              ) : (
                <Empty image={emptyImage} description={intl.get('KnowledgeNetwork.emptyDescription')} />
              ),
          }}
        >
          <Table.Operation
            nameConfig={{ key: 'name_pattern', placeholder: intl.get('Global.filterByNameOrId') }}
            sortConfig={{ items: KN_MENU_SORT_ITEMS, order: direction, rule: sort, onChange: handleSortChange }}
            initialFilter={filterValues}
            onChange={onChangeTableOperation}
            onRefresh={getTableData}
          >
            <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('knowledge_network'))}>
              <Button.Create onClick={() => setOpen(true)} />
            </ContainerIsVisible>
            <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.IMPORT, getTypePermissionOperation('knowledge_network'))}>
              <ImportCom callback={getTableData} />
            </ContainerIsVisible>
            <Select.LabelSelect
              key="tag"
              label={intl.get('Global.tag')}
              defaultValue="all"
              style={{ width: 190 }}
              options={[{ value: 'all', label: intl.get('Global.all') }]}
            />
          </Table.Operation>
        </Table.PageTable>
        <CreateAndEditForm open={open} onCancel={onCancel} id={checkId} callBack={() => getTableData({ offset: 0 })} />
      </div>
    </div>
  );
};

export default KnowledgeNetwork;
