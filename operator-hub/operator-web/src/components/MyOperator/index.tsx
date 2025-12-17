import { useEffect, useState } from 'react';
import { Table, Button, Typography, Dropdown, Menu, message, Popconfirm, type PopconfirmProps } from 'antd';
import { PlusOutlined, MoreOutlined, CaretDownOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import './style.less';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router';
import RunFormModal from './RunFormModal';
import SearchInput from '../SearchInput';
import { useMicroWidgetProps } from '@/hooks';
import { getOperatorList, postOperatorStatus } from '@/apis/agent-operator-integration';
import { delOperator } from '@/apis/agent-operator-integration';
import OperatorStatusTag from './OperatorStatusTag';
import EditOperatorModal from './EditOperatorModal';
import OperatorFlowPanel from './OperatorFlowPanel';
import { OperatorStatusType } from './types';
import CreateOperatorModal from '../Operator/CreateOperatorModal';

const { Title, Paragraph } = Typography;

interface AlgorithmItem {
  key: string;
  name: string;
  description: string;
  version: string;
  status: string;
  debugStatus: string;
  modifiedTime: string;
}

export default function MyOperator({}) {
  const microWidgetProps = useMicroWidgetProps();
  const [operatorsList, setOperatorsList] = useState<any>();
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isRunFormOpen, setIsRunFormOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectoperator, setSelectoperator] = useState<any>();
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    fetchConfig({});
  }, []);
  const fetchConfig = async (data?: any) => {
    const { page = 1, limit = 10, name = '' } = data;
    try {
      const data = await getOperatorList({
        page,
        page_size: limit,
        user_id: microWidgetProps?.userid,
        name,
      });
      setOperatorsList(data);
    } catch (error: any) {
      console.error(error);
    }
  };

  const getOperatorName = (status: string) => {
    switch (status) {
      case 'composite':
        return '混合算子';
      default:
        return '基础算子';
    }
  };

  const formatTime = (timestamp?: number, format = 'YYYY/MM/DD HH:mm') => {
    if (!timestamp) {
      return '';
    }
    const timestampMilliseconds = Math.floor(timestamp / 1000000);
    return moment(timestampMilliseconds).format(format);
  };

  const handlePreview = (record: any) => {
    const { operator_id, version, extend_info } = record;
    if (record?.operator_info?.operator_type === 'basic') {
      navigate(`/operator-detail?operator_id=${operator_id}&version=${version}&back=${btoa(location.pathname)}`);
    } else {
      navigate(`/details/${extend_info?.dag_id}`);
      // microWidgetProps?.history.navigateToMicroWidget({
      //   name: 'flow-web-operator',
      //   path: `/details/${extend_info?.dag_id}?back=${btoa(location.pathname)}`,
      //   isNewTab: false,
      //   isClose: false,
      // });
    }
  };

  const handleRun = (record: any) => {
    setSelectoperator(record);
    setIsRunFormOpen(true);
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
    fetchConfig({ page: 1, limit: 10, name: value });
  };
  const handleDelete = async (record: any) => {
    try {
      await delOperator([
        {
          operator_id: record?.operator_id,
          version: record?.version,
        },
      ]),
        fetchConfig({});
      message.success('删除成功');
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const handleEdit = async (record: any) => {
    setSelectoperator(record);
    if (record?.operator_info?.operator_type === 'basic') {
      setIsEditOpen(true);
    } else {
      setIsFlowOpen(true);
      setSelectoperator(record);
    }
  };
  const closeCreateModal = () => {
    setIsCreateOpen(false);
    fetchConfig({});
  };
  const closeEditModal = () => {
    setIsEditOpen(false);
    fetchConfig({});
  };

  const handleStatus = async (record: any, status: string, text?: string) => {
    try {
      await postOperatorStatus([
        {
          operator_id: record?.operator_id,
          version: record?.version,
          status,
        },
      ]),
        fetchConfig({});
      message.success(text);
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const cancel: PopconfirmProps['onCancel'] = e => {
    console.log(e);
  };

  const columns: ColumnsType<AlgorithmItem> = [
    {
      title: '算子名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 260,
    },
    {
      title: <span className="text-gray-500 flex items-center">状态</span>,
      dataIndex: 'status',
      key: 'status',
      width: 60,
      render: status => <OperatorStatusTag status={status} />,
    },
    {
      title: <span>类型</span>,
      dataIndex: 'operator_type',
      key: 'operator_type',
      width: 60,
      render: (text, record: any) => getOperatorName(record?.operator_info?.operator_type),
    },
    // {
    //   title: (
    //     <span className="text-gray-500 flex items-center">
    //       调试状态 <MoreOutlined className="ml-1" />
    //     </span>
    //   ),
    //   dataIndex: 'debugStatus',
    //   key: 'debugStatus',
    //   width: 120,
    //   render: status => getDebugStatusTag(status),
    // },
    {
      title: '修改时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 120,
      render: (text, record) => <div>{formatTime(text)}</div>,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (Text, record: any) => (
        <>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item hidden={record?.operator_info?.operator_type === 'basic'} onClick={() => handleRun(record)}>
                  运行
                </Menu.Item>
                <Menu.Item onClick={() => handlePreview(record)}>详情</Menu.Item>
                {record?.status !== OperatorStatusType.Offline && (
                  <Menu.Item onClick={() => handleEdit(record)}>编辑</Menu.Item>
                )}
                {record?.status !== OperatorStatusType.Published && (
                  <Menu.Item onClick={() => handleStatus(record, OperatorStatusType.Published, '发布成功')}>
                    发布
                  </Menu.Item>
                )}
                {record?.status === OperatorStatusType.Published && (
                  <Menu.Item onClick={() => handleStatus(record, OperatorStatusType.Offline, '下架成功')}>
                    下架
                  </Menu.Item>
                )}
                {record?.status === OperatorStatusType.Unpublish && (
                  <Menu.Item>
                    <Popconfirm
                      title="删除算子"
                      description="请确认是否删除此算子？"
                      onConfirm={() => handleDelete(record)}
                      onCancel={cancel}
                      okText="确认"
                      cancelText="取消"
                    >
                      <span>删除</span>
                    </Popconfirm>
                  </Menu.Item>
                )}
              </Menu>
            }
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </>
      ),
    },
  ];

  const closeModal = () => {
    setIsFlowOpen(false);
    fetchConfig({});
  };

  const closeRunModal = () => {
    setIsRunFormOpen(false);
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    fetchConfig({ page: newPage, limit: newPageSize, name: searchName });
  };

  const moreMenu = (
    <Menu>
      <Menu.Item
        key="1"
        onClick={() => {
          setIsCreateOpen(true);
          setSelectoperator({});
        }}
      >
        上传本地JSON/YAML文件
        <div>上传已开发好的本地JSON/ML文件</div>
      </Menu.Item>
      <Menu.Item
        key="2"
        onClick={() => {
          setIsFlowOpen(true);
          setSelectoperator({});
        }}
      >
        在流程编辑器中编排
        <div>使用流程编辑器在线快速编排</div>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="my-operator">
      <div className="mb-6">
        <Title level={4} className="mb-1">
          我的算子
        </Title>
        <Paragraph className="text-gray-500">算法完整业务逻辑的最小可编排单元，并能通过组合实现复杂业务逻辑</Paragraph>
      </div>

      <div className="flex justify-between" style={{ marginBottom: '16px' }}>
        <Dropdown overlay={moreMenu} getPopupContainer={() => microWidgetProps.container}>
          <Button type="primary" icon={<PlusOutlined />}>
            新建
            <CaretDownOutlined />
          </Button>
        </Dropdown>
        <SearchInput value={searchName} placeholder="搜索" onSearch={handleSearch} />
      </div>

      <Table
        size="middle"
        columns={columns}
        dataSource={operatorsList?.data || []}
        rowClassName="hover:bg-gray-50"
        className="algorithm-table"
        scroll={{ y: 'calc(100vh - 320px)' }}
        pagination={{
          current: operatorsList?.page,
          pageSize: operatorsList?.page_size,
          total: operatorsList?.total,
          showSizeChanger: true,
          onChange: handlePageChange,
        }}
      />
      {isFlowOpen && <OperatorFlowPanel closeModal={closeModal} selectoperator={selectoperator} />}
      {isRunFormOpen && <RunFormModal closeRunModal={closeRunModal} selectoperator={selectoperator} />}
      {isCreateOpen && <CreateOperatorModal closeModal={closeCreateModal} />}
      {isEditOpen && <EditOperatorModal closeModal={closeEditModal} operatorInfo={selectoperator} />}
    </div>
  );
}
