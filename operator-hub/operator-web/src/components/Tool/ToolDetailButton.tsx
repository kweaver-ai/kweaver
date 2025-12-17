import type React from 'react';
import { Button, message, Modal } from 'antd';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import './style.less';
import { boxToolStatus } from '@/apis/agent-operator-integration';
import { OperatorStatusType, OperatorTypeEnum, PermConfigShowType, PermConfigTypeEnum } from '../OperatorList/types';
import { useState } from 'react';
import CreateToolModal from './CreateToolBoxModal';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
import { useMicroWidgetProps } from '@/hooks';
const { confirm } = Modal;

const ToolDetailButton: React.FC<{
  detailInfo: any;
  fetchInfo: any;
  permissionCheckInfo: Array<PermConfigTypeEnum>;
}> = ({ detailInfo, fetchInfo, permissionCheckInfo }) => {
  const [createToolOpen, setCreateToolOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const microWidgetProps = useMicroWidgetProps();

  const closeToolModal = () => {
    setCreateToolOpen(false);
  };

  const changeBoxToolStatus = async (status: string, text: string) => {
    setButtonLoading(true);
    try {
      await boxToolStatus(detailInfo?.box_id, {
        status,
      });
      message.success(text);
      fetchInfo();
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ record: detailInfo, activeTab: OperatorTypeEnum.ToolBox }, microWidgetProps);
      }
    } catch (error: any) {
      message.error(error?.description);
    } finally {
      setButtonLoading(false);
    }
  };

  const showOfflineConfirm = () => {
    confirm({
      title: '下架工具',
      getContainer: microWidgetProps?.container,
      icon: <ExclamationCircleFilled />,
      content: '下架后，引用了该工具的智能体或工作流会失效，此操作不可撤回。',
      onOk() {
        changeBoxToolStatus(OperatorStatusType.Offline, '下架成功');
      },
      onCancel() {},
    });
  };

  return (
    <>
      {/* <Button icon={<EllipsisOutlined />} /> */}
      {permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize) && (
        <PermConfigMenu
          params={{ record: detailInfo, activeTab: OperatorTypeEnum.ToolBox }}
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
            loading={buttonLoading}
            onClick={() => changeBoxToolStatus(OperatorStatusType.Published, '发布成功')}
          >
            发布
          </Button>
        )}
      {detailInfo?.status === OperatorStatusType.Published &&
        permissionCheckInfo?.includes(PermConfigTypeEnum.Unpublish) && (
          <Button color="danger" variant="filled" loading={buttonLoading} onClick={showOfflineConfirm}>
            下架
          </Button>
        )}
      {createToolOpen && <CreateToolModal closeModal={closeToolModal} toolBoxInfo={detailInfo} fetchInfo={fetchInfo} />}
    </>
  );
};

export default ToolDetailButton;
