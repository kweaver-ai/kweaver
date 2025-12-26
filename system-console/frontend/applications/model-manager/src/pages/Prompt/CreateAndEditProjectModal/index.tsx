import { useState } from 'react';
import intl from 'react-intl-universal';

import ENUMS from '@/enums';
import { Modal, Form, Input } from '@/common';

type CreateAndEditProjectModalProps = {
  open: boolean;
  type: 'create' | 'edit';
  sourceData: any;
  onOk: (type: 'create' | 'edit', values: any) => Promise<any>;
  onCancel: () => void;
};

const CreateAndEditProjectModal = (props: CreateAndEditProjectModalProps) => {
  const { open, type, sourceData, onOk: props_onOk, onCancel } = props;
  const [isFetching, setIsFetching] = useState(false);

  const [form] = Form.useForm();

  const onOk = () => {
    if (!props_onOk) return;
    form.validateFields().then(async values => {
      try {
        setIsFetching(true);
        if (type === 'edit') values.id = sourceData.id;
        await props_onOk(type, values);
        onCancel();
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <Modal open={open} width={480} title={intl.get('Prompt.modal.newGroup')} confirmLoading={isFetching} onCancel={onCancel} onOk={onOk}>
      <Form name='prompt-create-and-edit-project-modal-form' form={form} layout='vertical' initialValues={{ ...sourceData }}>
        <Form.Item
          name='name'
          label={intl.get('Prompt.modal.promptGroup')}
          rules={[
            { required: true, message: intl.get('global.cannotBeNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
          ]}
        >
          <Input.Spell style={{ width: '100%' }} placeholder={intl.get('global.pleaseEnter')} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default (props: CreateAndEditProjectModalProps) => (props.open ? <CreateAndEditProjectModal {...props} /> : null);
