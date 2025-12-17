import type React from 'react';
import { Button, message, Modal } from 'antd';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import './style.less';
import {
  OperatorInfoTypeEnum,
  OperatorStatusType,
  OperatorTypeEnum,
  PermConfigShowType,
  PermConfigTypeEnum,
} from '../OperatorList/types';
import { useState } from 'react';
import { postOperatorStatus } from '@/apis/agent-operator-integration';
import EditOperatorModal from '../MyOperator/EditOperatorModal';
import OperatorFlowPanel from '../MyOperator/OperatorFlowPanel';
import PermConfigMenu from '../OperatorList/PermConfigMenu';
import { useMicroWidgetProps } from '@/hooks';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';
const { confirm } = Modal;

const OperatorDetailButton: React.FC<{
  detailInfo: any;
  fetchInfo: any;
  permissionCheckInfo: Array<PermConfigTypeEnum>;
}> = ({ detailInfo, fetchInfo, permissionCheckInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const microWidgetProps = useMicroWidgetProps();

  const changeBoxToolStatus = async (status: string, text: string) => {
    try {
      await postOperatorStatus([
        {
          operator_id: detailInfo?.operator_id,
          version: detailInfo?.version,
          status,
        },
      ]),
        fetchInfo({});
      message.success(text);
      if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
        PublishedPermModal({ record: detailInfo, activeTab: OperatorTypeEnum.Operator }, microWidgetProps);
      }
    } catch (error: any) {
    } finally {
      setButtonLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const closeFlowModal = (val?: any) => {
    setIsFlowOpen(false);
    fetchInfo?.();
    const { status } = val;
    if (status === OperatorStatusType.Published && permissionCheckInfo?.includes(PermConfigTypeEnum.Authorize)) {
      PublishedPermModal({ record: detailInfo, activeTab: OperatorTypeEnum.Operator }, microWidgetProps);
    }
  };

  const showOfflineConfirm = () => {
    confirm({
      title: '下架算子',
      getContainer: microWidgetProps?.container,
      icon: <ExclamationCircleFilled />,
      content: '下架后，引用了该算子的智能体或工作流会失效，此操作不可撤回。',
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
          params={{ record: detailInfo, activeTab: OperatorTypeEnum.Operator }}
          type={PermConfigShowType.Button}
        />
      )}
      {detailInfo?.operator_info?.operator_type === OperatorInfoTypeEnum.Basic ? (
        <>
          {permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
            <Button onClick={() => setIsOpen(true)}>编辑</Button>
          )}
        </>
      ) : (
        <>
          {permissionCheckInfo?.includes(PermConfigTypeEnum.Modify) && (
            <Button onClick={() => setIsFlowOpen(true)}>编辑</Button>
          )}
        </>
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
      {isOpen && <EditOperatorModal closeModal={closeModal} operatorInfo={detailInfo} fetchInfo={fetchInfo} />}
      {isFlowOpen && <OperatorFlowPanel closeModal={closeFlowModal} selectoperator={detailInfo} />}
    </>
  );
};

export default OperatorDetailButton;
