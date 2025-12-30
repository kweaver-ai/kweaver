import { useEffect, useState } from 'react';
import { Modal, Button, Space, Form, Input, InputNumber, message } from 'antd';
import { postExecutions, getDags } from '@/apis/automation';
import { useMicroWidgetProps } from '@/hooks';

const { TextArea } = Input;
export default function RunFormModal({ closeRunModal, selectoperator }: any) {
  const microWidgetProps = useMicroWidgetProps();
  const [fields, setFields] = useState<any>([]);
  const [form] = Form.useForm();
  const handleCancel = () => {
    closeRunModal?.();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getDags(selectoperator?.extend_info?.dag_id);
        const step = data?.steps?.[0]?.parameters?.fields;
        setFields(step);
      } catch (error: any) {
        if (error?.description) {
          message.error(error?.description);
        }
      }
    };
    fetchConfig();
  }, []);

  const executionsRun = async (data: any) => {
    closeRunModal?.();
    // message.info(`[${selectoperator?.operator_name}] 算子运行中...`, 0);
    try {
      await postExecutions(selectoperator?.extend_info?.dag_id, {
        ...data,
      });
      message.destroy();
      message.info('开始运行...');
    } catch (error: any) {
      message.destroy();
      if (error?.description) {
        message.error(error?.description);
      }
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'string':
        return <Input placeholder={`请输入`} />;
      case 'number':
        return <InputNumber placeholder={`请输入`} style={{ width: '100%' }} />;
      case 'array':
      case 'object':
        return <TextArea placeholder={`请输入`} rows={4} />;
      default:
        return null;
    }
  };

  // 提交表单时处理数据
  const onFinish = (values: any) => {
    const processedValues: any = { ...values };
    fields?.forEach((field: any) => {
      if (field.type === 'array' && processedValues[field.key]) {
        processedValues[field.key] = JSON.parse(processedValues[field.key]);
      } else if (field.type === 'object' && processedValues[field.key]) {
        processedValues[field.key] = JSON.parse(processedValues[field.key]);
      }
    });

    executionsRun(processedValues);
  };

  return (
    <Modal
      title="算子运行"
      centered
      open={true}
      onCancel={handleCancel}
      footer={null}
      width={600}
      getContainer={() => microWidgetProps.container}
      maskClosable={false}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {fields?.map((field: any, index: any) => (
          <Form.Item
            key={index}
            name={field.key}
            initialValue={field.default}
            label={
              <div>
                {field.name}
                <span style={{ fontSize: '12px', color: '#c0c0c0', marginLeft: '8px' }}>{field.type}</span>
              </div>
            }
            rules={[
              {
                required: field?.required,
                message: '请输入内容',
              },
            ]}
          >
            {renderField(field)}
          </Form.Item>
        ))}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button type="primary" htmlType="submit" className="dip-w-74">
              确定
            </Button>
            <Button className="dip-w-74" onClick={handleCancel}>
              取消
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
