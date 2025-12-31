import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { DragOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Flex, Upload, Splitter, Tag, Dropdown, MenuProps } from 'antd';
import dayjs from 'dayjs';
import Cookie from 'js-cookie';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import ContainerIsVisible, { getTypePermissionOperation, matchPermission, PERMISSION_CODES } from '@/components/ContainerIsVisible';
import { DATE_FORMAT, PAGINATION_DEFAULT } from '@/hooks/useConstants';
import apiService from '@/utils/axios-http';
import api from '@/services/data-analysis/metric-model';
import HOOKS from '@/hooks';
import { Text, Table, Button, Select, IconFont } from '@/web-library/common';
import ExportFile from '@/web-library/components/ExportFile';
import DetailAndPreviewDrawer from './DetailAndPreviewDrawer';
import SideBar from './SideBar';
import { GroupType, MetricModelItem, MetricModelList, queryType as QUERY_TYPE, METRIC_TYPE } from './type';

const METRIC_TYPE_LABEL: any = {
  [METRIC_TYPE.ATOMIC]: intl.get('MetricModel.atomicMetric'),
  [METRIC_TYPE.DERIVED]: intl.get('MetricModel.derivedMetric'),
  [METRIC_TYPE.COMPOSITE]: intl.get('MetricModel.compositeMetric'),
};

const MetricModel = () => {
  const history = useHistory();
  const { modal } = HOOKS.useGlobalContext();
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<MetricModelItem[]>([]);
  const [tableData, setTableData] = useState<MetricModelItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [tablePagination, setTablePagination] = useState<any>(PAGINATION_DEFAULT);
  const [tableParams, setTableParams] = useState<{ sorter: unknown; filters: { [key: string]: any[] } }>({
    sorter: null,
    filters: { queryType: [] },
  });
  const [selectedTag, setSelectedTag] = useState(''); // 选择的标签
  const [currentSelectGroup, setCurrentSelectGroup] = useState<GroupType>({} as GroupType); // 当前选择的分组
  const [isMoveToGroupModalShow, setIsMoveToGroupModalShow] = useState(false);
  const [reloadGroup, setReloadGroup] = useState(false); // 重新加载分组侧边栏
  const [tagsData, setTagsData] = useState<{ value: string; label: string }[]>([]); // 从标签管理服务中get到的tags数据
  const [detailAndPreViewData, setDetailAndPreViewData] = useState({ key: '', previewData: {} });
  const onOpenDrawer = (key: string, data: any) => {
    const previewData = { _previewId: data.id, ...data };
    setDetailAndPreViewData({ key, previewData });
  };
  const onCloseDrawer = () => setDetailAndPreViewData({ key: '', previewData: {} });

  useEffect(() => {
    // 从标签管理服务中get当前模块已经使用过的tag
    const getMetricModelTags = async (): Promise<void> => {
      const tagURL = 'api/mdl-data-model/v1/object-tags/';
      const params = { sort: 'tag', direction: 'asc', limit: -1, module: 'metric-model' };
      const res = await apiService.axiosGet(tagURL, { params });
      setTagsData(_.map(res.entries, (item) => ({ value: item.tag, label: item.tag })));
    };

    getMetricModelTags();
  }, []);

  /** 获取列表数据 */
  const getTableData = async ({ pageSize, current, sorter, filters }: any): Promise<void> => {
    setIsLoading(true);
    // 根据指标模型名称排序，向后端传参为 model_name
    if (sorter?.field === 'name') sorter.field = 'model_name';
    try {
      const res: MetricModelList = await api.getMetricModelList({
        offset: pageSize * (current - 1),
        limit: pageSize,
        sort: sorter?.field || 'update_time',
        direction: sorter?.order === 'ascend' ? 'asc' : 'desc',
        queryType: filters?.queryType || [],
        metricType: filters?.metricType || '',
        namePattern: searchValue,
        tag: selectedTag === 'all' ? '' : selectedTag,
        groupId: currentSelectGroup.id,
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

  /** 导出逻辑 */
  const exportData = async (): Promise<MetricModelItem[]> => {
    const curRows = await api.getMetricModelByIds(selectedRowKeys);
    return Promise.resolve(curRows);
  };

  /** 上传逻辑 */
  const changeUpload = async (jsonData: any): Promise<void> => {
    const res = await api.batchCreateMetricModel(jsonData, 'normal');
    const confirm = async (val: any, modalContext: any): Promise<void> => {
      const resConfirm = await api.batchCreateMetricModel(jsonData, val);
      modalContext.destroy();
      if (!resConfirm?.error_code) {
        arNotification.success(intl.get('Global.importSuccess'));
        await getData();
        setReloadGroup(!reloadGroup);
      } else {
        // 此处因为没使用 axios-http，所以如果请求失败得手动添加 error 提示
        arNotification.error(resConfirm.description);
      }
    };

    if (
      res?.error_code &&
      (res?.error_code === 'DataModel.MetricModel.IDExisted' ||
        res?.error_code === 'DataModel.MetricModel.ModelNameExisted' ||
        res?.error_code === 'DataModel.MetricModel.Duplicated.MeasureName')
    ) {
      const modalContext = modal.warning({
        title: <Text>{intl.get('MetricModel.overwriteTip')}</Text>,
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
      // 此处因为没使用 axios-http，所以如果请求失败得手动添加 error 提示
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
    headers: {
      'Accept-Language': Cookie.get('language') || 'zh-cn',
      'X-Language': Cookie.get('language') || 'zh-cn',
    },
    beforeUpload: (file: any): boolean => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          changeUpload(jsonData);
        } catch (error) {}
      };
      return false;
    },
  };

  /** 删除弹窗 */
  const deleteConfirm = (record?: any): void => {
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
        const res = await api.deleteMetricModel(record?.id || selectedRowKeys?.join(','));

        if (!res?.code) arNotification.success(intl.get('Global.deleteSuccess'));
        await getData();

        setReloadGroup(!reloadGroup);
      },
    });
  };

  /** 筛选条件变更 */
  const onChangeTableOperation = (data: any) => {
    const { name, model_tag } = data;
    setSearchValue(name);
    setSelectedTag(encodeURIComponent(model_tag));
  };

  /** table 页面切换 */
  const handleTableChange = async (pagination: any, filters: any, sorter: any): Promise<void> => {
    const { current, pageSize } = pagination;

    setSelectedRowKeys([]);
    setSelectedRows([]);

    await getTableData({ pageSize, filters, current, sorter });
  };

  const onOperate = (key: string, record: any): void => {
    if (key === 'view') {
      onOpenDrawer('detail', record);
    } else if (key === 'preview') {
      onOpenDrawer('preview', record);
    } else if (key === 'edit') {
      history.push(`/metric-model/edit/${record?.id}`);
    } else if (key === 'delete') {
      deleteConfirm(record);
    }
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      minWidth: 200,
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
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event: any) => event.stopPropagation()} />
          </Dropdown>
        );
      },
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
      title: intl.get('MetricModel.metricType'),
      dataIndex: 'metricType',
      minWidth: 80,
      filters: [
        { text: intl.get('MetricModel.atomicMetric'), value: METRIC_TYPE.ATOMIC },
        { text: intl.get('MetricModel.derivedMetric'), value: METRIC_TYPE.DERIVED },
        { text: intl.get('MetricModel.compositeMetric'), value: METRIC_TYPE.COMPOSITE },
      ],
      __fixed: true,
      __selected: true,
      render: (text: any) => METRIC_TYPE_LABEL[text] || '--',
    },
    {
      title: intl.get('MetricModel.queryType'),
      dataIndex: 'queryType',
      minWidth: 80,
      filters: [
        { text: 'PromQL', value: QUERY_TYPE.Promql },
        { text: 'DSL', value: QUERY_TYPE.Dsl },
        { text: 'SQL', value: QUERY_TYPE.Sql },
      ],
      __fixed: true,
      __selected: true,
      render: (text: any): string => text || '--',
    },
    {
      title: intl.get('Global.updateTime'),
      sorter: true,
      minWidth: 180,
      dataIndex: 'updateTime',
      __fixed: true,
      __selected: true,
      render: (text: any): string => (text ? dayjs(text).format(DATE_FORMAT.DATE_TIME) : '--'),
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

  // 禁用内置分组按钮
  const disabledBuilt = currentSelectGroup?.builtin === true;
  const items: MenuProps['items'] = [
    { key: METRIC_TYPE.ATOMIC, label: intl.get('MetricModel.atomicMetric') },
    { key: METRIC_TYPE.DERIVED, label: intl.get('MetricModel.derivedMetric') },
    { key: METRIC_TYPE.COMPOSITE, label: intl.get('MetricModel.compositeMetric') },
  ];

  return (
    <div className="g-h-100">
      <Splitter style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
        <Splitter.Panel defaultSize={230} min={0} max={400} collapsible>
          <Flex justify="center" align="center" style={{ height: '100%' }}>
            <SideBar
              selectedRowKeys={selectedRowKeys}
              getMetricModelData={getData}
              currentSelectGroup={currentSelectGroup}
              setCurrentSelectGroup={setCurrentSelectGroup}
              isMoveToGroupModalShow={isMoveToGroupModalShow}
              setIsMoveToGroupModalShow={setIsMoveToGroupModalShow}
              reloadGroup={reloadGroup}
            />
          </Flex>
        </Splitter.Panel>
        <Splitter.Panel>
          <Flex justify="center" align="center" style={{ height: '100%', padding: 16 }}>
            <Table.PageTable
              name={'metric-model'}
              rowKey="id"
              columns={columns}
              loading={isLoading}
              dataSource={tableData}
              rowSelection={rowSelection}
              pagination={tablePagination}
              onChange={handleTableChange}
            >
              <Table.Operation
                nameConfig={{ key: 'name', placeholder: intl.get('Global.filter') }}
                initialFilter={{ name: searchValue }}
                onChange={onChangeTableOperation}
                onRefresh={getData}
                isControlFilter
              >
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.CREATE, getTypePermissionOperation('metric_model'))}>
                  <Dropdown trigger={['click']} menu={{ items, onClick: (data) => history.push(`/metric-model/create/${data?.key}`) }}>
                    <Button.Create disabled={disabledBuilt} title={disabledBuilt ? intl.get('MetricModel.disabledBuiltNewTip') : undefined} />
                  </Dropdown>
                </ContainerIsVisible>
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.DELETE, getTypePermissionOperation('metric_model'))}>
                  <Button.Delete
                    disabled={!selectedRows?.length || disabledBuilt}
                    title={disabledBuilt ? intl.get('MetricModel.disabledBuiltDeleteTip') : undefined}
                    onClick={() => deleteConfirm()}
                  />
                </ContainerIsVisible>
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.IMPORT, getTypePermissionOperation('metric_model'))}>
                  <Upload {...uploadProps} disabled={disabledBuilt}>
                    <Button
                      disabled={disabledBuilt}
                      icon={<IconFont type="icon-upload" />}
                      title={disabledBuilt ? intl.get('MetricModel.disabledBuiltImportTip') : undefined}
                    >
                      {intl.get('Global.import')}
                    </Button>
                  </Upload>
                </ContainerIsVisible>
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.EXPORT, getTypePermissionOperation('metric_model'))}>
                  <ExportFile name={'metricModels'} customRequest={exportData}>
                    <Button
                      disabled={!selectedRows?.length || disabledBuilt}
                      icon={<IconFont type="icon-download" />}
                      title={disabledBuilt ? intl.get('MetricModel.disabledBuiltExportTip') : undefined}
                    >
                      {intl.get('Global.export')}
                    </Button>
                  </ExportFile>
                </ContainerIsVisible>
                <ContainerIsVisible visible={matchPermission(PERMISSION_CODES.MODIFY, getTypePermissionOperation('metric_model'))}>
                  <Button
                    disabled={!selectedRows?.length || disabledBuilt}
                    icon={<DragOutlined />}
                    title={disabledBuilt ? intl.get('MetricModel.disabledBuiltMoveTip') : undefined}
                    onClick={() => setIsMoveToGroupModalShow(true)}
                  >
                    {intl.get('Global.move')}
                  </Button>
                </ContainerIsVisible>
                <Select.LabelSelect
                  key="model_tag"
                  label={intl.get('Global.tag')}
                  defaultValue={'all'}
                  style={{ width: 190 }}
                  options={[{ value: 'all', label: intl.get('Global.all') }, ...tagsData]}
                />
              </Table.Operation>
            </Table.PageTable>
          </Flex>
        </Splitter.Panel>
      </Splitter>

      {detailAndPreViewData?.key && (
        <DetailAndPreviewDrawer previewData={detailAndPreViewData.previewData} initTabActiveKey={detailAndPreViewData?.key} onClose={onCloseDrawer} />
      )}
    </div>
  );
};

export default MetricModel;
