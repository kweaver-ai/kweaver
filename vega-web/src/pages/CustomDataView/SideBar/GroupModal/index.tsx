import React from 'react';
import intl from 'react-intl-universal';
import { Modal, Form, Input } from 'antd';
import { FORM_LAYOUT } from '@/hooks/useConstants';
import styles from './index.module.less';

interface Props {
  visible: boolean;
  title: string;
  onOk: (values: { name: string }) => void;
  onCancel: () => void;
  initialValue?: string;
}

export const GroupModal: React.FC<Props> = ({ visible, title, onOk, onCancel, initialValue = '' }) => {
  const [form] = Form.useForm();

  // 当visible状态改变时，重置表单
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({ name: initialValue });
    } else {
      form.resetFields();
    }
  }, [visible, initialValue, form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.validateFields().then((values) => {
      onOk(values);
    });
  };

  return (
    <Modal
      title={title}
      width={536}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      maskClosable={false}
      footer={(_, { OkBtn, CancelBtn }) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      )}
    >
      <div className={styles.modalContent}>
        <Form form={form} {...FORM_LAYOUT}>
          <Form.Item name="name" label={intl.get('Global.groupName')} rules={[{ required: true, message: intl.get('Global.pleaseInputGroupName') }]}>
            <Input placeholder={intl.get('Global.pleaseInputGroupName')} maxLength={40} showCount />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
