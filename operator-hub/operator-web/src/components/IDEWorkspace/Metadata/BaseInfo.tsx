import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Form, Input, InputNumber, Checkbox } from 'antd';
import { validateName } from '@/utils/validators';
import { OperatorTypeEnum } from '@/components/OperatorList/types';

interface BaseInfoProps {
  operatorType: OperatorTypeEnum.Tool | OperatorTypeEnum.Operator; // 算子类型：工具 or 算子
  value: {
    name?: string;
    description?: string;
    use_rule?: string;
    operator_execute_control?: { timeout?: number };
    operator_info?: { is_data_source?: boolean };
  };
  onChange: (value: {
    name: string;
    description: string;
    use_rule: string;
    operator_execute_control?: { timeout?: number };
    operator_info?: { is_data_source?: boolean };
  }) => void;
}

const prefixLabel = {
  [OperatorTypeEnum.Tool]: '工具',
  [OperatorTypeEnum.Operator]: '算子',
};

const BaseInfo = forwardRef(({ operatorType, value, onChange }: BaseInfoProps, ref) => {
  const [form] = Form.useForm();

  const validate = async () => {
    try {
      await form.validateFields();
      return true;
    } catch {
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    validate,
  }));

  useEffect(() => {
    // 当value更新时，更新form的值
    form.setFieldsValue({
      name: value.name || '',
      description: value.description || '',
      use_rule: value.use_rule || '',
      operator_info: value.operator_info,
      operator_execute_control: value.operator_execute_control,
    });
  }, [value, form]);

  return (
    <Form
      form={form}
      labelAlign="left"
      colon={false}
      labelCol={{ style: { width: '140px' } }}
      autoComplete="off"
      onValuesChange={onChange}
    >
      <Form.Item
        required
        name="name"
        label={`${prefixLabel[operatorType]}名称`}
        rules={[
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.reject('请输入名称');
              }

              if (!validateName(value, true)) {
                return Promise.reject('仅支持输入中文、字母、数字、下划线');
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input placeholder="请输入" showCount maxLength={50} />
      </Form.Item>

      <Form.Item
        name="description"
        label={`${prefixLabel[operatorType]}描述`}
        rules={[{ required: true, message: '请输入描述' }]}
      >
        <Input.TextArea rows={4} maxLength={255} placeholder="请输入" />
      </Form.Item>

      {operatorType === OperatorTypeEnum.Tool && (
        <Form.Item name="use_rule" label={`工具规则`}>
          <Input.TextArea rows={4} maxLength={255} placeholder="请输入" />
        </Form.Item>
      )}

      {operatorType === OperatorTypeEnum.Operator && (
        <>
          <Form.Item
            label="超时时间(ms)"
            name={['operator_execute_control', 'timeout']}
            rules={[
              { required: true, message: '请输入超时时间' },
              { type: 'integer', min: 1, message: '超时时间必须为大于0的整数' },
            ]}
          >
            <InputNumber placeholder={`请输入`} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="发布设置" name={['operator_info', 'is_data_source']} valuePropName="checked">
            <Checkbox>是否为dataFlow数据源算子</Checkbox>
          </Form.Item>
        </>
      )}
    </Form>
  );
});

export default BaseInfo;
