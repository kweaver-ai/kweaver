import { Button } from 'antd';
import { useState } from 'react';
import CreateModal from '../Operator/CreateModal';
import OperatorFlowPanel from '../MyOperator/OperatorFlowPanel';
import CreateOperatorModal from '../Operator/CreateOperatorModal';
import ImportFailed from '../Tool/ImportFailed';
import { useMicroWidgetProps } from '@/hooks';
import { postResourceOperation } from '@/apis/authorization';
import { PlusOutlined } from '@ant-design/icons';
import { OperatorStatusType, OperatorTypeEnum, PermConfigTypeEnum } from '../OperatorList/types';
import { PublishedPermModal } from '../OperatorList/PublishedPermModal';

export default function CreateButton({ fetchInfo }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [openCreate, setOpenCreate] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [dataSourceError, setDataSourceError] = useState([]);

  const closeModal = () => {
    setOpenCreate(false);
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
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          setOpenCreate(true);
        }}
      >
        新建
      </Button>
      {openCreate && <CreateModal closeModal={closeModal} isModal={isModal} />}
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
