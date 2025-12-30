import type React from 'react';
import { Button, message } from 'antd';
import './style.less';
import { mapReleaseAction } from '@/apis/agent-operator-integration';
import { OperatorStatusType, OperatorTypeEnum, PermConfigShowType, PermConfigTypeEnum } from '../OperatorList/types';
import { useState } from 'react';
import { confirmModal } from '@/utils/modal';
import CreateMcpModal from './CreateMcpModal';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import { useMicroWidgetProps } from '@/hooks';

const McpDetailButton: React.FC<{
  detailInfo: any;
  fetchInfo: any;
  permissionCheckInfo: Array<PermConfigTypeEnum>;
}> = ({ detailInfo, fetchInfo, permissionCheckInfo }) => {
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const microWidgetProps = useMicroWidgetProps();

  const changeMcpStatus = async (status: string, text: string) => {
    setButtonLoading(true);
    try {
      await mapReleaseAction(detailInfo?.mcp_id, {
        status,
      });
      message.success(text);
      fetchInfo?.();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ record: detailInfo, activeTab: OperatorTypeEnum.MCP }, microWidgetProps);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    } finally {
      setButtonLoading(false);
    }
  };

  const closeToolModal = () => {
    setCreateToolOpen(false);
  };

  const showOfflineConfirm = () => {
    confirmModal({
      title: '下架MCP',
      content: '下架后，引用了该MCP的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        changeMcpStatus(OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  return (
    <>
      {/* <Button icon={<EllipsisOutlined />} /> */}
      {permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize) && (
        <PermConfigMenu
          params={{ record: detailInfo, activeTab: OperatorTypeEnum.MCP }}
          type={PermConfigShowType.Button}
        />
      )}
      {permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
        <Button onClick={() => setCreateToolOpen(true)}>编辑</Button>
      )}
      {detailInfo?.status !== OperatorStatusType.Published &&
        permissionCheckInfo?.includes(PermConfigTypeEnum.Publish) && (
          <Button
            type="primary"
            variant="filled"
            onClick={() => changeMcpStatus(OperatorStatusType.Published, '发布成功')}
            loading={buttonLoading}
          >
            发布
          </Button>
        )}
      {detailInfo?.status === OperatorStatusType.Published &&
        permissionCheckInfo?.includes(PermConfigTypeEnum.Unpublish) && (
          <Button color="danger" variant="filled" onClick={showOfflineConfirm} loading={buttonLoading}>
            下架
          </Button>
        )}
      {createToolOpen && <CreateMcpModal closeModal={closeToolModal} mcpInfo={detailInfo} fetchInfo={fetchInfo} />}
    </>
  );
};

export default McpDetailButton;
