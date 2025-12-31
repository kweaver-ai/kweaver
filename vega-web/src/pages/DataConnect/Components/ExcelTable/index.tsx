import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Table, Space, Empty } from 'antd';
import dayjs from 'dayjs';
import { PAGINATION_DEFAULT, DATE_FORMAT } from '@/hooks/useConstants';
import scanManagementApi from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import { Button } from '@/web-library/common';
import ExcelTableDetail from './detail';
import type { ColumnsType } from 'antd/es/table';

interface ExcelTableProps {
  dataConnectId: string;
}

const ExcelTable: React.FC<ExcelTableProps> = ({ dataConnectId }) => {
  // 状态管理
  const [data, setData] = useState<ScanTaskType.GetExcelColumnsRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<{
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: (total: number) => string;
    pageSizeOptions: string[];
  }>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
    total: 0,
    showSizeChanger: PAGINATION_DEFAULT.showSizeChanger,
    showQuickJumper: PAGINATION_DEFAULT.showQuickJumper,
    showTotal: (total: number) => intl.get('Global.total', { total }),
    pageSizeOptions: [...PAGINATION_DEFAULT.pageSizeOptions],
  });

  // 获取Excel表列表
  const fetchExcelTables = async (page: number = 1, pageSize: number = pagination.pageSize) => {
    setIsLoading(true);
    try {
      // 构建标准的分页参数
      const params: ScanTaskType.PageQueryParams = {
        offset: (page - 1) * pageSize,
        limit: pageSize,
      };

      const res = await scanManagementApi.getDataSourceTables(dataConnectId, params);

      if (res && res.entries && Array.isArray(res.entries)) {
        // 从advanced_params中提取需要的数据
        const tableData: ScanTaskType.GetExcelColumnsRequest[] = res.entries.map((item) => {
          // 确保advanced_params存在
          const advancedParams = item.advanced_params || {};

          return {
            id: item.id,
            create_time: item.create_time,
            name: item.name,
            ...advancedParams,
          };
        });

        setData(tableData);
        // 更新分页状态，优先使用接口返回的总数
        setPagination((prev) => ({
          ...prev,
          total: res.total_count !== undefined ? res.total_count : tableData.length,
          current: page,
          pageSize: pageSize,
        }));
      }
    } catch (error) {
      console.error('Failed to get Excel table list:', error);
      // 错误情况下使用模拟数据
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    if (dataConnectId) {
      fetchExcelTables();
    }
  }, [dataConnectId]);

  // 处理分页变化
  const handleTableChange = (newPagination: any) => {
    // 确保分页参数有效
    const page = newPagination.current || 1;
    const pageSize = newPagination.pageSize || pagination.pageSize;

    // 只有当页码或页大小发生变化时才重新获取数据
    if (page !== pagination.current || pageSize !== pagination.pageSize) {
      setPagination((prev) => ({ ...prev, current: page, pageSize }));
      fetchExcelTables(page, pageSize);
    }
  };

  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [detailVisible, setDetailVisible] = useState(false);

  // 打开详情弹窗
  const handleViewDetail = (table: ScanTaskType.GetExcelColumnsRequest) => {
    setSelectedTableId(table.id || '');
    setDetailVisible(true);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedTableId('');
  };

  const columns: ColumnsType<ScanTaskType.GetExcelColumnsRequest> = [
    {
      title: intl.get('Global.serialNumber'),
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: intl.get('Global.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 200,
    },
    {
      title: intl.get('Global.createTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      width: 180,
      render: (text) => (text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'),
    },
    {
      title: intl.get('DataConnect.sheet'),
      dataIndex: 'sheet',
      key: 'sheet',
      ellipsis: true,
      width: 200,
      render: (text) => text || '--',
    },
    {
      title: intl.get('DataConnect.cellRange'),
      dataIndex: 'range',
      key: 'range',
      width: 150,
      render: (_, record) => record.start_cell + '-' + record.end_cell,
    },
    {
      title: intl.get('Global.fieldDetail'),
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewDetail(record)} style={{ color: '#1890ff' }}>
            {intl.get('Global.view')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        pagination={pagination}
        onChange={handleTableChange}
        size="small"
        locale={{
          emptyText: <Empty description={intl.get('DataConnect.noExcelTableData')} />,
        }}
      />
      <ExcelTableDetail visible={detailVisible} onClose={handleCloseDetail} tableId={selectedTableId} />
    </>
  );
};

export default ExcelTable;
