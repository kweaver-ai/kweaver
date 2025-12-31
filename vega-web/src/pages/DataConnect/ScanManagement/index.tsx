import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { EllipsisOutlined } from '@ant-design/icons';
import { Badge, Dropdown, MenuProps, TablePaginationConfig } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import dayjs from 'dayjs';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import { PAGINATION_DEFAULT, DATE_FORMAT } from '@/hooks/useConstants';
import { StateConfigType } from '@/hooks/usePageState';
import api from '@/services/dataConnect';
import DataConnectType from '@/services/dataConnect/type';
import scanManagementApi from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import HOOKS from '@/hooks';
import { Table, Button, IconFont, Select } from '@/web-library/common';
import { DatabaseTableSelect } from '../Components/DatabaseTableSelect';
import ScanDetail from '../Components/SacnTask/detail';
import ScanModal from '../Components/ScanModal';
import styles from '../index.module.less';
import { dataBaseIconList, getScanStatusColor, transformAndMapDataSources } from '../utils';

const SCAN_STATUS_FILTERS = ['wait', 'running', 'success', 'fail'] as const;

const getIconCom = (type: string): JSX.Element => {
  const cur = dataBaseIconList[type];

  if (cur) {
    return <IconFont type={cur.coloredName} />;
  }

  return <IconFont type="icon-dip-color-postgre-wubaisebeijingban" />;
};

interface ScanManagementProps {
  connectors: DataConnectType.Connector[];
  getTableType: (type: string, val: string) => JSX.Element | string;
}

const ScanManagement = (props: ScanManagementProps): JSX.Element => {
  const { connectors, getTableType } = props;
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState({ sort: 'start_time' }); // 分页信息
  const [tableData, setTableData] = useState<ScanTaskType.ScanTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<{ keyword: string; status: ScanTaskType.Status }>({ keyword: '', status: 'all' }); // 表格的筛选条件
  const { message } = HOOKS.useGlobalContext();
  const [allDataSource, setAllDataSource] = useState<DataConnectType.Data[]>([]);
  const [dataSourceTree, setDataSourceTree] = useState<DataConnectType.Data[]>([]);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [databaseTableSelectOpen, setDatabaseTableSelectOpen] = useState(false);
  const [scanDetailVisible, setScanDetailVisible] = useState(false);
  const [scanDetail, setScanDetail] = useState<ScanTaskType.ScanTaskItem>();

  const MENU_SORT_ITEMS: MenuProps['items'] = [
    { key: 'name', label: intl.get('Global.sortByNameLabel') },
    { key: 'start_time', label: intl.get('Global.sortByStartTimeLabel') },
  ];

  const { sort, direction } = pageState || {};

  const onDatabaseTableSelectOk = async (val: ScanTaskType.TableInfo[], dataConnectId: string): Promise<void> => {
    setDatabaseTableSelectOpen(false);
    await scanManagementApi.createScanTask({
      scan_name: val[0].name + (val.length > 1 ? intl.get('Global.etc') : ''),
      ds_info: { ds_id: dataConnectId, ds_type: allDataSource.find((val) => val.id === dataConnectId)?.type || '' },
      type: 1,
      tables: val.map((val) => val.id),
    });
    message.success(intl.get('Global.scanTaskSuccess'));
    getData();
  };

  const onDatabaseTableSelectCancel = (): void => {
    setDatabaseTableSelectOpen(false);
  };

  // 获取分组列表
  const getDataSourceList = async (): Promise<void> => {
    const res = await api.getDataSourceList({ limit: -1 });
    const cur: DataConnectType.Data[] = res.entries
      .filter((val) => !val.is_built_in && val.type != 'excel' && matchPermission(PERMISSION_CODES.SACN, val.operations))
      .map((val) => ({
        ...val.bin_data,
        ...val,
        title: val.name,
        key: val.id,
        icon: getIconCom(val.type),
        paramType: 'dataSourceId',
        isLeaf: true,
      }));

    setAllDataSource(cur);
    setDataSourceTree(transformAndMapDataSources(cur));
  };

  /** 获取扫描任务列表数据 */
  const getTableData = async (pageParams: StateConfigType, filters?: { keyword: string; status: ScanTaskType.Status }): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await scanManagementApi.getScanTaskList({
        ...pageState,
        ...pageParams,
        ...(filters || filterValues),
      });

      const { total_count, entries } = res;

      setTableData(entries);
      onUpdateState({ ...pageState, total: total_count, ...pageParams });
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to get scan task list:', error);
    }
  };

  /** 获取列表数据 */
  const getData = async (values?: { keyword: string; status: ScanTaskType.Status }): Promise<void> => {
    try {
      return await getTableData({ ...pageState, offset: 0 }, values);
    } catch (error) {
      console.error('Failed to get data:', error);
    }
  };

  useEffect(() => {
    getData();
    getDataSourceList();
  }, []);

  /** table 页面切换 */
  const handleTableChange = async (pagination: TablePaginationConfig, _filters: unknown, sorter: any): Promise<void> => {
    const { current = PAGINATION_DEFAULT.current, pageSize = PAGINATION_DEFAULT.pageSize } = pagination;
    await getTableData({
      offset: pageSize * (current - 1),
      limit: pageSize,
      sort: sorter?.field,
      direction: sorter?.order === 'ascend' ? 'asc' : 'desc',
    });
  };

  /** 操作按钮 */
  const onOperate = (key: string, record: ScanTaskType.ScanTaskItem) => {
    if (key === 'view') {
      setScanDetail(record);
      setScanDetailVisible(true);
      // getModalContent(record.id)
    }
    // if (key === 'delete') deleteConfirm(record.id);
  };

  const getProcess = (record: ScanTaskType.ScanTaskItem) => {
    if (!record.allow_multi_table_scan) {
      return (record.scan_status === 'fail' || record.scan_status === 'success' ? 1 : 0) + '/1';
    }
    const task_result_info: ScanTaskType.TaskResultInfo = JSON.parse(record.task_result_info || '{}');
    const task_process_info: ScanTaskType.TaskProcessInfo = JSON.parse(record.task_process_info || '{}');
    const { table_count = 0, fail_count = 0, success_count = 0 } = { ...task_result_info, ...task_process_info };
    if (record.scan_status === 'success') {
      return table_count + '/' + table_count;
    }

    return fail_count + success_count + '/' + table_count;
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      width: 350,
      minWidth: 350,
      sorter: true,
      __fixed: true,
      __selected: true,
      render: (text: string, record: ScanTaskType.ScanTaskItem) => (
        <div className="g-ellipsis-1">{getTableType(record.type === 1 ? '1' : record.ds_type, text)}</div>
      ),
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      minWidth: 80,
      __fixed: true,
      __selected: true,
      render: (_value: unknown, record: ScanTaskType.ScanTaskItem) => {
        if (!record.allow_multi_table_scan) {
          return '--';
        }
        // const allOperations = [
        //     { key: 'view', label: intl.get('Global.view'), visible: matchPermission(PERMISSION_CODES.VIEW, record.operations) },
        //     { key: 'delete', label: intl.get('Global.delete'), visible: matchPermission(PERMISSION_CODES.DELETE, record.operations) }
        // ];
        const allOperations = [
          { key: 'view', label: intl.get('Global.view') },
          // { key: 'delete', label: intl.get('Global.delete') }
        ];
        const dropdownMenu: any = allOperations;
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
      title: intl.get('Global.scanStatus'),
      dataIndex: 'scan_status',
      minWidth: 150,
      __fixed: true,
      __selected: true,
      render: (text: string): string | JSX.Element => {
        const { label, color } = getScanStatusColor(text);
        return <Badge status={color} text={label} />;
      },
    },
    {
      title: intl.get('DataConnect.scanProcess'),
      dataIndex: 'process',
      minWidth: 220,
      __fixed: true,
      __selected: true,
      render: (_: string, row: ScanTaskType.ScanTaskItem): string => getProcess(row),
    },
    {
      title: intl.get('Global.creator'),
      dataIndex: 'create_user',
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string): string => text || '--',
    },
    {
      title: intl.get('Global.createTime'),
      dataIndex: 'start_time',
      sorter: true,
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: string): string => (text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'),
    },
  ];

  const items: MenuProps['items'] = [
    { key: '1', label: intl.get('DataConnect.createWithWholeDataSource') },
    { key: '2', label: intl.get('DataConnect.createWithTables') },
  ];

  const handleCreate = (val: ItemType) => {
    if (!val) {
      return;
    }
    if (val.key === '1') {
      setScanModalOpen(true);
    } else if (val.key === '2') {
      setDatabaseTableSelectOpen(true);
    }
  };

  const scanModalCancel = (isOk?: boolean) => {
    setScanModalOpen(false);
    if (isOk) {
      getData();
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: { keyword: string; status: ScanTaskType.Status }) => {
    getData(values);
    setFilterValues(values);
  };

  /** 排序 */
  const onSortChange = (data: { key: string; direction: 'asc' | 'desc' }) => {
    const state = { sort: data.key, direction: data.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc' };
    getTableData(state);
  };

  const scanDetailCancel = () => {
    setScanDetailVisible(false);
    setScanDetail(undefined);
  };

  return (
    <div className={styles.box}>
      <Table.PageTable
        name="scan-management"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={tableData}
        pagination={pagination}
        onChange={handleTableChange}
      >
        <Table.Operation
          nameConfig={{ key: 'keyword', placeholder: intl.get('DataConnect.searchTaskName') }}
          isControlFilter
          initialFilter={filterValues}
          sortConfig={{ items: MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
          onChange={onChangeFilter}
          onRefresh={getData}
        >
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('data_connection'))}>
            <Dropdown trigger={['click']} menu={{ items, onClick: handleCreate }}>
              <Button.Create icon={<IconFont type="icon-dip-saomiao1" />}>{intl.get('DataConnect.newScanTask')}</Button.Create>
            </Dropdown>
          </ContainerIsVisible>
          <Select.LabelSelect
            key="status"
            label={intl.get('Global.scanStatus')}
            defaultValue="all"
            className={styles.statusSelect}
            options={[
              { value: 'all', label: intl.get('Global.all') },
              ...SCAN_STATUS_FILTERS.map((val) => ({
                label: intl.get(`DataConnect.${val}`),
                value: val,
              })),
            ]}
          />
        </Table.Operation>
      </Table.PageTable>
      <ScanModal
        dataSourceTree={dataSourceTree}
        allDataSource={allDataSource}
        open={scanModalOpen}
        onClose={scanModalCancel}
        isEmpty={allDataSource.length === 0}
      />
      <DatabaseTableSelect open={databaseTableSelectOpen} onOk={onDatabaseTableSelectOk} onCancel={onDatabaseTableSelectCancel} />
      {scanDetail && <ScanDetail scanDetail={scanDetail} visible={scanDetailVisible} onClose={scanDetailCancel} />}
    </div>
  );
};

export default ScanManagement;
