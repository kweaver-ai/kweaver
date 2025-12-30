import type React from 'react';
import { Dropdown, Button, Menu, message } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import './style.less';
import { boxToolStatus, delToolBox } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { OperateTypeEnum, OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import EditToolBoxModal from './EditToolBoxModal';
import { useState } from 'react';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { postResourceOperation } from '@/apis/authorization';
import { confirmModal } from '@/utils/modal';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import ExportButton from '../OperatorList/ExportButton';

const ToolDropdown: React.FC<{ params: any; fetchInfo: any }> = ({ params, fetchInfo }) => {
  const microWidgetProps = useMicroWidgetProps();
  const { activeTab, record } = params;
  const navigate = useNavigate();
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();

  const closeToolModal = () => {
    setCreateToolOpen(false);
  };
  const handleDelete = async () => {
    try {
      await delToolBox({
        box_id: record?.box_id,
      }),
        message.success('删除成功');
      fetchInfo?.();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };
  const handlePreview = (type: string) => {
    const { box_id } = record;
    navigate(`/tool-detail?box_id=${box_id}&action=${type}`);
  };

  const showDeleteConfirm = () => {
    confirmModal({
      title: '删除工具',
      content: '请确认是否删除此工具？',
      onOk() {
        handleDelete();
      },
      onCancel() {},
    });
  };

  const showOfflineConfirm = () => {
    confirmModal({
      title: '下架工具',
      content: '下架后，引用了该工具的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        handleStatus(OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  const handleStatus = async (status: string, text?: string) => {
    try {
      await boxToolStatus(record?.box_id, {
        status,
      });
      message.success(text);
      fetchInfo?.();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ ...params, activeTab: OperatorTypeEnum.ToolBox }, microWidgetProps);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: record?.box_id,
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
                <Menu.Item onClick={showDeleteConfirm} className="operator-menu-delete">
                  删除
                </Menu.Item>
              )}
          </Menu>
        }
      >
        <Button type="text" icon={<EllipsisOutlined />} onClick={resourceOperation} />
      </Dropdown>
      {createToolOpen && <EditToolBoxModal closeModal={closeToolModal} toolBoxInfo={record} fetchInfo={fetchInfo} />}
    </>
  );
};

export default ToolDropdown;
