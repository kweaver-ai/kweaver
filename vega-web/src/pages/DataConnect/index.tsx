import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { EllipsisOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Badge, Dropdown, MenuProps, Tooltip } from 'antd';
import { TablePaginationConfig } from 'antd/es/table';
import dayjs from 'dayjs';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import DetailDrawer, { DataItem } from '@/components/DetailDrawer';
import { PAGINATION_DEFAULT, DATE_FORMAT } from '@/hooks/useConstants';
import { StateConfigType } from '@/hooks/usePageState';
import atomDataViewApi from '@/services/atomDataView';
import api from '@/services/dataConnect';
import DataConnectType from '@/services/dataConnect/type';
import scanApi from '@/services/scanManagement';
import HOOKS from '@/hooks';
import { Table, Button, Select } from '@/web-library/common';
import DatabaseTable from './Components/DatabaseTable';
import ExcelTable from './Components/ExcelTable';
import ScanTask from './Components/SacnTask';
import ExcelForm from './ExcelForm';
import styles from './index.module.less';
import { getConnector, USER_ID_REQUIRED_TYPES, getScanStatusColor } from './utils';

const DATA_SOURCE_TYPE_FILTERS = ['structured', 'no-structured', 'other'] as const;
const ATOM_DATA_VIEW_CHECK_LIMIT = 2;

interface DataSourceProps {
  connectors: DataConnectType.Connector[];
  getTableType: (type: string, val: string) => JSX.Element | string;
}

const DataSource = (props: DataSourceProps): JSX.Element => {
  const history = useHistory();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState({ sort: 'updated_at' }); // 分页信息
  const { connectors, getTableType } = props;
  const [tableData, setTableData] = useState<DataConnectType.Data[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterValues, setFilterValues] = useState<{ keyword: string; type: string }>({ keyword: '', type: 'all' }); // 表格的筛选条件
  const [detailDrawerData, setDetailDrawerData] = useState<DataItem[] | null>(null);
  const [detail, setDetail] = useState<DataConnectType.Data>();
  const [excelFormOpen, setExcelFormOpen] = useState<boolean>(false);
  const { sort, direction } = pageState || {};
  const { message } = HOOKS.useGlobalContext();

  const MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByNameLabel') },
    { key: 'updated_at', label: intl.get('Global.sortByUpdateTimeLabel') },
  ];

  useEffect(() => {
    getData();
  }, []);

  /** 获取列表数据 */
  const getTableData = async (pageParams: StateConfigType, filters?: { keyword: string; type: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await api.getDataSourceList({
        ...pageState,
        ...pageParams,
        ...(filters || filterValues),
      });

      const { total_count, entries } = res;

      setTableData(entries);
      onUpdateState({ ...pagination, total: total_count, ...pageParams });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to get data source list:', error);
    }
  };

  /** 获取列表数据 */
  const getData = async (values?: { keyword: string; type: string }): Promise<void> => {
    try {
      return await getTableData({ ...pageState, offset: 0 }, values);
    } catch (error) {
      console.error('Failed to get data:', error);
    }
  };

  /** table 页面切换 */
  const handleTableChange = async (pagination: TablePaginationConfig, _filters: unknown, sorter: any): Promise<void> => {
    const { current = 1, pageSize = PAGINATION_DEFAULT.pageSize } = pagination;
    await getTableData({
      offset: pageSize * (current - 1),
      limit: pageSize,
      sort: sorter?.field,
      direction: sorter?.order === 'ascend' ? 'asc' : 'desc',
    });
  };

  /** 删除确认 */
  const deleteConfirm = async (id: string): Promise<void> => {
    try {
      const params = {
        data_source_id: id,
        offset: 0,
        limit: ATOM_DATA_VIEW_CHECK_LIMIT,
      };
      const dataViews = await atomDataViewApi.getDataViewList(params);
      if (dataViews.entries.length > 0) {
        message.error(intl.get('DataConnect.viewSourceHasViewTip'));
        return;
      }
      await api.deleteDataSource([id]);
      message.success(intl.get('Global.deleteSuccess'));
      await getData();
    } catch (error) {
      console.error('Failed to delete data source:', error);
    }
  };

  const getModalContent = async (id: string): Promise<void> => {
    const res = await api.getDataSourceById(id);
    const {
      name,
      comment,
      type,
      bin_data: { connect_protocol, database_name, host, port, account, token, replica_set, storage_protocol, storage_base },
      updated_by_username,
      updated_at,
    } = res;

    const isUserId = USER_ID_REQUIRED_TYPES.includes(type as any);

    const tokenCom = token
      ? [{ name: intl.get('DataConnect.token'), value: token }]
      : storage_protocol === 'doclib'
        ? []
        : [
            { name: isUserId ? intl.get('DataConnect.userID') : intl.get('DataConnect.userName'), value: account },
            { name: intl.get('DataConnect.password'), value: '********' },
          ];
    const databaseNameCom = database_name ? [{ name: intl.get('DataConnect.databaseName'), value: database_name }] : [];
    const replicaSetCom = replica_set ? [{ name: intl.get('DataConnect.replicaSetName'), value: replica_set }] : [];
    const storageProtocolCom = storage_protocol
      ? [
          {
            name: intl.get('DataConnect.storageProtocol'),
            value: storage_protocol === 'doclib' ? intl.get('DataConnect.doclib') : storage_protocol,
          },
        ]
      : [];
    const storageBaseCom = storage_base ? [{ name: intl.get('DataConnect.storageBase'), value: storage_base }] : [];

    const isExcel =
      type === 'excel'
        ? [
            {
              title: intl.get('DataConnect.metadataManagement'),
              content: [
                {
                  // name: intl.get('Global.view'),
                  isOneLine: true,
                  value: <ExcelTable dataConnectId={id} />,
                },
              ],
            },
          ]
        : [
            {
              title: (
                <>
                  {intl.get('DataConnect.libraryTableStructure')}
                  <Tooltip placement="bottom" title={intl.get('DataConnect.libraryTableStructureTip')}>
                    <ExclamationCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)', marginLeft: 6 }} />
                  </Tooltip>
                </>
              ),
              content: [
                {
                  // name: intl.get('Global.view'),
                  isOneLine: true,
                  value: <DatabaseTable dataConnectId={id} />,
                },
              ],
            },
            {
              title: intl.get('DataConnect.scanTaskLabel'),
              content: [
                {
                  // name: intl.get('Global.view'),
                  isOneLine: true,
                  value: <ScanTask dataConnectId={id} />,
                },
              ],
            },
          ];

    const cur = [
      {
        title: intl.get('Global.baseConfig'),
        content: [
          {
            name: intl.get('Global.dataSourceName_common'),
            value: name,
          },
          {
            name: intl.get('Global.dataSourceType_common'),
            value: getTableType(type, type === 'index_base' ? 'Index Base' : getConnector(type, connectors)?.show_connector_name || ''),
          },
          ...databaseNameCom,
          {
            name: intl.get('DataConnect.connectProtocol'),
            value: connect_protocol,
          },
          {
            name: intl.get('DataConnect.host'),
            value: host,
          },
          {
            name: intl.get('DataConnect.port'),
            value: port,
          },
          ...tokenCom,
          ...replicaSetCom,
          ...storageProtocolCom,
          ...storageBaseCom,
          {
            name: intl.get('Global.comment'),
            value: comment ? <span className={styles.preWrap}>{comment}</span> : '--',
          },
          {
            name: intl.get('Global.updatedByUsername'),
            value: updated_by_username || '--',
          },
          {
            name: intl.get('Global.updateTime'),
            value: updated_at ? dayjs(updated_at).format(DATE_FORMAT.DEFAULT) : '--',
          },
        ],
      },
      ...isExcel,
    ];

    setDetailDrawerData(cur);
  };

  const createScanTask = async (record: DataConnectType.Data) => {
    await scanApi.createScanTask({
      scan_name: record.name,
      ds_info: { ds_id: record.id, ds_type: record.type },
      type: 0,
    });
    message.success(intl.get('Global.scanTaskSuccess'));
  };

  const postTestConnect = async (record: DataConnectType.Data): Promise<void> => {
    const { bin_data, type } = record;

    const res = await api.postTestConnect({
      type,
      bin_data,
    });

    if (res) {
      message.success(intl.get('Global.testConnectorSucc'));
    }
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: DataConnectType.Data) => {
    if (key === 'view') {
      getModalContent(record.id);
    }
    if (key === 'create') {
      setDetail(record);
      setExcelFormOpen(true);
    }
    if (key === 'edit') {
      history.push(`/data-connect/edit/${record.id}`);
    }
    if (key === 'test') {
      postTestConnect(record);
    }
    if (key === 'scan') {
      createScanTask(record);
    }
    if (key === 'delete') deleteConfirm(record.id);
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      width: 350,
      minWidth: 350,
      // sorter: true,
      __fixed: true,
      __selected: true,
      render: (text: string) => <div className="g-ellipsis-1">{text}</div>,
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      minWidth: 80,
      __fixed: true,
      __selected: true,
      render: (_value: unknown, record: DataConnectType.Data) => {
        const allOperations = [
          { key: 'view', label: intl.get('Global.view'), visible: matchPermission(PERMISSION_CODES.VIEW, record.operations) },
          {
            key: 'scan',
            label: intl.get('DataConnect.scan'),
            visible: record.type != 'excel' && matchPermission(PERMISSION_CODES.SACN, record.operations),
          },
          {
            key: 'create',
            label: intl.get('DataConnect.createMetadata'),
            visible: record.type === 'excel' && matchPermission(PERMISSION_CODES.SACN, record.operations),
          },
          { key: 'edit', label: intl.get('Global.edit'), visible: matchPermission(PERMISSION_CODES.MODIFY, record.operations) },
          { key: 'test', label: intl.get('Global.testConnector'), visible: matchPermission(PERMISSION_CODES.MODIFY, record.operations) },
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
            <Button.Icon icon={<EllipsisOutlined className={styles.operationIcon} />} onClick={(event: React.MouseEvent) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('Global.dataSourceType_common'),
      dataIndex: 'type',
      minWidth: 150,
      // filters: typeFilters.map(val => ({ text: intl.get(`DataConnect.${val}`), value: val })),
      __fixed: true,
      __selected: true,
      render: (text: string): string | JSX.Element =>
        getTableType(text, text === 'index_base' ? 'Index Base' : getConnector(text, connectors)?.show_connector_name || ''),
    },
    {
      title: intl.get('DataConnect.host'),
      dataIndex: 'host',
      minWidth: 220,
      __fixed: true,
      __selected: true,
      render: (_: string, row: DataConnectType.Data): string => row.bin_data.host || '--',
    },
    {
      title: intl.get('Global.operationUser'),
      dataIndex: 'updated_by_username',
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string): string => text || '--',
    },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'updated_at',
      sorter: true,
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string): string => (text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'),
    },
    {
      title: intl.get('DataConnect.scanStatusLabel'),
      dataIndex: 'latest_task_status',
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string): string | JSX.Element => {
        const { label, color } = getScanStatusColor(text);
        return <Badge status={color} text={label} />;
      },
    },
  ];

  /** 筛选 */
  const onChangeFilter = (values: { keyword: string; type: string }) => {
    getData(values);
    setFilterValues(values);
  };

  useEffect(() => {
    console.log('filterValues', filterValues);
  }, [filterValues]);

  /** 排序 */
  const onSortChange = (data: { key: string; direction: 'asc' | 'desc' }) => {
    const state = { sort: data.key, direction: data.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc' };
    getTableData(state);
  };

  return (
    <div className={styles.box}>
      <Table.PageTable
        name="data-connect"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={tableData}
        pagination={pagination}
        onChange={handleTableChange}
      >
        <Table.Operation
          nameConfig={{ key: 'keyword', placeholder: intl.get('DataConnect.searchConnectionName') }}
          isControlFilter
          initialFilter={filterValues}
          sortConfig={{ items: MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
          onChange={onChangeFilter}
          onRefresh={getData}
        >
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('data_connection'))}>
            <Button.Create onClick={() => history.push('/data-connect/create')} />
          </ContainerIsVisible>
          <Select.LabelSelect
            key="type"
            label={intl.get('Global.dataSourceType_common')}
            defaultValue="all"
            className={styles.statusSelect}
            options={[
              { value: 'all', label: intl.get('Global.all') },
              ...DATA_SOURCE_TYPE_FILTERS.map((val) => ({
                label: intl.get(`DataConnect.${val}`),
                value: val,
              })),
            ]}
          />
        </Table.Operation>
      </Table.PageTable>
      <DetailDrawer data={detailDrawerData} title={intl.get('DataConnect.dataConnectDetail')} width={1040} onClose={() => setDetailDrawerData(null)} />
      <ExcelForm detail={detail} open={excelFormOpen && !!detail} onCancel={() => setExcelFormOpen(false)} />
    </div>
  );
};

export default DataSource;
