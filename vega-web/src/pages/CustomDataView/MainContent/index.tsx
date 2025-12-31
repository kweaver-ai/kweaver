import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { DragOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Upload, Tag, Dropdown } from 'antd';
import dayjs from 'dayjs';
import Cookie from 'js-cookie';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import { useAuthorization } from '@/hooks/useAuthorization';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import api from '@/services/customDataView';
import HOOKS from '@/hooks';
import { Button, Table, IconFont, Text, Select } from '@/web-library/common';
import ExportFile from '@/web-library/components/ExportFile';
import { DataViewItem } from '../type';
import { MoveToGroupModal } from './DetailContent/MoveToGroupModal';
import PreviewData from './PreviewData';
import { useCustomDataViewContext } from '../context';
import DataViewDetail from './DataViewDetail';

export const MainContent: React.FC = () => {
  const history = useHistory();
  const { modal } = HOOKS.useGlobalContext();
  const { currentSelectGroup, reloadGroup, setReloadGroup } = useCustomDataViewContext();
  const [isPreviewDataModalShow, setIsPreviewDataModalShow] = useState(false);
  const [isDataViewDetailModalShow, setIsDataViewDetailModalShow] = useState(false);
  const [currentId, setCurrentId] = useState<string>('');
  const [currentName, setCurrentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { openModal: openAuthorizationModal } = useAuthorization({
    title: intl.get('Global.viewPermissionConfig'),
    resourceName: intl.get('Global.viewPermissionConfig'),
    resourceType: 'data_view',
    mountNodeId: 'data-view-model-container',
  });
  const [tableData, setTableData] = useState<DataViewItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<DataViewItem[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isMoveToGroupModalShow, setIsMoveToGroupModalShow] = useState(false);
  const [tagsData, setTagsData] = useState<{ value: string; label: string }[]>([]);
  const [tableParams, setTableParams] = useState<{ sorter: unknown; filters: { [key: string]: any[] } }>({
    sorter: null,
    filters: { queryType: [] },
  });
  const [tablePagination, setTablePagination] = useState({
    ...PAGINATION_DEFAULT,
  });

  useEffect(() => {
    const getTagList = async (): Promise<void> => {
      const res = await api.getTagList();
      setTagsData(_.map(res.entries, (item) => ({ value: item.tag, label: item.tag })));
    };
    getTagList();
  }, []);

  /** 查看详情 */
  const onOpenDetailDrawer = (record: any) => {
    setCurrentId(record.id);
    setCurrentName(record.name);
    setIsDataViewDetailModalShow(true);
  };

  /** 删除弹窗 */
  const deleteConfirm = (record: any): void => {
    modal.confirm({
      content: intl.get('Global.deleteConfirmTitle', { name: record?.name || selectedRows?.map((item) => item.name).join(',') || '' }),
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
        const res = await api.deleteCustomDataView(record?.id || selectedRowKeys?.join(','));
        if (!res?.code) arNotification.success(intl.get('Global.deleteSuccess'));
        await getData();
        setReloadGroup(!reloadGroup);
      },
    });
  };

  /** 预览 */
  const previewData = (record: any): void => {
    setIsPreviewDataModalShow(true);
    setCurrentId(record.id);
    setCurrentName(record.name);
  };

  const onOperate = (key: string, record: any) => {
    if (key === 'preview') {
      previewData(record);
    } else if (key === 'view') {
      onOpenDetailDrawer(record);
    } else if (key === 'edit') {
      history.push(`/custom-data-view/detail/${record.id}`);
    } else if (key === 'delete') {
      deleteConfirm(record);
    } else if (key === 'row-column-permission') {
      history.push(`/custom-data-view/row-column-permission/${record.id}`);
    } else if (key === 'data-view-permission') {
      openAuthorizationModal(record?.id);
    }
  };

  const columns: any = [
    {
      title: intl.get('Global.viewName'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      minWidth: 150,
      sorter: true,
      __fixed: true,
      __selected: true,
      render: (text: any) => text,
    },
    {
      title: intl.get('Global.operation'),
      width: 100,
      align: 'center',
      __selected: true,
      render: (_text: any, record: any): JSX.Element => {
        const allOperations = [
          { key: 'view', label: intl.get('Global.view'), visible: matchPermission(PERMISSION_CODES.VIEW, record.operations) },
          { key: 'preview', label: intl.get('Global.dataPreview'), visible: true },
          { key: 'edit', label: intl.get('Global.edit'), visible: matchPermission(PERMISSION_CODES.MODIFY, record.operations) },
          { key: 'delete', label: intl.get('Global.delete'), visible: matchPermission(PERMISSION_CODES.DELETE, record.operations) },
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
        const dropdownMenu: any = allOperations.filter((val: any) => val.visible);
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
      title: intl.get('Global.queryType'),
      dataIndex: 'query_type',
      ellipsis: true,
      minWidth: 150,
      __selected: true,
      render: (text: any) => text,
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      minWidth: 200,
      __fixed: true,
      __selected: true,
      render: (text: any): React.ReactNode => {
        return Array.isArray(text) && text.length ? _.map(text, (i) => <Tag key={i}>{i}</Tag>) : '--';
      },
    },
    {
      title: intl.get('Global.group'),
      dataIndex: 'groupName',
      minWidth: 160,
      __fixed: true,
      __selected: true,
      render: (text: any) => text || '--',
    },
    {
      title: intl.get('Global.updateTime'),
      sorter: true,
      minWidth: 180,
      dataIndex: 'updateTime',
      __fixed: true,
      __selected: true,
      render: (text: any): string => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
  ];

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
      disabled: row.builtin,
    }),
  };

  /** 获取列表数据 */
  const getTableData = async ({ pageSize, current, sorter, filters }: any): Promise<void> => {
    setIsLoading(true);
    try {
      const res: any = await api.getCustomDataViewList({
        offset: pageSize * (current - 1),
        limit: pageSize,
        sort: sorter?.field || 'update_time',
        direction: sorter?.order === 'ascend' ? 'asc' : 'desc',
        queryType: filters?.queryType || [],
        namePattern: searchValue,
        tag: selectedTag === 'all' ? '' : selectedTag,
        groupId: currentSelectGroup?.id,
        type: 'custom',
      });

      const { totalCount, entries } = res;
      setTableData(entries);
      setTablePagination({ ...tablePagination, total: totalCount, pageSize, current });
      setTableParams({ sorter, filters });
      setIsLoading(false);
      setSelectedRowKeys([]);
      setSelectedRows([]);
    } catch (error) {
      setIsLoading(false);
    }
  };
  /** 获取列表数据 */
  const getData = async (): Promise<void> => {
    const { pageSize } = tablePagination;
    try {
      return await getTableData({ ...tableParams, pageSize, current: 1 });
    } catch (error) {}
  };

  useEffect(() => {
    getData();
  }, [searchValue, selectedTag, currentSelectGroup]);

  /** table 页面切换 */
  const handleTableChange = async (pagination: any, filters: any, sorter: any): Promise<void> => {
    const { current, pageSize } = pagination;
    setSelectedRowKeys([]);
    setSelectedRows([]);
    await getTableData({ pageSize, filters, current, sorter });
  };

  /** 筛选条件变更 */
  const onChangeTableOperation = (data: any) => {
    const { name, model_tag } = data;
    setSearchValue(name);
    setSelectedTag(encodeURIComponent(model_tag));
  };

  /** 上传逻辑 */
  const changeUpload = async (jsonData: any, fileName: any): Promise<void> => {
    const res = await api.createCustomDataView(jsonData, 'normal');
    const confirm = async (val: any, modalContext: any): Promise<void> => {
      const resConfirm = await api.createCustomDataView(jsonData, val);
      modalContext.destroy();
      if (!resConfirm?.error_code) {
        arNotification.success(intl.get('Global.importSuccess'));
        await getData();
        setReloadGroup(!reloadGroup);
      }
    };

    if (res?.error_code && (res?.error_code === 'DataModel.DataView.Existed.ViewID' || res?.error_code === 'DataModel.DataView.Existed.ViewName')) {
      const modalContext = modal.warning({
        title: <Text>{intl.get('CustomDataView.overwriteTip')}</Text>,
        footer: (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button className="g-mr-2" onClick={() => modalContext.destroy()}>
              {intl.get('Global.cancel')}
            </Button>
            <Button className="g-mr-2" onClick={() => confirm('ignore', modalContext)}>
              {intl.get('Global.ignore')}
            </Button>
            <Button type="primary" onClick={() => confirm('overwrite', modalContext)}>
              {intl.get('Global.overwrite')}
            </Button>
          </div>
        ),
      });
    } else if (res?.error_code) {
      arNotification.error(res.description);
    } else {
      arNotification.success(intl.get('Global.importSuccess'));
      await getData();
      setReloadGroup(!reloadGroup);
    }
  };

  const uploadProps = {
    name: 'items_file',
    action: '',
    accept: '.json',
    showUploadList: false,
    headers: { 'Accept-Language': Cookie.get('language') || 'zh-cn', 'X-Language': Cookie.get('language') || 'zh-cn' },
    beforeUpload: (file: any): boolean => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          changeUpload(jsonData, file.name);
        } catch (error) {}
      };
      return false;
    },
  };

  /** 导出逻辑 */
  const exportData = async (): Promise<any[]> => {
    const curRows = await api.getCustomDataViewDetails(selectedRowKeys);
    return Promise.resolve(curRows);
  };

  /** 移动分组 */
  const handleMoveToGroupSubmit = async (values: { moveToGroupName: string }): Promise<void> => {
    const { moveToGroupName } = values;
    await api.changeCustomDataViewGroup(selectedRowKeys, moveToGroupName);
    setReloadGroup(!reloadGroup);
    setIsMoveToGroupModalShow(false);
    getData();
  };

  return (
    <div style={{ height: '100%', padding: '16px' }}>
      <div id="data-view-model-container"></div>
      <Table.PageTable
        name="custom-data-view"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={tableData}
        rowSelection={rowSelection}
        pagination={tablePagination}
        onChange={handleTableChange}
      >
        <Table.Operation
          nameConfig={{ key: 'name', placeholder: intl.get('Global.search') }}
          initialFilter={{ name: searchValue }}
          onChange={onChangeTableOperation}
          onRefresh={getData}
          isControlFilter
        >
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('data_view'))}>
            <Button.Create onClick={() => history.push('/custom-data-view/detail/')} />
          </ContainerIsVisible>
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.DELETE, getTypePermissionOperation('data_view'))}>
            <Button.Delete disabled={!selectedRows?.length} onClick={() => deleteConfirm('')} />
          </ContainerIsVisible>
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.IMPORT, getTypePermissionOperation('data_view'))}>
            <Upload {...uploadProps}>
              <Button icon={<IconFont type="icon-upload" />}>{intl.get('Global.import')}</Button>
            </Upload>
          </ContainerIsVisible>
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.EXPORT, getTypePermissionOperation('data_view'))}>
            <ExportFile name={'customDataView'} customRequest={exportData}>
              <Button disabled={!selectedRows?.length} icon={<IconFont type="icon-download" />}>
                {intl.get('Global.export')}
              </Button>
            </ExportFile>
          </ContainerIsVisible>
          <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.MODIFY, getTypePermissionOperation('data_view'))}>
            <Button disabled={!selectedRows?.length} icon={<DragOutlined />} onClick={() => setIsMoveToGroupModalShow(true)}>
              {intl.get('Global.move')}
            </Button>
          </ContainerIsVisible>
          <Select.LabelSelect
            key="model_tag"
            label={intl.get('Global.tag')}
            defaultValue="all"
            style={{ width: 190 }}
            options={[{ value: 'all', label: intl.get('Global.all') }, ...tagsData]}
          />
        </Table.Operation>
      </Table.PageTable>

      {/* 移动到分组弹框 */}
      <MoveToGroupModal
        visible={isMoveToGroupModalShow}
        title={intl.get('CustomDataView.moveToGroup')}
        onOk={handleMoveToGroupSubmit}
        onCancel={() => setIsMoveToGroupModalShow(false)}
      />

      {/* 预览 */}
      <PreviewData open={isPreviewDataModalShow} id={currentId} name={currentName} onClose={() => setIsPreviewDataModalShow(false)} />

      <DataViewDetail open={isDataViewDetailModalShow} id={currentId} onClose={() => setIsDataViewDetailModalShow(false)} />
    </div>
  );
};
