import type React from 'react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Dropdown, Button, Menu, message } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import './style.less';
import { delOperator, postOperatorStatus } from '@/apis/agent-operator-integration';
import { MetadataTypeEnum } from '@/apis/agent-operator-integration/type';
import {
  OperateTypeEnum,
  OperatorInfoTypeEnum,
  OperatorStatusType,
  OperatorTypeEnum,
  PermConfigTypeEnum,
} from '../OperatorList/types';
import OperatorFlowPanel from '../MyOperator/OperatorFlowPanel';
import RunFormModal from '../MyOperator/RunFormModal';
import EditOperatorModal from '../MyOperator/EditOperatorModal';
import { useNavigate } from 'react-router-dom';
import { useMicroWidgetProps } from '@/hooks';
import { confirmModal } from '@/utils/modal';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { postResourceOperation } from '@/apis/authorization';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import ExportButton from '../OperatorList/ExportButton';

const OperatorDropdown: React.FC<{ params: any; fetchInfo: any }> = ({ params, fetchInfo }) => {
  const { activeTab, record } = params;
  const location = useLocation();
  const microWidgetProps = useMicroWidgetProps();
  const [isRunFormOpen, setIsRunFormOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const navigate = useNavigate();
  const [permissionCheckInfo, setIsPermissionCheckInfo] = useState<Array<PermConfigTypeEnum>>();

  const handleRun = () => {
    setIsRunFormOpen(true);
  };

  const handlePreview = (record: any, type: string) => {
    const { operator_id } = record;

    navigate(`/operator-detail?operator_id=${operator_id}&action=${type}`);
  };

  const logPreview = (record: any) => {
    const { extend_info } = record;
    navigate(`/details/${extend_info?.dag_id}`);
  };

  const handleStatus = async (record: any, status: string, text?: string) => {
    try {
      await postOperatorStatus([
        {
          operator_id: record?.operator_id,
          status,
        },
      ]),
        message.success(text);
      fetchInfo?.();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ ...params, activeTab: OperatorTypeEnum.Operator }, microWidgetProps);
      }
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const handleDelete = async () => {
    try {
      await delOperator([
        {
          operator_id: record?.operator_id,
          version: record?.version,
        },
      ]);
      message.success('删除成功');
      fetchInfo?.();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };
  const closeModal = (val?: any) => {
    setIsFlowOpen(false);
    fetchInfo?.();
    const { status } = val;
    if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
      PublishedPermModal({ ...params, activeTab: OperatorTypeEnum.Operator }, microWidgetProps);
    }
  };
  const closeRunModal = () => {
    setIsRunFormOpen(false);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
  };

  const showDeleteConfirm = () => {
    confirmModal({
      title: '删除算子',
      content: '请确认是否删除此算子？',
      onOk() {
        handleDelete();
      },
      onCancel() {},
    });
  };

  const showOfflineConfirm = () => {
    confirmModal({
      title: '下架算子',
      content: '下架后，引用了该算子的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        handleStatus(record, OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  const resourceOperation = async () => {
    try {
      const data = await postResourceOperation({
        method: 'GET',
        resources: [
          {
            id: record?.operator_id,
            type: activeTab,
          },
        ],
      });
      setIsPermissionCheckInfo(data?.[0]?.operation);
    } catch (error: any) {
      console.error(error);
    }
  };

  // 跳转到ide编辑页面
  const handleEditInIDE = () => {
    navigate(`/ide/operator/${record?.operator_id}/edit`, {
      state: {
        from: location.pathname + location.search,
      },
    });
  };

  return (
    <>
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu>
            {permissionCheckInfo?.includes(PermConfigTypeEnum.View) && (
              <Menu.Item onClick={() => handlePreview(record, OperateTypeEnum.Edit)}>查看</Menu.Item>
            )}

            {record?.metadata_type === MetadataTypeEnum.Function &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
                <Menu.Item onClick={handleEditInIDE}>在IDE中编辑</Menu.Item>
              )}

            {record?.metadata_type === MetadataTypeEnum.OpenAPI &&
              record?.operator_info?.operator_type === OperatorInfoTypeEnum.Basic &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
                <Menu.Item onClick={() => setIsEditOpen(true)}>编辑</Menu.Item>
              )}
            {record?.operator_info?.operator_type !== OperatorInfoTypeEnum.Basic && (
              <>
                {permissionCheckInfo?.includes(PermConfigTypeEnum.Execute) && (
                  <Menu.Item onClick={() => handleRun()}>运行</Menu.Item>
                )}
                {permissionCheckInfo?.includes(PermConfigTypeEnum.View) && (
                  <Menu.Item onClick={() => logPreview(record)}>日志</Menu.Item>
                )}
              </>
            )}
            {record?.metadata_type === MetadataTypeEnum.OpenAPI &&
              record?.operator_info?.operator_type !== OperatorInfoTypeEnum.Basic &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
                <Menu.Item onClick={() => setIsFlowOpen(true)}>编辑</Menu.Item>
              )}
            {record?.status !== OperatorStatusType.Published &&
              permissionCheckInfo?.includes(PermConfigTypeEnum.Publish) && (
                <Menu.Item onClick={() => handleStatus(record, OperatorStatusType.Published, '发布成功')}>
                  发布
                </Menu.Item>
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
      {isFlowOpen && <OperatorFlowPanel closeModal={closeModal} selectoperator={record} />}
      {isRunFormOpen && <RunFormModal closeRunModal={closeRunModal} selectoperator={record} />}
      {isEditOpen && <EditOperatorModal closeModal={closeEditModal} operatorInfo={record} fetchInfo={fetchInfo} />}
    </>
  );
};

export default OperatorDropdown;
