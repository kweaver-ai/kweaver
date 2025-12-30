import type React from 'react';
import { Dropdown, Button, Menu, message } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import './style.less';
import { delMCP, mapReleaseAction } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { OperateTypeEnum, OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import CreateMcpModal from './CreateMcpModal';
import { useState } from 'react';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { postResourceOperation } from '@/apis/authorization';
import { confirmModal } from '@/utils/modal';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import ExportButton from '../OperatorList/ExportButton';

const McpDropdown: React.FC<{ params: any; fetchInfo: any }> = ({ params, fetchInfo }) => {
  const microWidgetProps = useMicroWidgetProps();
  const { record, activeTab } = params;
  const navigate = useNavigate();
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();

  const handleDelete = async () => {
    try {
      await delMCP({
        mcp_id: record?.mcp_id,
      });
      message.success('删除成功');
      fetchInfo?.();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };
  const handlePreview = (type: string) => {
    const { mcp_id } = record;
    navigate(`/mcp-detail?mcp_id=${mcp_id}&action=${type}`);
  };

  const showDeleteConfirm = () => {
    confirmModal({
      title: '删除MCP',
      content: '请确认是否删除此MCP？',
      onOk() {
        handleDelete();
      },
      onCancel() {},
    });
  };

  const showOfflineConfirm = () => {
    confirmModal({
      title: '下架MCP',
      content: '下架后，引用了该MCP的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        handleStatus(OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  const handleStatus = async (status: string, text?: string) => {
    try {
      await mapReleaseAction(record?.mcp_id, {
        status,
      });
      message.success(text);
      fetchInfo?.();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ ...params, activeTab: OperatorTypeEnum.MCP }, microWidgetProps);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const closeToolModal = () => {
    setCreateToolOpen(false);
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: record?.mcp_id,
            type: activeTab,
          },
        ],
      });
      setIsPermissionCheckInfo(data?.[0]?.operation);
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <>
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu>
            {permissionCheckInfo?.includes(PermConfigTypeEnum.View) && (
              <Menu.Item onClick={() => handlePreview(OperateTypeEnum.Edit)}>查看</Menu.Item>
            )}

            {permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
              <Menu.Item onClick={() => setCreateToolOpen(true)}>编辑</Menu.Item>
            )}

            {record?.status !== OperatorStatusType.Published &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Publish) && (
                <Menu.Item onClick={() => handleStatus(OperatorStatusType.Published, '发布成功')}>发布</Menu.Item>
              )}

            {permissionCheckInfo?.includes(PermConfigTypeEnum.View) && (
              <Menu.Item>
                <ExportButton params={params} extension=".adp" />
              </Menu.Item>
            )}

            {record?.status === OperatorStatusType.Published &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Unpublish) && (
                <Menu.Item onClick={showOfflineConfirm}>下架</Menu.Item>
              )}

            {permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize) && (
              <Menu.Item>
                <PermConfigMenu params={params} />
              </Menu.Item>
            )}

            {record?.status !== OperatorStatusType.Published &&
              record?.status !== OperatorStatusType.Editing &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Delete) && (
                <Menu.Item className="operator-menu-delete" onClick={showDeleteConfirm}>
                  删除
                </Menu.Item>
              )}
          </Menu>
        }
      >
        <Button type="text" icon={<EllipsisOutlined />} onClick={resourceOperation} />
      </Dropdown>
      {createToolOpen && <CreateMcpModal closeModal={closeToolModal} mcpInfo={record} fetchInfo={fetchInfo} />}
    </>
  );
};

export default McpDropdown;
