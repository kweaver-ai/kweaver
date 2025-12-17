import { Modal } from 'antd';
import { useMicroWidgetProps } from '@/hooks';

export default function CreateModal({ isModal, closeModal }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const dataList: any = [
    {
      name: '上传本地JSON/YAML文件',
      description: '上传已开发好的本地JSON/ML文件',
      type: '1',
    },
    {
      name: '在流程编辑器中编排',
      description: '使用流程编辑器在线快速编排',
      type: '2',
    },
  ];

  const handleCancel = () => {
    closeModal?.();
  };
  const createOperator = (item: any) => {
    isModal?.({ type: item.type, open: true });
  };

  return (
    <Modal
      title="新建算子"
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={600}
      getContainer={() => microWidgetProps.container}
    >
      <ul className="operator-create-modal">
        {dataList?.map((item: any) => (
          <li onClick={() => createOperator(item)}>
            <div className="operator-create-modal-title">
              <div className="operator-create-modal-name">{item?.name}</div>
              <div>{item?.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
