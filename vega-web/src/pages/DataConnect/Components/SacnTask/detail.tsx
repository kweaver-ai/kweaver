import React, { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { DatabaseOutlined } from '@ant-design/icons';
import { Table, Button, Row, Col, Empty, Badge } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { PAGINATION_DEFAULT, DATE_FORMAT } from '@/hooks/useConstants';
import { getScanTaskInfo, retryScanTask } from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import { Drawer } from '@/web-library/common';
import styles from './index.module.less';
import { getScanStatusColor } from '../../utils';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

// 扫描任务子表项接口

interface ScanDetailProps {
  scanDetail: ScanTaskType.ScanTaskItem;
  visible: boolean;
  onClose: () => void;
}

const ScanDetail: React.FC<ScanDetailProps> = ({ visible, onClose, scanDetail }) => {
  // 从 scanDetail 中解析统计数据
  const { table_count = 0, success_count = 0, fail_count = 0 } = JSON.parse(scanDetail.task_result_info || '{}');

  // 状态管理
  const [subTaskData, setSubTaskData] = useState<ScanTaskType.ScanTaskInfoResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: PAGINATION_DEFAULT.current,
    pageSize: PAGINATION_DEFAULT.pageSize,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' | 'success' | 'fail'

  // 获取扫描任务子表数据
  const fetchSubTaskData = async (page: number = 1, pageSize: number = PAGINATION_DEFAULT.pageSize, status: string = 'all') => {
    setIsLoading(true);
    try {
      // 准备请求参数
      const params: ScanTaskType.ScanTaskInfoParams = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        status: status === 'all' ? undefined : (status as ScanTaskType.Status),
      };

      // 调用接口获取数据
      const response = await getScanTaskInfo(scanDetail.id, params);

      // 转换数据格式
      setSubTaskData(response.entries);
      setPagination((prev) => ({
        ...prev,
        total: response.total_count,
        current: page,
      }));
    } catch (error) {
      console.error('Failed to get scan task details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // 处理分页变化
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    fetchSubTaskData(newPagination.current, newPagination.pageSize, statusFilter);
  };

  // 处理统计数据点击筛选
  const handleStatClick = (type: string) => {
    // 点击当前筛选类型时，取消筛选
    const newFilter = statusFilter === type ? 'all' : type;
    setStatusFilter(newFilter);
    setPagination((prev) => ({ ...prev, current: 1 })); // 重置到第一页
    fetchSubTaskData(1, pagination.pageSize, newFilter);
  };

  // 处理重试操作
  const handleRetry = async (record: ScanTaskType.ScanTaskInfoResponseItem) => {
    setIsLoading(true);
    try {
      const params: ScanTaskType.RetryRequest = {
        id: scanDetail.id, // 使用主任务ID
        tables: [record.table_id], // 重试单个表
      };

      await retryScanTask(params);
      setIsLoading(false);
      // 重试成功后，重新获取数据
      fetchSubTaskData(pagination.current, pagination.pageSize, statusFilter);
    } catch (error) {
      setIsLoading(false);
      console.error('Failed to retry scan task:', error);
    }
  };

  // 当visible或statusFilter变化时，重新获取数据
  useEffect(() => {
    if (visible) {
      fetchSubTaskData(1, pagination.pageSize, statusFilter);
    }
  }, [visible, statusFilter]);

  // 表格列定义
  const columns: ColumnsType<ScanTaskType.ScanTaskInfoResponseItem> = [
    {
      title: intl.get('Global.scanTarget'),
      dataIndex: 'table_name',
      width: 300,
      ellipsis: true,
      key: 'table_name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DatabaseOutlined />
          <span>{text}</span>
        </div>
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
      title: intl.get('Global.startTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      render: (text: string) => (text ? dayjs(text).format(DATE_FORMAT.DEFAULT) : '--'),
    },
    {
      title: intl.get('Global.operation'),
      key: 'action',
      render: (_, record) => {
        // 只有失败状态才显示重试按钮
        if (record.scan_status === 'fail') {
          return (
            <Button type="link" size="small" onClick={() => handleRetry(record)}>
              {intl.get('Global.retry')}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Drawer title={intl.get('Global.scanDetail')} placement="right" onClose={onClose} open={visible} width={800}>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <dl onClick={() => handleStatClick('all')} className={classNames(styles['item'], statusFilter === 'all' && styles['item-active'])}>
            <dt>{intl.get('Global.totalTables')}</dt>
            <dd style={{ color: '#000' }}>{table_count || '0'}</dd>
          </dl>
        </Col>
        <Col span={8}>
          <div onClick={() => handleStatClick('success')} className={classNames(styles['item'], statusFilter === 'success' && styles['item-active'])}>
            <dt>{intl.get('Global.successCount')}</dt>
            <dd style={{ color: '#75C140' }}>{success_count || '0'}</dd>
          </div>
        </Col>
        <Col span={8}>
          <div onClick={() => handleStatClick('fail')} className={classNames(styles['item'], statusFilter === 'fail' && styles['item-active'])}>
            <dt>{intl.get('Global.failCount')}</dt>
            <dd style={{ color: '#C6020B' }}>{fail_count || '0'}</dd>
          </div>
        </Col>
      </Row>

      {/* 扫描子表列表 */}
      <Table
        columns={columns}
        dataSource={subTaskData}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ y: 500 }}
        pagination={{
          ...pagination,
          showSizeChanger: PAGINATION_DEFAULT.showSizeChanger,
          showQuickJumper: PAGINATION_DEFAULT.showQuickJumper,
          showTotal: (total) => intl.get('Global.total', { total }),
          pageSizeOptions: [...PAGINATION_DEFAULT.pageSizeOptions],
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: <Empty description={intl.get('Global.noData')} />,
        }}
      />
    </Drawer>
  );
};

export default ScanDetail;
