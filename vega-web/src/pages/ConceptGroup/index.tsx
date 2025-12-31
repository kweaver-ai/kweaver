import { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Dropdown, Empty, message } from 'antd';
import { type MenuProps } from 'antd';
import { SorterResult } from 'antd/es/table/interface';
import { TableProps } from 'antd/lib/table';
import dayjs from 'dayjs';
import Tags from '@/components/Tags';
import downFile from '@/utils/down-file';
import api from '@/services/concept-group';
import ConceptGroupType from '@/services/concept-group/type';
import KnowledgeNetworkType from '@/services/Knowledge-network/type';
import createImage from '@/assets/images/common/create.svg';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import { Table, Button, Title, IconFont } from '@/web-library/common';
import AddObjectTypesModal from './AddObjectTypesModal';
import CreateAndEditForm from './CreateAndEditForm';
import Detail from './Detail';
import styles from './index.module.less';
import ImportCom from './Operation/import';

const MENU_SORT_ITEMS: MenuProps['items'] = [
  { key: 'name', label: intl.get('Global.sortByNameLabel') },
  { key: 'update_time', label: intl.get('Global.sortByUpdateTimeLabel') },
];

interface ConceptGroupProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission?: boolean;
}

const ConceptGroup = (props: ConceptGroupProps) => {
  const { modal } = HOOKS.useGlobalContext();
  const { detail, isPermission } = props;
  const { pageState, pagination, onUpdateState } = HOOKS.usePageStateNew(); // 分页信息
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<ConceptGroupType.Detail[]>([]);
  const [tableData, setTableData] = useState<ConceptGroupType.Detail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterValues, setFilterValues] = useState<Pick<ConceptGroupType.ListQuery, 'name_pattern' | 'tag'>>({ name_pattern: '', tag: 'all' }); // 筛选条件
  const [checkId, setCheckId] = useState<string>();
  const [open, setOpen] = useState<boolean>(false);
  const [addObjectTypesOpen, setAddObjectTypesOpen] = useState<boolean>(false);
  const [currentGroup, setCurrentGroup] = useState<ConceptGroupType.Detail | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [currentDetail, setCurrentDetail] = useState<ConceptGroupType.Detail | null>(null);
  const detailId = useRef<string>('');

  const knId = detail?.id || localStorage.getItem('KnowledgeNetwork.id')!;
  const { page, limit, direction, sort } = pageState || {};
  const { name_pattern, tag } = filterValues || {};

  /** 获取列表数据 */
  const getTableData = async (val?: any): Promise<void> => {
    if (!knId) return;
    const postData = { offset: val?.page ? limit * (val?.page - 1) : limit * (page - 1), limit, direction, sort, name_pattern, tag, ...val };
    if (!postData.tag || postData.tag === 'all') delete postData.tag;
    const curPage = val?.page || page;
    if (val?.page) delete postData.page;
    setIsLoading(true);
    try {
      const res = await api.queryConceptGroups(knId, postData);
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
    if (knId) {
      getTableData();
    }
  }, [knId]);

  /** 筛选条件变更 */
  const onChangeTableOperation = (values: Pick<ConceptGroupType.ListQuery, 'name_pattern' | 'tag'>) => {
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

  const changeDel = (row?: ConceptGroupType.Detail) => {
    if (!knId) return;
    const content = row
      ? intl.get('ConceptGroup.confirmDeleteSingle', { name: row.name })
      : intl.get('ConceptGroup.confirmDeleteMultiple', {
          names: selectedRows.map((val) => val.name).join(','),
          count: selectedRows.length,
        });
    modal.confirm({
      title: '',
      content: content,
      icon: <ExclamationCircleFilled />,
      async onOk() {
        await api.deleteConceptGroup(knId, row ? [row.id] : selectedRowKeys);
        message.success(intl.get('ConceptGroup.deleteSuccess'));
        getTableData({ offset: 0 });
      },
    });
  };

  const getObjectTypes = async (id: string) => {
    const detailData = await api.detailConceptGroup(knId, id);
    setCurrentDetail(detailData);
    setDetailOpen(true);
  };

  const exportData = async (id: string): Promise<void> => {
    const res = await api.detailConceptGroup(knId, id);
    downFile(JSON.stringify(res, null, 2), res.name, 'json');
    message.success(intl.get('Global.exportSuccess'));
  };

  /** 操作按钮 */
  const onOperate = async (key: string, record: ConceptGroupType.Detail) => {
    if (key === 'view') {
      detailId.current = record.id;
      // 调用详情接口获取完整数据
      setIsLoading(true);
      try {
        getObjectTypes(record.id);
      } catch (error) {
        console.log('error', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (key === 'edit') {
      setCheckId(record.id);
      setOpen(true);
    }
    if (key === 'delete') changeDel(record);
    if (key === 'addObjectTypes') {
      setCurrentGroup(record);
      setAddObjectTypesOpen(true);
    }
    if (key === 'export') exportData(record.id);
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
      render: (value: string, record: ConceptGroupType.Detail) => (
        <div className="g-flex-align-center" style={{ lineHeight: '22px', cursor: 'pointer' }} title={value} onClick={() => onOperate('view', record)}>
          <div className={styles['name-icon']} style={{ background: record.color }}>
            <IconFont type="icon-dip-fenzu" style={{ color: '#fff', fontSize: 20 }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, color: '#000' }}>{record.name}</span>
            <p className="g-ellipsis-1" style={{ fontSize: 12, opacity: 0.45 }} title={record.comment}>
              {record.comment || '--'}
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
          { key: 'view', label: intl.get('Global.view'), visible: true },
          // { key: 'addObjectTypes', label: intl.get('ConceptGroup.addObjectTypes'), visible: true },
          { key: 'edit', label: intl.get('Global.edit'), visible: isPermission },
          { key: 'export', label: intl.get('Global.export'), visible: true },
          { key: 'delete', label: intl.get('Global.delete'), visible: isPermission },
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
      title: intl.get('ConceptGroup.relatedResource'),
      dataIndex: 'statistics',
      width: 100,
      render: (value: any) => (
        <>
          <div className="g-flex-center" style={{ lineHeight: '22px' }}>
            <IconFont type="icon-dip-duixianglei" style={{ color: '#126EE3', fontSize: 16 }} />
            <span style={{ margin: '0 4px', width: 52, display: 'inline-block' }}>{value?.object_types_total || 0}</span>
            <IconFont type="icon-dip-guanxilei" style={{ color: '#08979C', fontSize: 16 }} />
            <span style={{ margin: '0 4px', width: 52, display: 'inline-block' }}>{value?.relation_types_total || 0}</span>
            <IconFont type="icon-dip-hangdonglei" style={{ color: '#90C06B', fontSize: 16 }} />
            <span style={{ margin: '0 4px', width: 52, display: 'inline-block' }}>{value?.action_types_total || 0}</span>
          </div>
        </>
      ),
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
      <Title>{intl.get('ConceptGroup.conceptGroup')}</Title>
      <div style={{ height: 'calc(100% - 30px)' }}>
        <Table.PageTable
          name="concept-group"
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
                <Empty image={noSearchResultImage} description={intl.get('Global.noResult')} />
              ) : (
                <Empty
                  image={createImage}
                  description={
                    <span>
                      {intl.get('ConceptGroup.click')}
                      <Button type="link" style={{ padding: 0 }} onClick={() => setOpen(true)}>
                        {intl.get('ConceptGroup.createButton')}
                      </Button>
                      {intl.get('ConceptGroup.addConceptGroupTip')}
                    </span>
                  }
                />
              ),
          }}
        >
          <Table.Operation
            nameConfig={{ key: 'name_pattern', placeholder: intl.get('Global.filterByNameOrId') }}
            sortConfig={{ items: MENU_SORT_ITEMS, order: direction, rule: sort, onChange: handleSortChange }}
            initialFilter={filterValues}
            onChange={onChangeTableOperation}
            onRefresh={getTableData}
          >
            {isPermission && <Button.Create onClick={() => setOpen(true)} />}
            {isPermission && <ImportCom callback={getTableData} knId={knId || 'default-kn-id'} />}
            {/* {isPermission && <Button.Delete onClick={() => changeDel()} disabled={!selectedRows?.length} />} */}
            {/* <Select.LabelSelect key="tag" label="标签" defaultValue="all" style={{ width: 190 }} options={[{ value: 'all', label: intl.get('global.All') }]} /> */}
          </Table.Operation>
        </Table.PageTable>
        <CreateAndEditForm
          open={open}
          onCancel={onCancel}
          id={checkId}
          callBack={() => {
            if (detailOpen) {
              getObjectTypes(detailId.current);
            }
            getTableData({ offset: 0 });
          }}
          knId={knId}
        />
        <AddObjectTypesModal
          open={addObjectTypesOpen}
          onCancel={() => setAddObjectTypesOpen(false)}
          onSuccess={() => getTableData({ offset: 0 })}
          knId={knId}
          groupId={currentGroup?.id || ''}
          groupName={currentGroup?.name || ''}
        />
        <Detail
          open={detailOpen}
          sourceData={currentDetail as ConceptGroupType.Detail}
          onClose={() => setDetailOpen(false)}
          onRefresh={getObjectTypes}
          exportData={exportData}
          isPermission={isPermission}
          onEdit={(id: string) => {
            // setDetailOpen(false);
            setCheckId(id);
            setOpen(true);
          }}
        />
      </div>
    </div>
  );
};

export default ConceptGroup;
