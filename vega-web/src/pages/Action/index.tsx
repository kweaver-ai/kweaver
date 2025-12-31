/**
 * 行动类-数据列表
 */
import { memo, FC, useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { EllipsisOutlined } from '@ant-design/icons';
import { Dropdown, Tag, Popover, Empty } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { renderObjectTypeLabel } from '@/components/ObjectSelector';
import api from '@/services/action';
import ActionType from '@/services/action/type';
import createImage from '@/assets/images/common/create.svg';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import HOOKS from '@/hooks';
import SERVICE, { KnowledgeNetworkType } from '@/services';
import { Table, Button, Select, Title, IconFont } from '@/web-library/common';
import DetailView from './DetailView';
import styles from './index.module.less';

enum OperationEnum {
  View = 'view',
  Edit = 'edit',
  Delete = 'delete',
}

interface TProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission: boolean;
}

const Action: FC<TProps> = ({ detail, isPermission }) => {
  const knId = detail?.id || localStorage.getItem('KnowledgeNetwork.id')!;
  // const hasModifyPerm = useMemo(() => detail?.operations?.includes(PERMISSION_CODES.MODIFY), [detail]); // 是否具有修改权限，影响新建/修改/删除
  const hasModifyPerm = isPermission; // 暂时

  const { modal, message } = HOOKS.useGlobalContext();
  const { ACTION_MENU_SORT_ITEMS, ACTION_TYPE_LABELS } = HOOKS.useConstants();
  const history = useHistory();

  const actionTypeDataToView = useRef<any>(null);

  const [objectOptions, setObjectOptions] = useState<any[]>([]); // 对象类的选择列表
  const [isLoading, setIsLoading] = useState(true);
  const [tableFilterParams, setTableFilterParams] = useState<{
    name_pattern?: string;
    tag?: string;
    group_id?: string;
    action_type?: ActionType.ActionTypeEnum;
    object_type_id?: string;
  }>({});
  const [tableData, setTableData] = useState<ActionType.ActionType[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [tablePagination, setTablePagination] = useState<{
    current: number;
    pageSize: number;
    total: number;
    pageSizeOptions: string[];
    showSizeChanger: boolean;
    showQuickJumper: boolean;
  }>({
    current: 1,
    pageSize: 50,
    total: 0,
    pageSizeOptions: ['10'],
    showSizeChanger: false,
    showQuickJumper: true,
  });
  const [sortRule, setSortRule] = useState<ActionType.SortEnum>(ActionType.SortEnum.UpdateTime); // 排序类型，默认按照更新时间
  const [sortOrder, setSortOrder] = useState<ActionType.DirectionEnum>(ActionType.DirectionEnum.DESC); // 排序方向，默认降序

  const dropdownMenu: any = [
    { key: OperationEnum.View, label: intl.get('Global.view') },
    { key: OperationEnum.Edit, label: intl.get('Global.edit'), hidden: !hasModifyPerm },
    { key: OperationEnum.Delete, label: intl.get('Global.delete'), hidden: !hasModifyPerm },
  ];

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      sorter: true,
      width: 350,
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => (
        <div className="g-flex-align-center">
          <IconFont type="icon-dip-hangdonglei" />
          <div className="g-ellipsis-1 g-ml-2" title={_value}>
            {_value}
          </div>
        </div>
      ),
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      width: 80,
      __selected: true,
      render: (_value: any, record: any) => {
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu,
              onClick: (event: any) => {
                event.domEvent.stopPropagation();
                handleOperationEvent(event.key, record);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('Action.actionType'),
      dataIndex: 'action_type',
      width: 80,
      __selected: true,
      render: (_value: ActionType.ActionTypeEnum) => ACTION_TYPE_LABELS[_value] || '--',
    },
    {
      title: intl.get('Action.boundObjectType'),
      dataIndex: 'object_type',
      width: 200,
      __selected: true,
      render: (_value: { icon: string; name: string; id: string; color: string }) => renderObjectTypeLabel(_value),
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      width: 280,
      __selected: true,
      render: (_value: string[]) => (
        <div className="g-flex-align-center">
          {_value.length ? (
            <>
              {_value.slice(0, 2).map((tag) => (
                <Tag key={tag} className={styles['tag']} title={tag}>
                  {tag}
                </Tag>
              ))}
              {_value.length > 2 && (
                <Popover
                  arrow={false}
                  content={
                    <div className={styles['popover-tags']}>
                      {_value.slice(2).map((tag) => (
                        <Tag key={tag} className={styles['tag']} title={tag}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  }
                >
                  <Button type="text" className={styles['tag-more-btn-col']}>
                    +{_value.length - 2}
                  </Button>
                </Popover>
              )}
            </>
          ) : (
            '--'
          )}
        </div>
      ),
    },
    {
      title: intl.get('Global.modifier'),
      dataIndex: 'updater',
      width: 200,
      __selected: true,
      render: (value: any, record: any) => <div className="g-ellipsis-1">{record?.updater?.name || '--'}</div>,
    },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      width: 150,
      sorter: true,
      __selected: true,
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--'),
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

  /** 获取列表数据 */
  const fetchTableData = async (): Promise<void> => {
    const { pageSize, current } = tablePagination;
    try {
      const { entries, total_count } = await api.getActionTypes(knId, {
        sort: sortRule,
        direction: sortOrder,
        offset: (current - 1) * pageSize,
        limit: pageSize,
        ...tableFilterParams,
      });
      setTableData(entries);
      setTablePagination((prev) => ({ ...prev, total: total_count }));
    } catch (error: any) {
      if (error?.description) message.error(error.description);
    } finally {
      setIsLoading(false);
    }
  };

  /** 获取对象列表 */
  const getObjectList = async () => {
    try {
      const result = await SERVICE.object.objectGet(knId, { offset: 0, limit: -1 });
      const objectOptions = _.map(result?.entries, (item) => {
        const { id, name, icon, data_properties, color } = item;
        return {
          value: id,
          name,
          data_properties,
          label: renderObjectTypeLabel({ icon, name, color }),
        };
      });
      setObjectOptions(objectOptions);
    } catch (error) {
      console.log('getObjectList error: ', error);
    }
  };

  /** 删除行动类 */
  const deleteActionType = (record?: ActionType.ActionType) => {
    const itemsToDelete = record ? [record] : selectedRows;
    const isSingleDelete = itemsToDelete.length === 1;

    modal.confirm({
      title: intl.get('Action.deleteActionClass'),
      centered: true,
      content: isSingleDelete
        ? intl.get('Global.deleteConfirm', { name: itemsToDelete[0].name })
        : intl.get('Global.deleteConfirmMultiple', { count: itemsToDelete.length }),
      okText: intl.get('Global.delete'),
      footer: (__: any, { OkBtn, CancelBtn }: any) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      async onOk() {
        try {
          await api.deleteActionType(
            knId,
            itemsToDelete.map(({ id }) => id)
          );

          if (isSingleDelete) {
            // 单个删除，需去除被删掉的选中项
            const targetItem = itemsToDelete[0];
            setSelectedRowKeys((prev) => prev.filter((key) => key !== targetItem.id));
            setSelectedRows((prev) => prev.filter((row) => row.id !== targetItem.id));
          } else {
            // 多选删除后，需清空选中项
            setSelectedRowKeys([]);
            setSelectedRows([]);
          }

          // 处理分页逻辑：如果当前页数据将被全部删除且不在首页，则跳至上一页
          const shouldGoToTablePreviousPage = tableData.length === itemsToDelete.length && tablePagination.current > 1;
          if (shouldGoToTablePreviousPage) {
            setTablePagination((prev) => ({ ...prev, current: prev.current - 1 }));
          } else {
            fetchTableData();
          }

          setDetailVisible(false);
        } catch (error: any) {
          if (error?.description) {
            message.error(error.description);
          }
        }
      },
    });
  };

  /** 跳转创建和编辑弹窗 */
  const goToCreateAndEditPage = (type: 'create' | 'edit', id?: string) => {
    if (type === 'edit') {
      history.push(`/action/${type}/${id}`);
    } else {
      history.push(`/action/${type}`);
    }
  };

  /** 点击查看 */
  const clickView = (record: any) => {
    actionTypeDataToView.current = record;
    setDetailVisible(true);
  };

  /** 操作事件 */
  const handleOperationEvent = (operationKey: OperationEnum, record: ActionType.ActionType) => {
    switch (operationKey) {
      case OperationEnum.Delete:
        deleteActionType(record);
        break;

      case OperationEnum.View:
        clickView(record);
        break;

      case OperationEnum.Edit:
        goToCreateAndEditPage('edit', record.id);
        break;
    }
  };

  /** table 页面切换 */
  const handleTableChange = async (pagination: any, filters: any, sorter: any): Promise<void> => {
    const { current } = pagination;

    setSelectedRowKeys([]);
    setSelectedRows([]);

    if (current !== tablePagination.current) {
      // 手动切换页码
      setTablePagination((prev) => ({ ...prev, current }));
    } else {
      // 改变排序规则，需要跳转到第一页
      setTablePagination((prev) => ({ ...prev, current: 1 }));

      if (sorter.field) {
        setSortOrder(sorter.order === 'ascend' ? ActionType.DirectionEnum.ASC : ActionType.DirectionEnum.DESC);
        setSortRule(sorter.field === 'name' ? ActionType.SortEnum.Name : ActionType.SortEnum.UpdateTime);
      } else {
        // 设置为默认排序规则
        setSortOrder(ActionType.DirectionEnum.DESC);
        setSortRule(ActionType.SortEnum.UpdateTime);
      }
    }
  };

  /** 筛选条件变更 */
  const onChangeTableOperation = ({ name, ...otherParams }: any) => {
    // 跳转到第一页
    setTablePagination((prev) => ({ ...prev, current: 1 }));
    setTableFilterParams({
      name_pattern: name,
      ...otherParams,
    });
  };

  const handleSortChange = ({ key }: { key: ActionType.SortEnum }) => {
    // 跳转到第一页
    setTablePagination((prev) => ({ ...prev, current: 1 }));

    if (key === sortRule) {
      // rule不变，仅改变order：升序/降序
      setSortOrder(sortOrder === ActionType.DirectionEnum.ASC ? ActionType.DirectionEnum.DESC : ActionType.DirectionEnum.ASC);
    } else {
      // 改变rule，order不变
      setSortRule(key);
    }
  };

  // 当排序规则、筛选项、页码发生变化时，触发表格数据的获取
  useEffect(() => {
    fetchTableData();
  }, [sortOrder, sortRule, tableFilterParams, tablePagination.current]);

  // 获取对象类列表
  useEffect(() => {
    if (!knId) return;

    getObjectList();
  }, [knId]);

  return (
    <div className={styles['action-root']}>
      <Title>{intl.get('Global.actionClass')}</Title>
      <Table.PageTable
        name="action-class"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={tableData}
        rowSelection={rowSelection}
        pagination={tablePagination}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => clickView(record),
        })}
        locale={{
          emptyText:
            tableFilterParams.name_pattern ||
            tableFilterParams.action_type ||
            tableFilterParams.group_id ||
            tableFilterParams.object_type_id ||
            tableFilterParams.tag ? (
              <Empty image={noSearchResultImage} description={intl.get('Global.noResult')} />
            ) : hasModifyPerm ? (
              <Empty
                image={createImage}
                description={
                  <span>
                    {intl.get('Action.emptyCreate')}
                    <Button type="link" style={{ padding: 0 }} onClick={() => goToCreateAndEditPage('create')}>
                      {intl.get('Global.createActionType')}
                    </Button>
                    {intl.get('Action.emptyCreateTip')}
                  </span>
                }
              />
            ) : (
              <Empty image={emptyImage} description={intl.get('Global.noData')} />
            ),
        }}
      >
        <Table.Operation
          nameConfig={{ key: 'name', placeholder: intl.get('Global.searchName') }}
          sortConfig={{
            items: ACTION_MENU_SORT_ITEMS,
            rule: sortRule,
            order: sortOrder === ActionType.DirectionEnum.ASC ? ActionType.DirectionEnum.ASC : '',
            onChange: handleSortChange,
          }}
          initialFilter={{ name: tableFilterParams.name_pattern || '' }}
          onChange={onChangeTableOperation}
          onRefresh={fetchTableData}
        >
          {hasModifyPerm && <Button.Create onClick={() => goToCreateAndEditPage('create')} />}

          {hasModifyPerm && <Button.Delete onClick={() => deleteActionType()} disabled={!selectedRows?.length} />}

          <Select.LabelSelect
            key="action_type"
            label={intl.get('Action.actionType')}
            defaultValue=""
            style={{ width: 190 }}
            options={[
              { value: '', label: intl.get('Global.all') },
              ...[ActionType.ActionTypeEnum.Add, ActionType.ActionTypeEnum.Modify, ActionType.ActionTypeEnum.Delete].map((value) => ({
                value,
                label: ACTION_TYPE_LABELS[value],
              })),
            ]}
          />
          <Select.LabelSelect
            key="object_type_id"
            label={intl.get('Action.boundObjectType')}
            defaultValue="all"
            style={{ width: 190 }}
            options={[{ value: '', label: intl.get('Global.all') }, ...objectOptions]}
          />
          {/* <Select.LabelSelect key="tag" label={'标签'} defaultValue="" style={{ width: 190 }} options={[{ value: '', label: intl.get('Global.all') }]} /> */}
        </Table.Operation>
      </Table.PageTable>

      {detailVisible && (
        <DetailView
          knId={knId}
          atId={actionTypeDataToView.current.id}
          hasModifyPerm={hasModifyPerm}
          onClose={() => setDetailVisible(false)}
          onEdit={(data) => goToCreateAndEditPage('edit', data.id)}
          onDelete={(data) => {
            deleteActionType(data);
          }}
        />
      )}
    </div>
  );
};

export default memo(Action);
