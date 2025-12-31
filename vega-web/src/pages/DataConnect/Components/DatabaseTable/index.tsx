import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined } from '@ant-design/icons';
import { Table, Input, Pagination } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import api from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import emptyImg from '@/assets/images/customDataView/empty.png';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

interface DatabaseTableProps {
  dataConnectId: string;
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({ dataConnectId }) => {
  // 表列表相关状态
  const [tableList, setTableList] = useState<ScanTaskType.TableInfo[]>([]);
  const [tableTotal, setTableTotal] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [tableSearchValue, setTableSearchValue] = useState('');
  const [tablePagination, setTablePagination] = useState({ pageSize: PAGINATION_DEFAULT.pageSize, page: PAGINATION_DEFAULT.current });

  // 字段列表相关状态
  const [fieldList, setFieldList] = useState<ScanTaskType.ColumnInfo[]>([]);
  const [fieldLoading, setFieldLoading] = useState<boolean>(false);
  const [fieldSearchValue, setFieldSearchValue] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedTableName, setSelectedTableName] = useState<string>('');
  // 字段分页相关状态
  const [fieldPagination, setFieldPagination] = useState<{ current: number; pageSize: number }>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
  });
  const [fieldTotal, setFieldTotal] = useState<number>(0);

  // 获取表列表数据
  const getTableList = async (newPagination?: typeof tablePagination) => {
    try {
      setTableLoading(true);
      const currentPagination = newPagination || tablePagination;
      const res = await api.getDataSourceTables(dataConnectId, {
        offset: (currentPagination.page - 1) * currentPagination.pageSize,
        limit: currentPagination.pageSize,
        keyword: tableSearchValue,
      });
      setTableList(res?.entries || []);
      setTableTotal(res?.total_count || 0);

      // 如果有表数据且没有选中的表，则默认选中第一个
      if ((res?.entries || []).length > 0 && !selectedTableId) {
        const firstTable = res.entries[0];
        handleTableSelect(firstTable);
      }
    } catch (error) {
      setTableList([]);
      setTableTotal(0);
    } finally {
      setTableLoading(false);
    }
  };

  // 获取字段列表数据，支持分页参数
  const getFieldList = async (tableId: string, params?: { current: number; pageSize: number }) => {
    setFieldLoading(true);
    try {
      const currentParams = params || fieldPagination;
      const offset = (currentParams.current - 1) * currentParams.pageSize;

      const resData = await api.getTableColumns(tableId, {
        limit: currentParams.pageSize,
        offset: offset,
        keyword: fieldSearchValue, // 添加搜索参数
      });

      if (resData?.entries) {
        setFieldList(resData.entries);
        setFieldTotal(resData?.total_count || 0);
      }
    } catch (error) {
      console.error('Failed to get field details:', error);
      setFieldList([]);
      setFieldTotal(0);
    } finally {
      setFieldLoading(false);
    }
  };

  // 处理表选择
  const handleTableSelect = (table: ScanTaskType.TableInfo) => {
    setSelectedTableId(table.id);
    setSelectedTableName(table.name);
    // 重置到第一页
    const newPagination = { ...fieldPagination, current: 1 };
    setFieldPagination(newPagination);
    // getFieldList(table.id, newPagination);
  };

  // 处理表列表分页变化
  const handleTablePaginationChange = (page: number, pageSize: number) => {
    const newPagination = { ...tablePagination, page, pageSize };
    setTablePagination(newPagination);
    getTableList(newPagination);
  };

  // 处理字段列表分页变化
  const handleFieldPaginationChange = (newPagination: any) => {
    setFieldPagination(newPagination);
    getFieldList(selectedTableId, newPagination);
  };

  // 表格列定义
  const columns = [
    {
      title: intl.get('Global.fieldName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: intl.get('Global.fieldType'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      ellipsis: true,
    },
    {
      title: intl.get('Global.fieldComment'),
      dataIndex: 'comment',
      key: 'comment',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '--',
    },
  ];

  // 监听数据源变化
  useEffect(() => {
    setTablePagination({ pageSize: PAGINATION_DEFAULT.pageSize, page: PAGINATION_DEFAULT.current });
    setSelectedTableId('');
    setSelectedTableName('');
    setFieldList([]);
    setFieldTotal(0);

    if (dataConnectId) {
      getTableList();
    } else {
      setTableList([]);
      setTableTotal(0);
    }
  }, [dataConnectId, tableSearchValue]);

  // 监听字段搜索值变化
  useEffect(() => {
    // 如果有选中的表，则重新获取字段列表
    if (selectedTableId) {
      const newPagination = { ...fieldPagination, current: 1 };
      setFieldPagination(newPagination);
      getFieldList(selectedTableId, newPagination);
    }
  }, [fieldSearchValue, selectedTableId]);

  return (
    <div className={styles.container}>
      {/* 左侧表名列表 */}
      <div className={styles.leftPanel}>
        <div className={styles.searchInput}>
          <Input
            prefix={<SearchOutlined style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '16px' }} />}
            allowClear
            placeholder={intl.get('Global.search')}
            value={tableSearchValue}
            onChange={(e) => setTableSearchValue(e.target.value || '')}
          />
        </div>
        <div className={styles.tableList}>
          {tableList.map((table) => (
            <div
              key={table.id}
              className={`${styles['tableItem']} ${selectedTableId === table.id ? styles.active : ''}`}
              onClick={() => handleTableSelect(table)}
            >
              <IconFont type="icon-dip-table" style={{ fontSize: '16px', marginRight: '8px' }} />
              <span className={styles['tableItem-title']} title={table.name}>
                {table.name}
              </span>
            </div>
          ))}
          {!tableLoading && tableList.length === 0 && <div className={styles.emptyTableList}>{intl.get('Global.noTableData')}</div>}
        </div>
        <div className={styles.pagination}>
          {tableList.length > 0 && (
            <Pagination
              simple
              current={tablePagination.page}
              total={tableTotal}
              pageSize={tablePagination.pageSize}
              showSizeChanger={false}
              onChange={handleTablePaginationChange}
              size="small"
            />
          )}
        </div>
      </div>

      {/* 右侧字段信息 */}
      <div className={styles.rightPanel}>
        <div className={styles.rightHeader}>
          <h3 className={styles.tableTitle}>{intl.get('Global.fieldList')}</h3>
          <Input.Search
            placeholder={intl.get('DataConnect.searchFieldNameOrComment')}
            allowClear
            style={{ width: 240 }}
            value={fieldSearchValue}
            onChange={(e) => setFieldSearchValue(e.target.value || '')}
          />
        </div>
        {fieldList.length > 0 ? (
          <>
            <div className={styles.tableContent}>
              <Table
                columns={columns}
                dataSource={fieldList}
                rowKey="id"
                pagination={false}
                scroll={{ y: 350, x: 'max-content' }}
                size="small"
                loading={fieldLoading}
                locale={{
                  emptyText: intl.get('Global.noFieldData'),
                }}
              />
            </div>
            <div className={styles.pagination}>
              <Pagination
                current={fieldPagination.current}
                total={fieldTotal}
                pageSize={fieldPagination.pageSize}
                showSizeChanger
                onChange={(page, pageSize) => handleFieldPaginationChange({ current: page, pageSize })}
                size="small"
                showTotal={(total) => intl.get('Global.total', { total })}
                onShowSizeChange={(_, pageSize) => {
                  handleFieldPaginationChange({ current: 1, pageSize });
                }}
                pageSizeOptions={[...PAGINATION_DEFAULT.pageSizeOptions]}
              />
            </div>
          </>
        ) : (
          <div className={styles.emptyContainer}>
            <img className={styles.emptyImg} src={emptyImg} alt={intl.get('Global.noDataPreview')} />
            <span className={styles.emptyTip}>
              {selectedTableId ? intl.get('DataConnect.fieldListEmptyTip') : intl.get('DataConnect.clickTableNameToViewFields')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTable;
