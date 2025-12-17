import { useEffect, useState } from 'react';
import './style.less';
import { useMicroWidgetProps } from '@/hooks';
import { getOperatorInfo, postOperatorStatus } from '@/apis/agent-operator-integration';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, message, Tag } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import OperatorStatusTag from './OperatorStatusTag';
import EditOperatorModal from './EditOperatorModal';
import JsonschemaTab from './JsonschemaTab';
import { OperatorStatusType } from './types';

export default function OperatorDetail({}) {
  const microWidgetProps = useMicroWidgetProps();
  const [searchParams] = useSearchParams();
  const [operatorInfo, setOperatorInfo] = useState<any>();
  const [isOpen, setIsOpen] = useState(false);
  const operator_id = searchParams.get('operator_id');
  const version = searchParams.get('version');
  const navigate = useNavigate();

  useEffect(() => {
    fetchConfig({});
  }, []);
  const fetchConfig = async (data?: any) => {
    try {
      const data = await getOperatorInfo({
        operator_id,
        version,
      });
      setOperatorInfo(data);
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const handleStatus = async (status: string, text?: string) => {
    try {
      await postOperatorStatus([
        {
          operator_id: operatorInfo?.operator_id,
          version: operatorInfo?.version,
          status,
        },
      ]),
        fetchConfig({});
      message.success(text);
    } catch (error: any) {
      message.error(error?.description);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    fetchConfig({});
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'POST':
        return <Tag color="processing">{status}</Tag>;
      case 'GET':
        return <Tag color="success">{status}</Tag>;
      case 'DELETE':
        return <Tag color="error">{status}</Tag>;
      case 'Put':
        return <Tag color="warning">{status}</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  return (
    <div className="operator-details">
      <div className="operator-details-head">
        <div onClick={() => navigate('/')} className="operator-details-head-back">
          <LeftOutlined />
          <span style={{ marginLeft: '12px' }}>返回</span>
        </div>
      </div>

      <div className="operator-details-title">
        <div>
          <div className="operator-details-title-name">
            <span style={{ marginRight: '20px' }}>{operatorInfo?.name}</span>
            <OperatorStatusTag status={operatorInfo?.status} />
          </div>
          <div className="operator-details-title-des">{operatorInfo?.metadata?.description}</div>
          <div className="operator-details-title-url"> URL: {operatorInfo?.metadata?.server_url}</div>
          <span>{getStatusTag(operatorInfo?.metadata?.method)}</span>
          <Tag>{operatorInfo?.metadata?.path}</Tag>
        </div>
        <div className="operator-details-title-button">
          {operatorInfo?.status !== OperatorStatusType.Published && (
            <Button type="primary" onClick={() => handleStatus(OperatorStatusType.Published, '发布成功')}>
              发布
            </Button>
          )}
          {operatorInfo?.status === OperatorStatusType.Published && (
            <Button color="danger" variant="solid" onClick={() => handleStatus(OperatorStatusType.Offline, '下架成功')}>
              下架
            </Button>
          )}
          {operatorInfo?.status !== OperatorStatusType.Offline && <Button onClick={() => setIsOpen(true)}>编辑</Button>}
        </div>
      </div>
      <div className="operator-details-content">
        <div className="operator-details-content-title">参数列表</div>

        <JsonschemaTab operatorInfo={operatorInfo} type="Inputs" />
        <JsonschemaTab operatorInfo={operatorInfo} type="Outputs" />
      </div>
      {isOpen && <EditOperatorModal closeModal={closeModal} operatorInfo={operatorInfo} />}
    </div>
  );
}
