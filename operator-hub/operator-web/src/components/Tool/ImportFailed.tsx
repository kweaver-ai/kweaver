import { Modal, Table } from 'antd';
import { useMicroWidgetProps } from '@/hooks';

export default function ImportFailed({ closeModal, dataSource }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const columns = [
    {
      title: '名称',
      dataIndex: 'tool_name',
      key: 'tool_name',
    },
    {
      title: '失败原因',
      dataIndex: 'error_msg',
      key: 'description',
      render: (errorMsg: any) => errorMsg?.description,
    },
  ];
  const handleCancel = () => {
    closeModal?.([]);
  };

  return (
    <Modal
      title="导入失败列表"
      centered
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={800}
      getContainer={() => microWidgetProps.container}
      maskClosable={false}
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        size="small"
        style={{ wordBreak: 'break-all', margin: '20px 0' }}
      />
    </Modal>
  );
}
