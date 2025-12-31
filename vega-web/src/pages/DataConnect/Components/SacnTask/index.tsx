import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { EllipsisOutlined } from '@ant-design/icons';
import { Table, Space, Dropdown, Typography, Empty, Badge } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import scanManagementApi from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import { Button } from '@/web-library/common';
import ScanDetail from './detail';
import { getScanStatusColor } from '../../utils';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

const { Text } = Typography;

interface ScanTaskProps {
  dataConnectId: string;
}

const ScanTask: React.FC<ScanTaskProps> = ({ dataConnectId }) => {
  // 状态管理
  const [data, setData] = useState<ScanTaskType.ScanTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
    total: 0,
  });

  // 获取扫描任务列表
  const fetchScanTasks = async (page: number = 1, pageSize: number = PAGINATION_DEFAULT.pageSize) => {
    setIsLoading(true);
    const size = pageSize || pagination.pageSize || PAGINATION_DEFAULT.pageSize;
    try {
      const params: ScanTaskType.PageQueryParams = {
        ds_id: dataConnectId,
        offset: (page - 1) * size,
        limit: size,
        sort: 'start_time',
        direction: 'desc',
      };

      const res = await scanManagementApi.getScanTaskList(params);
      setData(res.entries || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total_count || 0,
        current: page,
      }));
    } catch (error) {
      console.error('Failed to get scan task list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchScanTasks();
  }, [dataConnectId]);

  // 处理分页变化
  const handleTableChange = (newPagination: TablePaginationConfig, _filters: unknown, _sorter: unknown) => {
    setPagination(newPagination);
    fetchScanTasks(newPagination.current, newPagination.pageSize);
  };

  const [selectedTask, setSelectedTask] = useState<ScanTaskType.ScanTaskItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // 打开详情弹窗
  const handleViewDetail = (task: ScanTaskType.ScanTaskItem | null) => {
    if (task) {
      setSelectedTask(task);
      setDetailVisible(true);
    }
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedTask(null);
  };

  // 移除getStatusTag函数，直接在render中使用getScanStatusColor

  // 更多操作菜单项
  const menuItems = [
    {
      key: '1',
      label: intl.get('Global.view'),
    },
  ];

  const columns: ColumnsType<ScanTaskType.ScanTaskItem> = [
    {
      title: intl.get('Global.scanTarget'),
      dataIndex: 'name',
      width: 300,
      ellipsis: true,
      key: 'name',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: intl.get('Global.operation'),
      key: 'action',
      width: 80,
      render: (_, record) =>
        record.allow_multi_table_scan ? (
          <Space size="middle">
            <Dropdown
              menu={{
                items: menuItems,
                onClick: (item) => {
                  if (item.key === '1') {
                    handleViewDetail(record);
                  }
                },
              }}
            >
              <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event: React.MouseEvent) => event.stopPropagation()} />
            </Dropdown>
          </Space>
        ) : (
          '--'
        ),
    },
    {
      title: intl.get('Global.scanStatus'),
      dataIndex: 'scan_status',
      key: 'scan_status',
      render: (text: string): string | JSX.Element => {
        const { label, color } = getScanStatusColor(text);
        return <Badge status={color} text={label} />;
      },
    },
    {
      title: intl.get('Global.creator'),
      dataIndex: 'create_user',
      key: 'create_user',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: intl.get('Global.createTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text) => <Text>{text || '-'}</Text>,
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{
          ...pagination,
          showSizeChanger: PAGINATION_DEFAULT.showSizeChanger,
          showQuickJumper: PAGINATION_DEFAULT.showQuickJumper,
          showTotal: (total) => intl.get('Global.total', { total }),
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: <Empty description={intl.get('Global.noScanTask')} />,
        }}
      />
      <ScanDetail visible={detailVisible} onClose={handleCloseDetail} scanDetail={selectedTask || ({} as ScanTaskType.ScanTaskItem)} />
    </>
  );
};

export default ScanTask;
