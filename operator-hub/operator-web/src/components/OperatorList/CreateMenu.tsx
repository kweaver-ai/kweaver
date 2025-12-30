import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from './types';
import { useState } from 'react';
import CreateOperatorModal from '../Operator/CreateOperatorModal';
import OperatorFlowPanel from '../MyOperator/OperatorFlowPanel';
import CreateMcpModal from '../MCP/CreateMcpModal';
import CreateToolboxModal from '../Tool/CreateToolBoxModal';
import ImportFailed from '../Tool/ImportFailed';
import { PublishedPermModal } from './PublishedPermModal';
import { useMicroWidgetProps } from '@/hooks';
import { postResourceOperation } from '@/apis/authorization';
import { getOperatorTypeName } from './utils';

export default function CreateMenu({ fetchInfo, activeTab }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const microWidgetProps = useMicroWidgetProps();
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [createMcpOpen, setCreateMcpOpen] = useState(false);
  const [createOperatorOpen, setCreateOperatorOpen] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [dataSourceError, setDataSourceError] = useState([]);

  const closeMcpModal = () => {
    setCreateMcpOpen(false);
  };

  const closeFlowOpen = (val?: any) => {
    setIsFlowOpen(false);
    setCreateOperatorOpen(false);
    fetchInfo?.();
    const { status, operator_id, title: name } = val;
    if (status === OperatorStatusType.Published) {
      resourceOperation({ operator_id, name });
    }
  };

  const resourceOperation = async (record: any) => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: record?.operator_id,
            type: OperatorTypeEnum.Operator,
          },
        ],
      });
      const permissionCheckInfo = data?.[0]?.operation;
      if (permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ record, activeTab: OperatorTypeEnum.Operator }, microWidgetProps);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  // 新建工具箱成功
  const handleCreateSuccess = (boxInfo: {
    box_id: string;
    box_name: string;
    box_category: string;
    box_description: string;
    metadata_type: MetadataTypeEnum;
  }) => {
    message.success(
      boxInfo.metadata_type === MetadataTypeEnum.OpenAPI
        ? '新建工具箱成功，您可以继续导入工具'
        : '新建工具箱成功，您可以继续新建工具'
    );
    setCreateToolOpen(false);
    navigate(`/tool-detail?box_id=${boxInfo.box_id}&action=edit`);
  };

  // 跳转到IDE新建算子页面
  const jumpToCreateOperatorPage = () => {
    navigate('/ide/operator/create', {
      state: {
        from: location.pathname + location.search,
      },
    });
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          switch (activeTab) {
            case OperatorTypeEnum.Operator:
              setCreateOperatorOpen(true);
              break;
            case OperatorTypeEnum.ToolBox:
              setCreateToolOpen(true);
              break;
            default:
              setCreateMcpOpen(true);
              break;
          }
        }}
      >
        新建
        {getOperatorTypeName(activeTab)}
      </Button>
      {createOperatorOpen && (
        <CreateOperatorModal
          onCancel={() => setCreateOperatorOpen(false)}
          onOpenFlowEditor={() => setIsFlowOpen(true)}
          onOpenCreateOperatorPage={jumpToCreateOperatorPage}
        />
      )}
      {createToolOpen && <CreateToolboxModal onCancel={() => setCreateToolOpen(false)} onOk={handleCreateSuccess} />}
      {createMcpOpen && <CreateMcpModal closeModal={closeMcpModal} />}
      {isFlowOpen && <OperatorFlowPanel closeModal={closeFlowOpen} />}
      {Boolean(dataSourceError?.length) && (
        <ImportFailed
          dataSource={dataSourceError}
          closeModal={() => {
            setDataSourceError([]);
          }}
        />
      )}
    </>
  );
}
