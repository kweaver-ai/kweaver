import { Modal, Button, message, Form, Select } from 'antd';
import { convertTool, getOperatorMarketList } from '@/apis/agent-operator-integration';
import { useMicroWidgetProps } from '@/hooks';
import { useEffect, useState } from 'react';
import { OperatorStatusType } from '../OperatorList/types';

export default function OperatorImport({ closeModal, toolBoxInfo, getFetchTool }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [form] = Form.useForm();
  const [operatorList, setOperatorList] = useState<any>([]);
  const [selectOperator, setSelectOperator] = useState<any>({});
  const handleCancel = () => {
    closeModal?.();
  };
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await getOperatorMarketList({
          page: 1,
          page_size: -1,
          status: OperatorStatusType.Published,
          metadata_type: toolBoxInfo.metadata_type,
        });
        setOperatorList(data);
      } catch (error: any) {
        console.error(error);
      }
    };
    fetchConfig();
  }, []);

  const onFinish = async (values: any) => {
    try {
      await convertTool({ ...selectOperator, box_id: toolBoxInfo.box_id });
      message.success('导入成功');
      getFetchTool?.();
      handleCancel();
    } catch (error: any) {
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const handleSelectChange = (value: string) => {
    const item = operatorList.find((item: any) => item.operator_id === value);
    setSelectOperator({
      operator_id: value,
      operator_version: item.version,
    });
  };

  return (
    <Modal
      title="算子导入工具"
      centered
      maskClosable={false}
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={660}
      getContainer={() => microWidgetProps.container}
    >
      <Form form={form} onFinish={onFinish} style={{ marginTop: '30px' }}>
        <Form.Item label="选择算子" name="operator" rules={[{ required: true, message: '请选择算子' }]}>
          <Select onChange={handleSelectChange}>
            {operatorList?.map((item: any) => (
              <Select.Option key={item.operator_id} value={item.operator_id}>
                {item.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item noStyle>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit" className="dip-mr-8 dip-w-74">
              确定
            </Button>
            <Button className="dip-w-74" onClick={() => closeModal?.()}>
              取消
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
