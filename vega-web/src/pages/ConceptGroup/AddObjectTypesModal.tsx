import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal, Table, Input, Tag, Button, Space, message } from 'antd';
import { TableRowSelection } from 'antd/es/table/interface';
import api from '@/services/concept-group';
import ConceptGroupType from '@/services/concept-group/type';
import objectApi from '@/services/object';
import ObjectType from '@/services/object/type';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

interface AddObjectTypesModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  knId: string;
  groupId: string;
  groupName: string;
}

const AddObjectTypesModal: React.FC<AddObjectTypesModalProps> = ({ open, onCancel, onSuccess, knId, groupId, groupName }) => {
  const [loading, setLoading] = useState(false);
  const [objectTypes, setObjectTypes] = useState<ObjectType.Detail[]>([]);
  const [selectedObjectTypes, setSelectedObjectTypes] = useState<React.Key[]>([]);
  const [selectedObjectTypesObj, setSelectedObjectTypesObj] = useState<ObjectType.Detail[]>([]);
  // 持久化存储所有已选择的对象类型ID
  const [persistentSelectedIds, setPersistentSelectedIds] = useState<Set<string>>(new Set());
  // 持久化存储所有已选择的对象类型详情
  const [persistentSelectedObj, setPersistentSelectedObj] = useState<Map<string, ObjectType.Detail>>(new Map());
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  // 当前分组下已有的对象类ID
  const [existingObjectTypeIds, setExistingObjectTypeIds] = useState<string[]>([]);

  // 获取当前分组下已有的对象类
  const fetchGroupDetail = async () => {
    if (!knId || !groupId) return;
    try {
      const res = await api.detailConceptGroup(knId, groupId);
      const existingObjectTypes = res.object_types || [];
      setExistingObjectTypeIds(existingObjectTypes.map((item) => item.id));
    } catch (error) {
      console.error('Failed to fetch group detail:', error);
    }
  };

  // 获取对象类列表
  const fetchObjectTypes = async () => {
    if (!knId) return;

    setLoading(true);
    try {
      const params = {
        name_pattern: searchText,
        offset: (pagination.current - 1) * pagination.pageSize,
        limit: pagination.pageSize,
      };

      const res = await objectApi.objectGet(knId, params);
      setObjectTypes(res.entries || []);
      setTotal(res.total_count || 0);
    } catch (error) {
      console.error('Failed to fetch object types:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取数据
  useEffect(() => {
    if (open) {
      fetchGroupDetail();
      fetchObjectTypes();
      // 重置选择状态
      setPersistentSelectedIds(new Set());
      setPersistentSelectedObj(new Map());
      setSelectedObjectTypes([]);
      setSelectedObjectTypesObj([]);
    }
  }, [open]);

  // 数据加载完成后，恢复当前页的选择状态
  useEffect(() => {
    if (objectTypes.length > 0) {
      // 从持久化存储中获取当前页已选择的ID
      const currentPageSelectedIds = objectTypes.filter((item) => persistentSelectedIds.has(item.id)).map((item) => item.id);

      // 更新当前页的选择状态
      setSelectedObjectTypes(currentPageSelectedIds);
    }
  }, [objectTypes, persistentSelectedIds]);

  // 分页、搜索、筛选变化时重新获取数据
  useEffect(() => {
    if (open) {
      fetchObjectTypes();
    }
  }, [open, searchText, tagFilter, pagination.current, pagination.pageSize]);

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      current: page,
      pageSize,
    });
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  // 处理标签筛选
  const handleTagChange = (value: string) => {
    setTagFilter(value);
    setPagination({ ...pagination, current: 1 });
  };

  // 处理选择变化
  const handleSelectChange = (selectedRowKeys: React.Key[], selectedRows: ObjectType.Detail[]) => {
    // 更新当前页的选择状态
    setSelectedObjectTypes(selectedRowKeys);

    // 更新持久化存储的选择状态
    const newSelectedIds = new Set(persistentSelectedIds);
    const newSelectedObj = new Map(persistentSelectedObj);

    // 获取当前页的所有对象ID
    const currentPageIds = new Set(objectTypes.map((item) => item.id));

    // 移除当前页中所有之前的选择（避免重复）
    currentPageIds.forEach((id) => {
      newSelectedIds.delete(id);
      newSelectedObj.delete(id);
    });

    // 添加当前页中新的选择
    selectedRows.forEach((item) => {
      newSelectedIds.add(item.id);
      newSelectedObj.set(item.id, item);
    });

    // 更新持久化状态
    setPersistentSelectedIds(newSelectedIds);
    setPersistentSelectedObj(newSelectedObj);

    // 更新已选择对象列表
    setSelectedObjectTypesObj(Array.from(newSelectedObj.values()));
  };

  // 移除已选择的对象类
  const removeSelectedObjectType = (id: string) => {
    // 从当前页选择状态中移除
    setSelectedObjectTypes(selectedObjectTypes.filter((item) => item !== id));

    // 从持久化存储中移除
    const newSelectedIds = new Set(persistentSelectedIds);
    newSelectedIds.delete(id);
    setPersistentSelectedIds(newSelectedIds);

    const newSelectedObj = new Map(persistentSelectedObj);
    newSelectedObj.delete(id);
    setPersistentSelectedObj(newSelectedObj);

    // 更新已选择对象列表
    setSelectedObjectTypesObj(Array.from(newSelectedObj.values()));
  };

  // 确认添加
  const handleConfirm = async () => {
    const selectedIds = Array.from(persistentSelectedIds);
    if (!knId || !groupId || selectedIds.length === 0) return;

    setLoading(true);
    try {
      const data: ConceptGroupType.AddObjectTypesRequest = {
        entries: selectedIds.map((id) => ({ id })),
      };

      await api.addObjectTypesToGroup(knId, groupId, data);
      message.success(intl.get('ConceptGroup.addObjectTypesSuccess'));
      onSuccess();
      onCancel();
    } catch (error) {
      console.error('Failed to add object types:', error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (name: string, record: ObjectType.Detail) => (
        <div className="g-flex" style={{ lineHeight: '22px', cursor: 'pointer' }}>
          <div className={styles['obj-name-icon']} style={{ background: record.color }}>
            <IconFont type={record.icon} style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <span>{record.name}</span>
        </div>
      ),
    },
    {
      title: intl.get('Global.tag'),
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <Space>
          {tags?.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection: TableRowSelection<ObjectType.Detail> = {
    selectedRowKeys: selectedObjectTypes,
    onChange: handleSelectChange,
    getCheckboxProps: (record) => ({
      disabled: existingObjectTypeIds.includes(record.id),
    }),
  };

  return (
    <Modal open={open} onCancel={onCancel} confirmLoading={loading} width={1080} footer={null} className={styles.addObjectTypesModal}>
      <div className={styles.modalContainer}>
        {/* 上部分 - 标题 */}
        <div className={styles.modalHeader}>{intl.get('ConceptGroup.addObjectTypes')}</div>

        {/* 下部分 - 主体内容 */}
        <div className={styles.mainContent}>
          {/* 左侧区域 - 对象类列表 */}
          <div className={styles.leftSection}>
            {/* 搜索筛选区域 */}
            <div className={styles.searchArea}>
              <Input
                placeholder={intl.get('Global.searchName')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ flexBasis: 200 }}
              />
              {/* <Select placeholder={intl.get('global.Tag')} value={tagFilter} onChange={handleTagChange} style={{ width: 150 }}>
                <Select.Option value="all">{intl.get('global.All')}</Select.Option>
              </Select> */}
            </div>

            {/* 对象类表格 */}
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={objectTypes}
              pagination={{
                ...pagination,
                total,
                onChange: handlePaginationChange,
              }}
              loading={loading}
              rowKey="id"
              scroll={{ y: '100%' }}
              size="small"
            />
          </div>

          {/* 右侧区域 - 已选择列表和按钮 */}
          <div className={styles.rightSection}>
            {/* 已选择标题 */}
            <div className={styles.selectedHeader}>{intl.get('ConceptGroup.selected', { count: selectedObjectTypesObj.length })}</div>

            {/* 已选择列表 */}
            <div className={styles.selectedList}>
              {selectedObjectTypesObj.map((item) => (
                <div key={item.id} className={styles.selectedItem}>
                  {/* <div className={styles.itemName}>{item.name}</div> */}
                  <div className="g-flex-center" style={{ lineHeight: '22px', cursor: 'pointer' }}>
                    <div className={styles['obj-name-icon']} style={{ background: item.color }}>
                      <IconFont type={item.icon} style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }} />}
                    onClick={() => removeSelectedObjectType(item.id)}
                    className={styles.deleteButton}
                  />
                </div>
              ))}
            </div>

            {/* 底部按钮区域 */}
            <div className={styles.buttonArea}>
              <Button onClick={onCancel}>{intl.get('Global.cancel')}</Button>
              <Button type="primary" onClick={handleConfirm} loading={loading}>
                {intl.get('Global.ok')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default (props: any) => {
  if (!props.open) return null;
  return <AddObjectTypesModal {...props} />;
};
