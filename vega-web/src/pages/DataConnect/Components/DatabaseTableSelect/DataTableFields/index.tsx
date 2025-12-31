import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Table } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import api from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import emptyImg from '@/assets/images/customDataView/empty.png';
import styles from './index.module.less';

const DataTableFields: React.FC<{ tableId: string }> = ({ tableId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<ScanTaskType.ColumnInfo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<{ current: number; pageSize: number }>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
  });

  const getDetail = async (params?: { current: number; pageSize: number }): Promise<void> => {
    if (!tableId) return;

    setLoading(true);

    const currentParams = params || pagination;
    const offset = (currentParams.current - 1) * currentParams.pageSize;

    try {
      const resData = await api.getTableColumns(tableId, {
        limit: currentParams.pageSize,
        offset: offset,
      });

      if (resData?.entries) {
        setTableData(resData.entries);
        setTotal(resData?.total_count || 0);
      }
    } catch (error) {
      console.error('Failed to get field details:', error);
      setTableData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableId) {
      const newPagination = { ...pagination, current: 1 };
      setPagination(newPagination);
      getDetail(newPagination);
    } else {
      setTableData([]);
      setTotal(0);
    }
  }, [tableId]);

  const handlePaginationChange = (newPagination: any) => {
    setPagination(newPagination);
    getDetail(newPagination);
  };

  return tableData.length > 0 ? (
    <div className={styles['preview-container']}>
      <div className={styles['preview-title']}>
        <span>{intl.get('Global.fieldList')}</span>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        scroll={{ y: 380 }}
        size="small"
        columns={[
          {
            title: intl.get('Global.name'),
            dataIndex: 'name',
            key: 'name',
            width: 150,
            ellipsis: true,
          },
          {
            title: intl.get('Global.type'),
            dataIndex: 'type',
            key: 'type',
            width: 120,
            ellipsis: true,
          },
          {
            title: intl.get('Global.comment'),
            dataIndex: 'comment',
            key: 'comment',
            ellipsis: true,
            render: (text: string) => text || '--',
          },
        ]}
        dataSource={tableData}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: PAGINATION_DEFAULT.showSizeChanger,
          showQuickJumper: PAGINATION_DEFAULT.showQuickJumper,
          showTotal: (total) => intl.get('Global.total', { total }),
          pageSizeOptions: [...PAGINATION_DEFAULT.pageSizeOptions],
          onChange: (page, pageSize) => {
            handlePaginationChange({ current: page, pageSize });
          },
          onShowSizeChange: (page, pageSize) => {
            handlePaginationChange({ current: 1, pageSize });
          },
        }}
      />
    </div>
  ) : (
    <div className={styles['empty-container']}>
      <img className={styles['empty-img']} src={emptyImg} alt={intl.get('Global.noDataPreview')} />
      <span className={styles['empty-tip']}>{intl.get('DataConnect.clickTableNameToViewFields')}</span>
    </div>
  );
};

export default DataTableFields;
