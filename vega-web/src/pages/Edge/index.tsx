import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Dropdown, Empty } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import ObjectIcon from '@/components/ObjectIcon';
import Tags from '@/components/Tags';
import createImage from '@/assets/images/common/create.svg';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE, { KnowledgeNetworkType } from '@/services';
import { Text, Title, Table, Select, Button } from '@/web-library/common';
import Detail from './Detail';
import styles from './index.module.less';

type CAETypeType = 'create' | 'edit';

/**
 * ✓ 1、知识网络的id是写死的，需要动态输入
 * ✓ 2、删除接口没有返回，需要在request里统一处理
 */
interface TProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission?: boolean;
}

const Edge = (props: TProps) => {
  const { detail, isPermission } = props;
  const history = useHistory();
  const { modal, message } = HOOKS.useGlobalContext();
  const { EDGE_MENU_SORT_ITEMS } = HOOKS.useConstants();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageStateNew(); // 分页信息

  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>([]); // 表格数据
  const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([]); // 选中行
  const [filterValues, setFilterValues] = useState<any>({ name_pattern: '', source_object_type_id: 'all', target_object_type_id: 'all' }); // 表格的筛选条件
  const [objectOptions, setObjectOptions] = useState<any[]>([]); // 对象类的选择列表
  const [edgeDetail, setEdgeDetail] = useState(null);

  const knId = detail?.id || localStorage.getItem('KnowledgeNetwork.id')!;
  const { sort, direction } = pageState || {};

  useEffect(() => {
    if (!knId) return;
    getList();
    getObjectList();
  }, [knId]);

  /** 获取关系类列表 */
  const getList = async (data?: any) => {
    try {
      setIsLoading(true);
      const _pageState = { ...pageState, ...data };
      const { page, limit, sort, direction } = _pageState;
      const postData: any = { offset: limit * (page - 1), limit, sort, direction };
      if (data) {
        // 排序和筛选条件
        const { sort, direction, name_pattern, source_object_type_id, target_object_type_id, tag, group_id } = data || {};
        if (sort) postData.sort = sort;
        if (direction) postData.direction = direction;
        if (name_pattern) postData.name_pattern = name_pattern;
        if (source_object_type_id !== 'all') postData.source_object_type_id = source_object_type_id;
        if (target_object_type_id !== 'all') postData.target_object_type_id = target_object_type_id;
        if (tag !== 'all') postData.tag = tag;
        if (group_id !== 'all') postData.group_id = group_id;
      }
      const result = await SERVICE.edge.edgeGet(knId, postData);
      const { entries = [], total_count = 0 } = result || {};
      setDataSource(entries);
      onUpdateState({ ...postData, ..._pageState, count: total_count });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  /** 获取对象列表 */
  const getObjectList = async () => {
    try {
      const result = await SERVICE.object.objectGet(knId, { offset: 0, limit: -1 });
      const objectOptions = _.map(result?.entries, (item) => {
        const { id, name, icon, color, data_properties } = item;
        return {
          value: id,
          name,
          data_properties,
          label: (
            <div className="g-flex-align-center" title={name}>
              <ObjectIcon icon={icon} color={color} />
              <div>
                <Text className="g-ellipsis-1">{name}</Text>
              </div>
            </div>
          ),
        };
      });
      setObjectOptions(objectOptions);
    } catch (error) {
      console.log('getObjectList error: ', error);
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    getList({ page: 1, ...values });
    setFilterValues(values);
  };

  /** 排序 */
  const onSortChange = (data: any) => {
    const state = { sort: data.key, direction: data.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc' };
    getList(state);
  };

  /** table的翻页、筛选、排序变更 */
  const onTableChange = (pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, limit: pageSize, sort: field || sort, direction: stateOrder };
    onUpdateState(state);
    getList(state);
  };

  /** 打开关系类详情侧边栏 */
  const onOpenDetail = (sourceData = null) => setEdgeDetail(sourceData);
  /** 打开关系类详情侧边栏  */
  const onCloseDetail = () => setEdgeDetail(null);

  /** 跳转创建和编辑弹窗 */
  const goToCreateAndEditPage = (type: CAETypeType, data?: any) => {
    if (type === 'create') history.push('/ontology/edge/create');
    if (type === 'edit') history.push(`/ontology/edge/edit/${data.id}`);
  };

  /** 删除 */
  const onDelete = async (items: any, isBatch?: boolean) => {
    try {
      const edgesIds = _.map(items, (item) => item?.id);
      await SERVICE.edge.edgeDelete(knId, edgesIds);
      getList();
      message.success(intl.get('Global.deleteSuccess'));
      if (isBatch) setSelectedRowKeys([]);
    } catch (error) {
      console.log(error);
    }
  };

  /** 删除 */
  const onDeleteConfirm = (items: any, isBatch?: boolean, callBack?: () => void) => {
    const name = _.map(items, (item) => `「${item?.name}」`).join('、');
    const length = items.length || 0;
    modal.confirm({
      title: intl.get('Global.deleteConfirmTitle'),
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: length > 1 ? intl.get('Global.deleteConfirmMultiple', { count: length }) : intl.get('Global.deleteConfirm', { name }),
      okText: intl.get('Global.ok'),
      cancelText: intl.get('Global.cancel'),
      onOk: async () => {
        await onDelete(items, isBatch);
        if (callBack) callBack();
      },
    });
  };

  /** 操作按钮 */
  const onOperate = (key: any, record: any) => {
    if (key === 'view') onOpenDetail(record);
    if (key === 'edit') goToCreateAndEditPage('edit', record);
    if (key === 'delete') onDeleteConfirm([record]);
  };

  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      fixed: 'left',
      sorter: true,
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div onClick={() => onOpenDetail(record)} style={{ cursor: 'pointer' }}>
          {value}
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
        const dropdownMenu: any = [
          { key: 'view', label: intl.get('Global.view'), visible: true },
          { key: 'edit', label: intl.get('Global.edit'), visible: isPermission },
          { key: 'delete', label: intl.get('Global.delete'), visible: isPermission },
        ];
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu.filter((item: { visible: boolean }) => item.visible),
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
      title: intl.get('Edge.sourceObjectType'),
      dataIndex: 'source_object_type_id',
      width: 200,
      __selected: true,
      render: (value: string, data: any) => {
        const { icon, color, name, display_name } = data?.source_object_type || {};
        return (
          <div className="g-flex-align-center">
            {icon && <ObjectIcon icon={icon} color={color} />}
            <Text>{display_name || name || value}</Text>
          </div>
        );
      },
    },
    {
      title: intl.get('Edge.targetObjectType'),
      dataIndex: 'target_object_type_id',
      width: 200,
      __selected: true,
      render: (value: string, data: any) => {
        const { icon, color, name, display_name } = data?.target_object_type || {};
        return (
          <div className="g-flex-align-center">
            {icon && <ObjectIcon icon={icon} color={color} />}
            <Text>{display_name || name || value}</Text>
          </div>
        );
      },
    },
    { title: intl.get('Global.tag'), dataIndex: 'tags', width: 200, __selected: true, render: (value: string[]) => <Tags value={value} /> },
    { title: intl.get('Global.group'), dataIndex: 'groups', width: 200, __selected: true, render: (value: string) => value || '--' },
    {
      title: intl.get('Global.modifier'),
      dataIndex: 'updater',
      width: 200,
      __selected: true,
      render: (value: any, record: any) => record?.updater?.name || '--',
    },
    {
      title: intl.get('Global.updateTime'),
      dataIndex: 'update_time',
      width: 200,
      __selected: true,
      render: (text: any): string => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
  ];

  return (
    <div className={styles['edge-root']}>
      <Title>{intl.get('Global.edgeClass')}</Title>
      <Table.PageTable
        name="edge-class"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={dataSource}
        rowSelection={{ selectedRowKeys, onChange: (selectedRowKeys: any) => setSelectedRowKeys(selectedRowKeys) }}
        pagination={pagination}
        onChange={onTableChange}
        locale={{
          emptyText:
            filterValues.name_pattern || filterValues.target_object_type_id !== 'all' || filterValues.source_object_type_id !== 'all' ? (
              <Empty image={noSearchResultImage} description={intl.get('Global.emptyNoSearchResult')} />
            ) : isPermission ? (
              <Empty
                image={createImage}
                description={
                  <span>
                    {intl.get('Edge.emptyCreate')}
                    <Button type="link" style={{ padding: 0 }} onClick={() => goToCreateAndEditPage('create')}>
                      {intl.get('Global.emptyCreateButton')}
                    </Button>
                    {intl.get('Global.emptyCreateTip')}
                  </span>
                }
              />
            ) : (
              <Empty image={emptyImage} description={intl.get('Edge.emptyDescription')} />
            ),
        }}
      >
        <Table.Operation
          nameConfig={{ key: 'name_pattern', placeholder: intl.get('Global.searchName') }}
          sortConfig={{ items: EDGE_MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
          initialFilter={filterValues}
          onChange={onChangeFilter}
          onRefresh={getList}
        >
          {isPermission && <Button.Create onClick={() => goToCreateAndEditPage('create')} />}
          {isPermission && (
            <Button.Delete
              disabled={selectedRowKeys.length <= 0}
              onClick={() => {
                const items = _.filter(dataSource, (item: any) => _.includes(selectedRowKeys, item.id));
                onDeleteConfirm(items, true);
              }}
            />
          )}
          <Select.LabelSelect
            key="source_object_type_id"
            label={intl.get('Edge.sourceObjectType')}
            defaultValue="all"
            style={{ width: 190 }}
            options={[{ value: 'all', label: intl.get('Global.all') }, ...objectOptions]}
          />
          <Select.LabelSelect
            key="target_object_type_id"
            label={intl.get('Edge.targetObjectType')}
            defaultValue="all"
            style={{ width: 190 }}
            options={[{ value: 'all', label: intl.get('Global.all') }, ...objectOptions]}
          />
          {/* <Select.LabelSelect
                        key="tag"
                        label="标签"
                        defaultValue="all"
                        style={{ width: 190 }}
                        options={[{ value: 'all', label: intl.get('Global.all') }]}
                    /> */}
          {/* <Select.LabelSelect
                        key="group_id"
                        label="分组"
                        defaultValue="all"
                        style={{ width: 190 }}
                        options={[{ value: 'all', label: intl.get('Global.all') }]}
                    /> */}
        </Table.Operation>
      </Table.PageTable>
      <Detail
        open={!!edgeDetail}
        knId={knId}
        sourceData={edgeDetail}
        onClose={onCloseDetail}
        onDeleteConfirm={onDeleteConfirm}
        isPermission={isPermission}
        goToCreateAndEditPage={goToCreateAndEditPage}
      />
    </div>
  );
};

export default Edge;
