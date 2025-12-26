import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import dayjs from 'dayjs';
import intl from 'react-intl-universal';
import { Dropdown } from 'antd';
import { EllipsisOutlined, ExportOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Button, ContainerIsVisible, Table, Select } from '@/common';

import GuideDrawer from './GuideDrawer';
import MonitorDrawer from './MonitorDrawer';
import StatisticDrawer from './StatisticDrawer';
import { MENU_SORT_ITEMS, MODEL_TYPE_OPTIONS } from './enums';
import CreateAndEditModal from './CreateAndEditModal';

const MODEL_ICON_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');
const MODEL_TAGS_KV = _.keyBy(MODEL_TYPE_OPTIONS, 'value');

const onSplitUp = (value: any) => value?.toString().replace(/\B(?=(\d{3})+\b)/g, ',');

type CAETypeType = 'create' | 'edit' | 'view';
type CAEType = { open: boolean; type: CAETypeType; sourceData: any };
const LargeModel: React.FC = () => {
  const { modal, message, baseProps } = HOOKS.useGlobalContext();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageState(); // 分页信息
  const [filterValues, setFilterValues] = useState<any>({ name: '', model_type: 'all' }); // 筛选条件
  const isAdmin = baseProps?.username === 'admin';

  // const [rolePermission, setRolePermission] = useState([]); // 角色权限
  const [dataSource, setDataSource] = useState<any[]>([]); // 列表数据
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]); // 选中行
  const [CAEModalData, setCAEModalData] = useState<CAEType>({ open: false, type: 'create', sourceData: null }); // 创建和编辑弹窗数据
  const [apiGuideData, setApiGuideData] = useState<any>(null); // API使用指南侧边栏
  const [monitorData, setMonitorData] = useState<any>(null); // 监控信息侧边栏
  const [statisticData, setStatisticData] = useState<any>(null); // 统计信息侧边栏

  const { page, size, order, rule } = pageState || {};
  const { name, model_type } = filterValues || {};

  useEffect(() => {
    // getRolePermission();
    getList();
  }, []);

  /** 获取用户权限 */
  // const getRolePermission = async () => {
  //   try {
  //     const result = await SERVICE.authorization.authorizationGetResource([{ id: '*', type: 'llm' }]);
  //     setRolePermission(result?.[0]?.operation || {});
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  /** 获取模型管理列表 */
  const getList = async (data?: any) => {
    try {
      const postData = { page, size, order, rule, name, model_type, ...data };
      if (!postData.model_type || postData.model_type === 'all') delete postData.model_type;

      const result = await SERVICE.llm.llmGetList(postData);
      if (!result) return;
      onUpdateState({ ...postData, count: result.count });
      setDataSource(result.data);
      // getItemsPermission(result.data);
      return result.data;
    } catch (error) {
      console.log(error);
    }
  };

  /** 获取大模型实例权限 */
  // const getItemsPermission = (data: any) => {
  //   const postData = _.map(data, item => ({ id: item.model_id, type: 'llm' }));
  //   SERVICE.authorization.authorizationGetResource(postData).then((result: any) => {
  //     const permissionKV = _.keyBy(result, 'id');
  //     const newDataSource = _.map(data, item => ({ ...item, __operation: permissionKV?.[item.model_id]?.operation || [] }));
  //     setDataSource(newDataSource);
  //   });
  // };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    getList({ page: 1, ...values });
    setFilterValues(values);
  };

  /** 排序 */
  const onSortChange = (data: any) => {
    const state = {
      rule: data.key,
      order: data.key !== rule ? 'desc' : order === 'desc' ? 'asc' : 'desc',
    };
    getList(state);
  };

  /** 表格-分页 */
  const onChange = (pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, size: pageSize, rule: field || 'create_time', order: stateOrder };
    onUpdateState(state);
    getList(state);
  };

  /** 打开创建和编辑弹窗 */
  const onOpenCAEModal = (type: CAETypeType, sourceData = null) => setCAEModalData({ open: true, type, sourceData });
  /** 关闭创建和编辑弹窗 */
  const onCloseCAEModal = () => setCAEModalData({ open: false, type: 'create', sourceData: null });

  /** 打开API使用指南侧边栏 */
  const onOpenApiGuideDrawer = (data: any) => setApiGuideData(data);
  /** 关闭API使用指南侧边栏 */
  const onCloseApiGuideDrawer = () => setApiGuideData(null);

  /** 打开监控数据侧边栏 */
  const onOpenMonitorDrawer = (data: any) => setMonitorData(data);
  /** 关闭监控数据侧边栏 */
  const onCloseMonitorDrawer = () => setMonitorData(null);

  /** 打开统计数据侧边栏 */
  // const onOpenStatisticDrawer = (data: any) => setStatisticData(data);
  /** 关闭统计数据侧边栏 */
  const onCloseStatisticDrawer = () => setStatisticData(null);

  /** 删除 */
  const onDelete = async (items: any, isBatch?: boolean) => {
    try {
      const model_ids = _.map(items, item => item?.model_id);
      const result = await SERVICE.llm.llmDelete({ model_ids });
      if (result.status === 'ok') {
        getList();
        if (isBatch) setSelectedRowKeys([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /** 删除 */
  const onDeleteConfirm = (items: any, isBatch?: boolean) => {
    const names = _.map(items, item => `「${item?.model_name}」`).join('、');
    modal.confirm({
      title: intl.get('global.DeletePrompt'),
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: intl.get('global.areYouSureDelete-placeholder-cannotBeRestored', { names }),
      okText: intl.get('global.Ok'),
      cancelText: intl.get('global.Cancel'),
      onOk: () => onDelete(items, isBatch),
    });
  };

  /** 操作按钮 */
  const onOperate = (key: any, record: any) => {
    if (key === 'view') onOpenCAEModal('view', { ...record, ...record.model_config });
    if (key === 'edit') onOpenCAEModal('edit', { ...record, ...record.model_config });
    if (key === 'delete') onDeleteConfirm([record]);
    if (key === 'test') onTest({ model_id: record?.model_id });
    if (key === 'monitor') onOpenMonitorDrawer(record);
  };

  /** 创建和编辑弹窗-保存 */
  const onOk = async (type: string, values: any) => {
    try {
      values.icon = values.model_series;
      let result = null;
      if (type === 'edit') result = await SERVICE.llm.llmEdit(values);
      else result = await SERVICE.llm.llmAdd(values);
      if (result.status === 'ok') {
        const newList = await getList();
        // 如果有统计侧边栏数据，要更新一下
        if (newList && !!statisticData) {
          const data = _.find(newList, item => item.model_id === statisticData.model_id);
          setStatisticData(data);
        }
        onCloseCAEModal();
      }
    } catch (error) {
      console.log(error);
    }
  };

  /** 创建和编辑弹窗-测试连接 */
  const onTest = async (values: any, notMessage?: boolean) => {
    try {
      values.icon = values.model_series;
      const result = await SERVICE.llm.llmTest(values);
      if (result.status === 'ok' && !notMessage) message.success(intl.get('ModelManagement.testSuccessful'));
      return 'ok';
    } catch (_error) {
      return 'error';
    }

    // return new Promise(resolve => {
    //   values.icon = values.model_series;
    //   SERVICE.llm
    //     .llmTest(values)
    //     .then((result: any) => {
    //       if (result.status === 'ok' && !notMessage) message.success(intl.get('ModelManagement.testSuccessful'));
    //       resolve('ok');
    //     })
    //     .catch((_error: any) => {
    //       resolve('error');
    //     });
    // });
  };

  const columns: any = [
    {
      title: intl.get('ModelManagement.tableColumns.modelName'),
      dataIndex: 'model_name',
      fixed: 'left',
      sorter: true,
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div className='g-flex' title={value}>
          <img src={MODEL_ICON_KV[record?.model_series]?.icon} className='g-mr-2' style={{ width: 24, height: 24 }} />
          <div className=' g-ellipsis-1'>{value}</div>
        </div>
      ),
    },
    {
      title: intl.get('ModelManagement.tableColumns.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      width: 80,
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => {
        const dropdownMenu: any = _.filter(
          [
            { key: 'view', label: intl.get('ModelManagement.tableColumns.menus.view') },
            true && { key: 'edit', label: intl.get('ModelManagement.tableColumns.menus.edit') },
            true && { key: 'delete', label: intl.get('ModelManagement.tableColumns.menus.delete') },
            { key: 'test', label: intl.get('ModelManagement.tableColumns.menus.testConnection') },
            { key: 'monitor', label: intl.get('ModelManagement.tableColumns.menus.modelMonitoring') },
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
    {
      title: intl.get('ModelManagement.tableColumns.modelType'),
      dataIndex: 'model_type',
      __selected: true,
      render: (value: string) => MODEL_TAGS_KV[value]?.label || '--',
    },
    {
      title: intl.get('ModelManagement.tableColumns.baseModel'),
      width: 120,
      dataIndex: 'model_series',
      __selected: true,
    },
    {
      title: intl.get('ModelManagement.tableColumns.document'),
      dataIndex: 'doc',
      __selected: true,
      render: (_value: any, record: any) => {
        return (
          <Button.Link
            icon={<ExportOutlined style={{ fontSize: 12 }} />}
            iconPosition='end'
            onClick={event => {
              event.stopPropagation();
              onOpenApiGuideDrawer(record);
            }}
          >
            {intl.get('ModelManagement.apiGuide.title')}
          </Button.Link>
        );
      },
    },
    {
      title: intl.get('ModelManagement.tableColumns.maximumContext'),
      dataIndex: 'max_model_len',
      width: 100,
      __selected: true,
      render: (value: string) => (value ? `${value} K` : '--'),
    },
    {
      title: intl.get('ModelManagement.tableColumns.parameterQuantity'),
      dataIndex: 'model_parameters',
      width: 100,
      __selected: true,
      render: (value: string) => (value ? `${value} B` : '--'),
    },
    { title: intl.get('ModelManagement.tableColumns.creator'), dataIndex: 'create_by', width: 150, __selected: false },
    {
      title: intl.get('ModelManagement.tableColumns.createdTime'),
      dataIndex: 'create_time',
      sorter: true,
      width: 123.4,
      __selected: false,
      render: (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('ModelManagement.tableColumns.finalOperator'),
      dataIndex: 'update_by',
      width: 150,
      __selected: true,
      render: (value: string) => value || '--',
    },
    ...(isAdmin
      ? []
      : [
          {
            title: intl.get('ModelManagement.tableColumns.tokensCount'),
            dataIndex: 'input_tokens',
            width: 150,
            __selected: true,
            render: (_value: any, record: any) => (
              <React.Fragment>
                {/* 1:单独收费  0：统一计费 */}
                {!record?.quota ? (
                  intl.get('ModelManagement.tableColumns.unlimitedQuota')
                ) : record?.billing_type === 1 ? (
                  <React.Fragment>
                    <div>
                      {intl.get('ModelManagement.tableColumns.in')}：{onSplitUp(`${record?.input_tokens}`)}
                    </div>
                    <div>
                      {intl.get('ModelManagement.tableColumns.out')}：{onSplitUp(`${record?.output_tokens}`)}
                    </div>
                  </React.Fragment>
                ) : (
                  onSplitUp(`${record?.input_tokens}`)
                )}
              </React.Fragment>
            ),
          },
          {
            title: intl.get('ModelManagement.tableColumns.alreadyTokens'),
            dataIndex: 'input_tokens_used',
            width: 150,
            __selected: true,
            render: (text: any, record: any) => {
              return (
                <React.Fragment>
                  {record?.billing_type === 1 ? (
                    <React.Fragment>
                      <div>
                        {intl.get('ModelManagement.tableColumns.in')}：{onSplitUp(`${text}`)}
                      </div>
                      <div>
                        {intl.get('ModelManagement.tableColumns.out')}：{onSplitUp(`${record?.output_tokens_used}`)}
                      </div>
                    </React.Fragment>
                  ) : (
                    onSplitUp(`${text}`)
                  )}
                </React.Fragment>
              );
            },
          },
          {
            title: intl.get('ModelManagement.tableColumns.remainingCounts'),
            dataIndex: 'input_tokens_remain',
            width: 150,
            __selected: true,
            render: (text: any, record: any) => (
              <React.Fragment>
                {!record?.quota ? (
                  intl.get('ModelManagement.tableColumns.unlimitedQuota')
                ) : record?.billing_type === 1 ? (
                  <React.Fragment>
                    <div>
                      {intl.get('ModelManagement.tableColumns.in')}：{onSplitUp(`${text}`)}
                    </div>
                    <div>
                      {intl.get('ModelManagement.tableColumns.out')}：{onSplitUp(`${record?.output_tokens_remain}`)}
                    </div>
                  </React.Fragment>
                ) : (
                  onSplitUp(`${text}`)
                )}
              </React.Fragment>
            ),
          },
        ]),
    {
      title: intl.get('ModelManagement.tableColumns.finalOperatedTime'),
      dataIndex: 'update_time',
      sorter: true,
      width: 123.4,
      __selected: true,
      render: (value: string) => (value ? dayjs(value).format('YYYY/MM/DD HH:mm:ss') : '--'),
    },
  ];

  return (
    <div style={{ height: '100%' }}>
      <Table.PageTable
        name='large-model'
        rowKey='model_id'
        columns={columns}
        dataSource={dataSource}
        rowSelection={{ selectedRowKeys, onChange: (selectedRowKeys: any) => setSelectedRowKeys(selectedRowKeys) }}
        pagination={pagination}
        onChange={onChange}
        // onRow={(record) => ({ onClick: () => onOpenStatisticDrawer(record) })}
      >
        <Table.Operation
          nameConfig={{ key: 'name', placeholder: intl.get('ModelManagement.pleaseEnterTheModelName') }}
          sortConfig={{ items: MENU_SORT_ITEMS, order, rule, onChange: onSortChange }}
          initialFilter={filterValues}
          onChange={onChangeFilter}
          onRefresh={getList}
        >
          <ContainerIsVisible visible={true}>
            <Button.Create onClick={() => onOpenCAEModal('create')} />
          </ContainerIsVisible>
          <Button.Delete
            disabled={selectedRowKeys.length <= 0}
            onClick={() => {
              const items = _.filter(dataSource, item => _.includes(selectedRowKeys, item.model_id));
              onDeleteConfirm(items, true);
            }}
          />
          <Select.LabelSelect
            key='model_type'
            label={intl.get('ModelManagement.modelType')}
            defaultValue='all'
            style={{ width: 190 }}
            options={[{ value: 'all', label: intl.get('global.All') }, ...MODEL_TYPE_OPTIONS]}
          />
        </Table.Operation>
      </Table.PageTable>
      <GuideDrawer open={!!apiGuideData} source={apiGuideData} onCancel={onCloseApiGuideDrawer} />
      <MonitorDrawer open={!!monitorData} source={monitorData} onCancel={onCloseMonitorDrawer} />
      <StatisticDrawer open={!!statisticData} source={statisticData} onOk={onOk} onTest={onTest} onCancel={onCloseStatisticDrawer} />
      <CreateAndEditModal
        open={CAEModalData.open}
        type={CAEModalData.type}
        sourceData={CAEModalData.sourceData}
        onOk={onOk}
        onTest={onTest}
        onCancel={onCloseCAEModal}
      />
    </div>
  );
};

export default LargeModel;
