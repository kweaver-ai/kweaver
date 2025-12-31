import { useState, useMemo } from 'react';
import intl from 'react-intl-universal';
import { Divider, Table, Tabs, Input, Empty, message, Dropdown, Tag } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';
import _ from 'lodash';
import ObjectIcon from '@/components/ObjectIcon';
import { renderObjectTypeLabel } from '@/components/ObjectSelector';
import ActionType from '@/services/action/type';
import api from '@/services/concept-group';
import ConceptGroupType from '@/services/concept-group/type';
import { ObjectType } from '@/services';
import { Text, Title, Button, IconFont, Drawer } from '@/web-library/common';
import styles from './index.module.less';
import AddObjectTypesModal from '../AddObjectTypesModal';

const { TabPane } = Tabs;

interface TConceptGroupItem {
  value: string;
  color?: string;
}

const ConceptGroupItem = (props: TConceptGroupItem) => {
  const { value, color } = props;
  return (
    <div className="g-flex-align-center" title={value}>
      <div className={styles['name-icon']} style={{ background: color }}>
        <IconFont type="icon-dip-fenzu" style={{ color: '#fff', fontSize: 20 }} />
      </div>
      <div>
        <Text className="g-ellipsis-1">{value}</Text>
      </div>
    </div>
  );
};

interface TDetailProps {
  open: boolean;
  sourceData: ConceptGroupType.Detail;
  onClose: () => void;
  onEdit: (id: string) => void;
  knId?: string;
  exportData: (id: string) => void;
  onRefresh: (id: string) => void;
  isPermission?: boolean;
}

const Detail = (props: TDetailProps) => {
  const { open, sourceData: source, onClose, onEdit, knId = localStorage.getItem('KnowledgeNetwork.id') || '', onRefresh, exportData, isPermission } = props;
  const { id, tags, comment, name, color } = source;

  const [activeTab, setActiveTab] = useState('object');
  // 独立的搜索状态
  const [searchStates, setSearchStates] = useState({
    object: { searchText: '' },
    relation: { searchText: '' },
    action: { searchText: '' },
  });
  // 选中的对象类ID
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // 添加对象类模态框的可见状态
  const [addModalVisible, setAddModalVisible] = useState(false);

  // 基础信息
  const baseInfo = [
    { label: 'ID', value: id || 'aishu0001_hrbp' },
    { label: intl.get('Global.tag'), value: Array.isArray(tags) && tags.length ? _.map(tags, (i) => <Tag key={i}>{i}</Tag>) : '--' },
    { label: intl.get('Global.comment'), value: comment || intl.get('Global.noComment') },
  ];

  // 从详情数据中获取各类数据
  const { object_types = [], relation_types = [], action_types = [] } = source;

  // 表格列配置
  const columns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
      render: (value: string, item: ObjectType.Detail) => (
        <div className="g-flex" style={{ lineHeight: '22px', cursor: 'pointer' }}>
          <div className={styles['obj-name-icon']} style={{ background: item.color }}>
            <IconFont type={item.icon} style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span>{item.name}</span>
        </div>
      ),
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => <div>{Array.isArray(tags) && tags.length > 0 ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : '--'}</div>,
    },
  ];

  const relationColumns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: intl.get('ConceptGroup.sourceObjectType'),
      dataIndex: 'source_object_type_id',
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
      title: intl.get('ConceptGroup.targetObjectType'),
      dataIndex: 'target_object_type_id',
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
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => <div>{Array.isArray(tags) && tags.length > 0 ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : '--'}</div>,
    },
  ];

  const actionTypeLabels = {
    [ActionType.ActionTypeEnum.Add]: intl.get('Global.create'),
    [ActionType.ActionTypeEnum.Modify]: intl.get('Global.edit'),
    [ActionType.ActionTypeEnum.Delete]: intl.get('Global.delete'),
  };

  const activeColumns: any = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      sorter: true,
      width: 240,
      render: (_value: string, record: any) => (
        <div className="g-flex-align-center">
          <IconFont type="icon-dip-hangdonglei" />
          <div className="g-ellipsis-1 g-ml-2" title={_value}>
            {_value}
          </div>
        </div>
      ),
    },
    {
      title: intl.get('Global.type'),
      dataIndex: 'action_type',
      width: 80,
      __selected: true,
      render: (_value: ActionType.ActionTypeEnum) => actionTypeLabels[_value] || '--',
    },
    {
      title: intl.get('ConceptGroup.bindObjectType'),
      dataIndex: 'object_type',
      width: 240,
      __selected: true,
      render: (_value: { icon: string; name: string; id: string; color: string }) => _value && renderObjectTypeLabel(_value),
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      key: 'tags',
      width: 240,
      render: (tags: string[]) => <div>{Array.isArray(tags) && tags.length > 0 ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : '--'}</div>,
    },
  ];
  // 处理搜索
  const handleSearch = (tabKey: keyof typeof searchStates, e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchStates((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        searchText: e.target.value,
      },
    }));
  };

  // 获取当前标签页的数据
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'object':
        return object_types;
      case 'relation':
        return relation_types;
      case 'action':
        return action_types;
      default:
        return [];
    }
  };

  // 获取当前标签页的搜索状态
  const getCurrentSearchState = () => {
    return searchStates[activeTab as keyof typeof searchStates] || { searchText: '' };
  };

  // 过滤后的数据
  const filteredData = useMemo(() => {
    const data = getCurrentTabData();
    const { searchText } = getCurrentSearchState();
    return data.filter((item) => {
      const matchSearch = item.name.includes(searchText);
      return matchSearch;
    });
  }, [searchStates, activeTab, object_types, relation_types, action_types]);

  // 处理行选择变化
  const handleRowSelectionChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  // 行选择配置
  const rowSelection: TableRowSelection<any> = {
    selectedRowKeys,
    onChange: handleRowSelectionChange,
  };

  // 处理移除对象类
  const handleRemove = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning(intl.get('ConceptGroup.pleaseSelectObjectTypesToRemove'));
      return;
    }

    try {
      await api.removeObjectTypesFromGroup(knId!, id, selectedRowKeys as string[]);
      message.success(intl.get('ConceptGroup.removeSuccess'));
      setSelectedRowKeys([]);
      onRefresh(id);
    } catch (error) {
      console.error('移除对象类失败:', error);
    }
  };

  // 处理打开添加对象类模态框
  const handleOpenAddModal = () => {
    setAddModalVisible(true);
  };

  // 处理关闭添加对象类模态框
  const handleCloseAddModal = () => {
    setAddModalVisible(false);
  };

  // 处理添加对象类成功
  const handleAddSuccess = () => {
    setAddModalVisible(false);
    onRefresh(id);
  };

  return (
    <Drawer
      open={open}
      className={styles['concept-group-detail-drawer']}
      width={1100}
      title={intl.get('ConceptGroup.conceptGroup')}
      onClose={onClose}
      maskClosable={true}
    >
      <div className={styles['concept-group-detail-drawer-content']}>
        {/* 基础信息区域 */}
        <div className="g-flex-space-between">
          <ConceptGroupItem value={name} color={color} />
          <div className="g-flex-align-center">
            {isPermission && (
              <Button className="g-mr-2" icon={<IconFont type="icon-dip-bianji" />} onClick={() => onEdit(source.id)}>
                {intl.get('Global.edit')}
              </Button>
            )}
            <Dropdown
              trigger={['click']}
              menu={{
                items: [{ key: 'export', label: intl.get('Global.export') }],
                onClick: (event: any) => {
                  event.domEvent.stopPropagation();
                  exportData(id);
                },
              }}
            >
              <Button icon={<IconFont type="icon-dip-gengduo" />} />
            </Dropdown>
          </div>
        </div>
        <Divider className="g-mt-4 g-mb-4" />
        <div>
          {_.map(baseInfo, (item) => {
            const { label, value } = item;
            return (
              <div key={label} className={styles['base-info-item']}>
                <div className={styles['base-info-label']}>{label}</div>
                <div className="g-ellipsis-1">{value}</div>
              </div>
            );
          })}
        </div>

        {/* 分组详情区域 */}
        <Divider className="g-mt-4 g-mb-4" />
        <div>
          <Title level={2}>{intl.get('ConceptGroup.groupDetail')}</Title>

          <div className="g-mb-4">
            <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
              <TabPane tab={intl.get('Global.objectClass')} key="object">
                {/* 操作按钮和搜索栏在一行 */}
                <div className="g-flex-space-between g-mb-4">
                  <div className="g-flex-align-center">
                    <Button.Create className="g-mr-2" type="primary" onClick={handleOpenAddModal}>
                      {intl.get('Global.add')}
                    </Button.Create>
                    <Button.Delete onClick={handleRemove}>{intl.get('Global.remove')}</Button.Delete>
                  </div>
                  <div className="g-flex-align-center">
                    <Input.Search
                      placeholder={intl.get('Global.searchName')}
                      size="middle"
                      value={searchStates.object.searchText}
                      style={{ width: 280 }}
                      allowClear
                      onChange={(e) => handleSearch('object', e)}
                    />
                  </div>
                </div>

                {/* 列表内容 */}
                <Table
                  size="small"
                  rowKey="id"
                  columns={columns}
                  scroll={{ y: 400 }}
                  dataSource={filteredData}
                  locale={{ emptyText: <Empty description={intl.get('Global.noData')} /> }}
                  pagination={{
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total) => intl.get('Global.total', { total }),
                  }}
                  rowSelection={rowSelection}
                />
              </TabPane>
              <TabPane tab={intl.get('Global.edgeClass')} key="relation">
                {/* 只有搜索栏，没有操作按钮 */}
                <div className="g-flex-content-right">
                  <Input.Search
                    placeholder={intl.get('Global.searchName')}
                    size="middle"
                    value={searchStates.relation.searchText}
                    style={{ width: 280 }}
                    allowClear
                    onChange={(e) => handleSearch('relation', e)}
                  />
                </div>

                {/* 列表内容 */}
                <Table
                  size="small"
                  rowKey="id"
                  columns={relationColumns}
                  scroll={{ y: 400 }}
                  dataSource={filteredData}
                  locale={{ emptyText: <Empty description={intl.get('Global.noData')} /> }}
                  pagination={{
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total) => intl.get('Global.total', { total }),
                  }}
                />
              </TabPane>
              <TabPane tab={intl.get('Global.actionClass')} key="action">
                {/* 只有搜索栏，没有操作按钮  */}
                <div className="g-flex-content-right">
                  <Input.Search
                    placeholder={intl.get('Global.searchName')}
                    size="middle"
                    value={searchStates.action.searchText}
                    style={{ width: 280 }}
                    allowClear
                    onChange={(e) => handleSearch('action', e)}
                  />
                </div>

                {/* 列表内容 */}
                <Table
                  size="small"
                  rowKey="id"
                  columns={activeColumns}
                  scroll={{ y: 400 }}
                  dataSource={filteredData}
                  locale={{ emptyText: <Empty description={intl.get('Global.noData')} /> }}
                  pagination={{
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    showTotal: (total) => intl.get('Global.total', { total }),
                  }}
                />
              </TabPane>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 添加对象类模态框 */}
      <AddObjectTypesModal open={addModalVisible} onCancel={handleCloseAddModal} onSuccess={handleAddSuccess} knId={knId} groupId={id} groupName={name} />
    </Drawer>
  );
};

const ConceptGroupDetailWrapper = (props: TDetailProps): React.ReactNode => {
  if (!props.open) return null;
  return <Detail {...props} />;
};

export default ConceptGroupDetailWrapper;
