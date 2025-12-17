import { Menu } from 'antd';
import ToolIcon from '@/assets/images/tool.svg';
import OperatorIcon from '@/assets/images/operator.svg';
import McpIcon from '@/assets/images/mcp.svg';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from './types';
import { useState } from 'react';
import CreateModal from '../Operator/CreateModal';
import CreateToolModal from '../Tool/CreateToolBoxModal';
import OperatorFlowPanel from '../MyOperator/OperatorFlowPanel';
import CreateMcpModal from '../MCP/CreateMcpModal';
import CreateOperatorModal from '../Operator/CreateOperatorModal';
import ImportFailed from '../Tool/ImportFailed';
import { PublishedPermModal } from './PublishedPermModal';
import { useMicroWidgetProps } from '@/hooks';
import { postResourceOperation } from '@/apis/authorization';

export default function CreateMenu({ fetchInfo, permConfigInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [createMcpOpen, setCreateMcpOpen] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dataSourceError, setDataSourceError] = useState([]);

  const closeModal = () => {
    setOpenCreate(false);
  };
  const closeToolModal = () => {
    setCreateToolOpen(false);
  };
  const closeMcpModal = () => {
    setCreateMcpOpen(false);
  };

  const isModal = (data?: any) => {
    const { type, open } = data;
    if (type === '1') {
      setIsCreateOpen(open);
    } else {
      setIsFlowOpen(open);
    }
  };
  const closeFlowOpen = (val?: any) => {
    setIsFlowOpen(false);
    closeModal();
    fetchInfo?.();
    const { status, operator_id, title: name } = val;
    if (status === OperatorStatusType.Published) {
      resourceOperation({ operator_id, name });
    }
  };
  const closeCreateOpen = (data?: any) => {
    setIsCreateOpen(false);
    closeModal();
    setDataSourceError(data || []);
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

  return (
    <>
      <Menu className="create-operator-menu">
        {(permConfigInfo?.[OperatorTypeEnum.MCP]?.includes(PermConfigTypeEnum.Create) ||
          permConfigInfo?.[OperatorTypeEnum.ToolBox]?.includes(PermConfigTypeEnum.Create)) && (
          <div className="create-operator-menu-title">在Data agent 的技能中使用</div>
        )}
        {permConfigInfo?.[OperatorTypeEnum.MCP]?.includes(PermConfigTypeEnum.Create) && (
          <Menu.Item
            key={OperatorTypeEnum.MCP}
            onClick={() => {
              setCreateMcpOpen(true);
            }}
          >
            <div style={{ display: 'flex' }}>
              <McpIcon style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '6px' }} />
              <div style={{ marginLeft: '5px' }}>
                <div className="create-operator-menu-name">MCP 服务</div>
                <div className="create-operator-menu-desc">通过标准化协议（MCP）实现多工具统一管理与智能调用</div>
              </div>
            </div>
          </Menu.Item>
        )}
        {permConfigInfo?.[OperatorTypeEnum.ToolBox]?.includes(PermConfigTypeEnum.Create) && (
          <Menu.Item
            key={OperatorTypeEnum.ToolBox}
            onClick={() => {
              setCreateToolOpen(true);
            }}
          >
            <div style={{ display: 'flex' }}>
              <ToolIcon style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '6px' }} />
              <div style={{ marginLeft: '5px' }}>
                <div className="create-operator-menu-name">工具</div>
                <div className="create-operator-menu-desc">实现特定功能或任务的模块</div>
              </div>
            </div>
          </Menu.Item>
        )}
        {permConfigInfo?.[OperatorTypeEnum.Operator]?.includes(PermConfigTypeEnum.Create) && (
          <>
            <div className="create-operator-menu-title" style={{ borderTop: '1px solid #E4E6ED', paddingTop: '6px' }}>
              在数据管道中使用
            </div>
            <Menu.Item
              key={OperatorTypeEnum.Operator}
              onClick={() => {
                setOpenCreate(true);
              }}
            >
              <div style={{ display: 'flex' }}>
                <OperatorIcon style={{ width: '32px', height: '32px', borderRadius: '8px', marginRight: '6px' }} />
                <div style={{ marginLeft: '5px' }}>
                  <div className="create-operator-menu-name">算子</div>
                  <div className="create-operator-menu-desc">在数据处理场景中，执行特定操作的最小单位</div>
                </div>
              </div>
            </Menu.Item>
          </>
        )}
      </Menu>
      {openCreate && <CreateModal closeModal={closeModal} isModal={isModal} />}
      {createToolOpen && <CreateToolModal closeModal={closeToolModal} />}
      {createMcpOpen && <CreateMcpModal closeModal={closeMcpModal} />}
      {isFlowOpen && <OperatorFlowPanel closeModal={closeFlowOpen} />}
      {isCreateOpen && <CreateOperatorModal closeModal={closeCreateOpen} fetchInfo={fetchInfo} />}
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
