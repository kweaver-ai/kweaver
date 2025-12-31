import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Splitter } from 'antd';
import { TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import DetailDrawer, { DataItem } from '@/components/DetailDrawer';
import { useAuthorization } from '@/hooks/useAuthorization';
import { DATABASE_ICON_MAP, DATE_FORMAT } from '@/hooks/useConstants';
import { StateConfigType } from '@/hooks/usePageState';
import api from '@/services/atomDataView';
import AtomDataViewType from '@/services/atomDataView/type';
import dataConnectApi from '@/services/dataConnect';
import DataConnectType from '@/services/dataConnect/type';
import HOOKS from '@/hooks';
import { Table, Button, IconFont } from '@/web-library/common';
import FieldTable from './components/FieldTable';
import GroupSidebar from './components/GroupSidebar';
import DataViewForm from './DataViewForm';
import styles from './index.module.less';
import PreviewData from '../CustomDataView/MainContent/PreviewData';
import { transformAndMapDataSources } from '../DataConnect/utils';

const getIconCom = (type: string): JSX.Element => {
  const cur = DATABASE_ICON_MAP[type as keyof typeof DATABASE_ICON_MAP];

  if (cur) {
    return <IconFont type={cur.coloredName} />;
  }

  return <IconFont type="icon-dip-color-postgre-wubaisebeijingban" />;
};

const getTableType = (type: string, val: string): JSX.Element | string => {
  const cur = DATABASE_ICON_MAP[type as keyof typeof DATABASE_ICON_MAP];

  if (cur) {
    return (
      <>
        <IconFont type={cur.coloredName} /> {val}
      </>
    );
  }

  return val;
};

interface FilterValues {
  keyword: string;
  type: string;
}

const AtomDataView = (): JSX.Element => {
  const { modal } = HOOKS.useGlobalContext();
  const history = useHistory();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState({ sort: 'update_time' }); // 分页信息
  const { CHANGE_TYPE_MAP } = HOOKS.useConstants();
  const [tableData, setTableData] = useState<AtomDataViewType.Data[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [detailDrawerData, setDetailDrawerData] = useState<DataItem[] | null>(null);
  const [allDataSource, setAllDataSource] = useState<DataConnectType.Data[]>([]);
  const [dataSourceTree, setDataSourceTree] = useState<DataConnectType.Data[]>([]);
  const [tableParams, setTableParams] = useState<{ [key: string]: string }>({});
  const [editId, setEditId] = useState<string>('');
  const [previewId, setPreviewId] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [checkDatasource, setCheckDatasource] = useState<any>();
  const [selectedRows, setSelectedRows] = useState<AtomDataViewType.Data[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { sort, direction } = pageState || {};
  const { message } = HOOKS.useGlobalContext();
  const { openModal: openAuthorizationModal } = useAuthorization({
    title: intl.get('Global.viewPermissionConfig'),
    resourceName: intl.get('Global.viewPermissionConfig'),
    resourceType: 'data_view',
    mountNodeId: 'data-view-model-container',
  });

  const MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByNameLabel') },
    { key: 'update_time', label: intl.get('Global.sortByUpdateTimeLabel') },
  ];

  // 获取分组列表
  const getDataSourceList = async (): Promise<void> => {
    const res = await dataConnectApi.getDataSourceList({ limit: -1 });
    const cur: DataConnectType.Data[] = res.entries.map((val) => ({
      ...val.bin_data,
      ...val,
      title: val.name,
      key: val.id,
      icon: getIconCom(val.type),
      paramType: 'data_source_id',
      isLeaf: true,
    }));

    setAllDataSource(cur);
    setDataSourceTree(transformAndMapDataSources(cur));
  };

  useEffect(() => {
    getDataSourceList();
    getData();
  }, []);

  /** 获取列表数据 */
  const getTableData = async (pageParams: StateConfigType, filters?: { [key: string]: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.getDataViewList({
        ...pageState,
        ...pageParams,
        ...(filters || tableParams),
      });

      const { total_count, entries } = res;

      setTableData(entries);
      onUpdateState({ ...pagination, total: total_count, ...pageParams });
      setIsLoading(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error) {
      setIsLoading(false);
      console.log('error', error);
    }
  };

  /** 获取列表数据 */
  const getData = async (values?: { [key: string]: string }): Promise<void> => {
    try {
      return await getTableData({ ...pageState, offset: 0 }, values);
    } catch (error) {
      console.log('error', error);
    }
  };

  const changeTableParams = (params: { [key: string]: string }) => {
    const cur = { keyword: tableParams.keyword, ...params };
    setTableParams(cur);
    getData(cur);
  };

  /** table 页面切换 */
  const handleTableChange = async (pagination: TablePaginationConfig, _filters: unknown, sorter: any): Promise<void> => {
    const { current = 1, pageSize = 20 } = pagination;
    setSelectedRowKeys([]);
    setSelectedRows([]);
    await getTableData({
      offset: pageSize * (current - 1),
      limit: pageSize,
      sort: sorter?.field,
      direction: sorter?.order === 'ascend' ? 'asc' : 'desc',
      ...tableParams,
    });
  };

  /** 删除确认 */

  const deleteConfirm = async (record?: any): Promise<void> => {
    modal.confirm({
      content: intl.get('Global.deleteConfirmTitle', { name: record?.name || selectedRows.map((item) => item.name).join(',') }),
      icon: <IconFont type="icon-about" />,
      okText: intl.get('Global.ok'),
      okButtonProps: {
        style: { backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' },
      },
      footer: (_: any, { OkBtn, CancelBtn }: { OkBtn: React.ElementType; CancelBtn: React.ElementType }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      onOk: async () => {
        await api.batchDeleteDataViews(record?.id ? [record.id] : selectedRowKeys);
        await getData();
        message.success(intl.get('Global.deleteSuccess'));
      },
    });
  };

  const getModalContent = async (val: AtomDataViewType.Data): Promise<DataItem[]> => {
    const [data] = await api.getDataViewsByIds([val.id]);
    const fieldInfoContent = {
      title: intl.get('Global.fieldInfo'),
      content: [
        {
          // name: intl.get('Global.view'),
          isOneLine: true,
          value: <FieldTable data={data.fields || []} />,
        },
      ],
    };

    const baseConfigContent = {
      title: intl.get('Global.baseConfig'),
      content: [
        {
          name: intl.get('Global.name'),
          value: data.name,
        },
        {
          name: intl.get('DataView.technicalName'),
          value: data.technical_name,
        },
        {
          name: intl.get('Global.groupName'),
          value: data.group_name || '--',
        },
        {
          name: intl.get('Global.type'),
          value: data.type,
        },
        {
          name: intl.get('Global.queryType'),
          value: data.query_type,
        },
        {
          name: intl.get('Global.dataSourceName'),
          value: data.data_source_name || '--',
        },
        {
          name: intl.get('Global.dataSourceType'),
          value: data.data_source_type || '--',
        },
        {
          name: intl.get('Global.comment'),
          value: data.comment || '--',
        },
        {
          name: intl.get('Global.status'),
          value: data.status,
        },
        {
          name: intl.get('Global.createTime'),
          value: data.create_time ? dayjs(data.create_time).format(DATE_FORMAT.DEFAULT) : '--',
        },
        {
          name: intl.get('Global.updateTime'),
          value: data.update_time ? dayjs(data.update_time).format(DATE_FORMAT.DEFAULT) : '--',
        },
      ],
    };

    const dataRangeContent = val?.file_name
      ? [
          {
            title: intl.get('DataView.dataRange'),
            content: [
              {
                name: intl.get('DataView.sheetSpa'),
                value: val?.excel_config?.sheet,
              },
              {
                name: intl.get('DataView.cellRange'),
                value: `${val?.excel_config?.start_cell}-${val?.excel_config?.end_cell}`,
              },
              {
                name: intl.get('DataView.hasHeaders'),
                value: val?.excel_config?.has_headers ? intl.get('DataView.hasHeadersTrue') : intl.get('DataView.hasHeadersFalse'),
              },
              {
                name: intl.get('DataView.sheetAsNewColumn'),
                value: val?.excel_config?.sheet_as_new_column ? intl.get('Global.yes') : intl.get('Global.no'),
              },
            ],
          },
        ]
      : [];

    return [baseConfigContent, ...dataRangeContent, fieldInfoContent];
  };

  const replaceData = (): void => {
    getData();
  };

  const onClose = (isUpdate?: boolean): void => {
    if (isUpdate) {
      replaceData();
    }
    setShowDrawer(false);
    setEditId('');
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: AtomDataViewType.Data) => {
    if (key === 'view') {
      getModalContent(record).then(setDetailDrawerData);
    }
    if (key === 'edit') {
      setShowDrawer(true);
      setEditId(record.id);
    }
    if (key === 'preview') {
      setPreviewOpen(true);
      setPreviewId(record.id);
      setPreviewName(record.name);
    }
    if (key === 'delete') deleteConfirm(record);
    if (key === 'row-column-permission') {
      history.push(`/custom-data-view/row-column-permission/${record.id}`);
    }
    if (key === 'data-view-permission') {
      openAuthorizationModal(record?.id);
    }
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      minWidth: 300,
      sorter: true,
      __fixed: true,
      __selected: true,
      render: (text: string) => text,
    },
    {
      title: intl.get('DataView.technicalName'),
      dataIndex: 'technical_name',
      fixed: 'left',
      ellipsis: true,
      minWidth: 250,
      __fixed: true,
      __selected: true,
      render: (text: string) => text || '--',
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      minWidth: 80,
      __fixed: true,
      __selected: true,
      render: (_value: unknown, record: AtomDataViewType.Data) => {
        const allOperations = [
          { key: 'view', label: intl.get('Global.view'), visible: matchPermission(PERMISSION_CODES.VIEW, record.operations) },
          {
            key: 'edit',
            label: intl.get('Global.edit'),
            visible: record.data_source_type !== 'index_base' && matchPermission(PERMISSION_CODES.MODIFY, record.operations),
          },
          { key: 'preview', label: intl.get('Global.dataPreview'), visible: true },
          {
            key: 'delete',
            label: intl.get('Global.delete'),
            visible: record.data_source_type !== 'index_base' && matchPermission(PERMISSION_CODES.DELETE, record.operations),
          },
          {
            key: 'row-column-permission',
            label: intl.get('Global.rowColumnPermissionConfig'),
            visible: matchPermission(PERMISSION_CODES.RULE_MANAGE, record.operations) || matchPermission(PERMISSION_CODES.RULE_AUTHORIZE, record.operations),
          },
          {
            key: 'data-view-permission',
            label: intl.get('Global.viewPermissionConfig'),
            visible: matchPermission(PERMISSION_CODES.AUTHORIZE, record.operations),
          },
        ];
        const dropdownMenu: any = allOperations.filter((val) => val.visible);
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu,
              onClick: (event) => {
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
      title: intl.get('Global.status'),
      dataIndex: 'status',
      ellipsis: true,
      minWidth: 250,
      __fixed: true,
      __selected: true,
      render: (text: keyof typeof CHANGE_TYPE_MAP) =>
        text === 'delete' ? <span style={{ color: 'red' }}>{CHANGE_TYPE_MAP[text]}</span> : text ? CHANGE_TYPE_MAP[text] : '--',
    },
    {
      title: intl.get('DataView.ownedDataSource'),
      dataIndex: 'group_name',
      minWidth: 180,
      __fixed: true,
      __selected: true,
      render: (text: string, row: AtomDataViewType.Data): JSX.Element | string => (text ? getTableType(row.data_source_type, text) : '--'),
    },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      sorter: true,
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: number): string => (text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'),
    },
  ];

  /** 筛选 */
  const onChangeFilter = (values: FilterValues) => {
    const params = { ...tableParams, ...values };
    setTableParams(params);
    getData(params);
  };

  /** 排序 */
  const onSortChange = (data: { key: string; direction: 'asc' | 'desc' }) => {
    const state = { sort: data.key, direction: data.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc' };
    getTableData(state);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any): void => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
    },
    onSelectAll: (selected: any): void => {
      const newSelectedRowKeys = selected ? tableData.filter((val) => !val.builtin).map((item) => item.id) : [];
      const newSelectedRows = selected ? tableData : [];

      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
    getCheckboxProps: (row: any): Record<string, any> => ({
      disabled: row.data_source_type === 'index_base',
    }),
  };

  return (
    <div className={styles.container}>
      <div id="data-view-model-container"></div>
      <Splitter>
        <Splitter.Panel defaultSize={240} min={0} max={280} collapsible>
          <GroupSidebar
            allDataSource={allDataSource}
            dataSourceTree={dataSourceTree}
            setDataSourceTree={setDataSourceTree}
            setTableParams={changeTableParams}
            setCheckDatasource={setCheckDatasource}
          />
        </Splitter.Panel>
        <Splitter.Panel>
          <div className={styles['data-view-wrapper']}>
            <Table.PageTable
              name="atom-data-view"
              rowKey="id"
              columns={columns}
              loading={isLoading}
              dataSource={tableData}
              rowSelection={rowSelection}
              pagination={pagination}
              onChange={handleTableChange}
            >
              <Table.Operation
                nameConfig={{ key: 'keyword', placeholder: intl.get('Global.search') }}
                initialFilter={tableParams}
                sortConfig={{ items: MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
                onChange={onChangeFilter}
                onRefresh={getData}
              >
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.DELETE, getTypePermissionOperation('data_view'))}>
                  <Button.Delete disabled={!selectedRowKeys?.length} onClick={() => deleteConfirm()} />
                </ContainerIsVisible>
              </Table.Operation>
            </Table.PageTable>
          </div>
        </Splitter.Panel>
      </Splitter>
      <DetailDrawer data={detailDrawerData} title={intl.get('DataView.dataViewDetail')} width={1040} onClose={() => setDetailDrawerData(null)} />

      <DataViewForm visible={showDrawer} onClose={onClose} id={editId} checkDatasource={checkDatasource} />

      <PreviewData open={previewOpen} id={previewId} name={previewName} onClose={() => setPreviewOpen(false)} />
    </div>
  );
};

export default AtomDataView;
