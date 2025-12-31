import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Table, Empty } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import api from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import { Drawer } from '@/web-library/common';
import styles from './index.module.less';
import type { ColumnsType } from 'antd/es/table';

interface ExcelTableDetailProps {
  tableId: string;
  visible: boolean;
  onClose: () => void;
}

const ExcelTableDetail: React.FC<ExcelTableDetailProps> = ({ tableId, visible, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<ScanTaskType.ColumnInfo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pagination, setPagination] = useState<{ current: number; pageSize: number }>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
  });

  // 获取字段详情数据，支持分页参数
  const getDetail = async (params?: { current: number; pageSize: number }): Promise<void> => {
    if (!tableId) return;

    setLoading(true);

    const currentParams = params || pagination;
    const offset = (currentParams.current - 1) * currentParams.pageSize;

    try {
      // 使用api.getTableColumns获取数据，传递分页参数
      const resData = await api.getTableColumns(tableId, {
        limit: currentParams.pageSize,
        offset: offset,
      });

      if (resData?.entries) {
        setTableData(resData.entries);
        // 设置总数，支持分页显示
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

  // 监听tableId和visible变化，重新获取数据
  useEffect(() => {
    if (visible && tableId) {
      // 重置到第一页
      const newPagination = { ...pagination, current: 1 };
      setPagination(newPagination);
      getDetail(newPagination);
    } else {
      setTableData([]);
      setTotal(0);
    }
  }, [visible, tableId]);

  // 处理分页变化
  const handlePaginationChange = (newPagination: any) => {
    setPagination(newPagination);
    getDetail(newPagination);
  };

  // 表格列定义，参照DataTableFields组件
  const columns: ColumnsType<ScanTaskType.ColumnInfo> = [
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
  ];

  return (
    <Drawer title={intl.get('Global.fieldDetail')} placement="right" onClose={onClose} open={visible} width={600}>
      {tableData.length > 0 ? (
        <div className={styles['preview-container']}>
          <Table
            rowKey="id"
            loading={loading}
            scroll={{ y: 380 }}
            size="small"
            columns={columns}
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
            locale={{
              emptyText: <Empty description={intl.get('Global.noFieldData')} />,
            }}
          />
        </div>
      ) : (
        <div className={styles['empty-container']}>
          <Empty description={intl.get('Global.noFieldData')} />
        </div>
      )}
    </Drawer>
  );
};

export default ExcelTableDetail;
