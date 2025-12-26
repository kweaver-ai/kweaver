import { useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import ENUMS from '@/enums';
import { Modal, Form, Input, MonacoEditor } from '@/common';

type CreateAndEditPromptModalProps = {
  open: boolean;
  type: 'create' | 'edit';
  sourceData: any;
  onOk: (type: 'create' | 'edit', values: any) => Promise<any>;
  onCancel: () => void;
};

const CreateAndEditPromptModal = (props: CreateAndEditPromptModalProps) => {
  const { open, type, sourceData, onOk: props_onOk, onCancel } = props;
  const monacoRef = useRef<any>(null);

  const [isFetching, setIsFetching] = useState(false);

  const [form] = Form.useForm();

  const onOk = () => {
    if (!props_onOk) return;
    form.validateFields().then(async values => {
      try {
        setIsFetching(true);
        if (type === 'edit') values.id = sourceData.id;
        const variables = monacoRef.current.getVariables();
        values.variables = _.map(variables, item => {
          return { field_name: item, var_name: item, field_type: 'textarea', optional: false };
        });
        // console.log('获取变量', monacoRef.current.getVariables());
        await props_onOk(type, values);
        onCancel();
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <Modal
      open={open}
      width={800}
      title={type === 'create' ? intl.get('Prompt.modal.newPrompt') : intl.get('Prompt.modal.editPrompt')}
      confirmLoading={isFetching}
      onCancel={onCancel}
      onOk={onOk}
    >
      <Form name='prompt-create-and-edit-prompt-modal-form' form={form} layout='vertical' initialValues={{ ...sourceData }}>
        <Form.Item
          name='name'
          label={intl.get('Prompt.modal.promptName')}
          rules={[
            { required: true, message: intl.get('global.cannotBeNull') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
          ]}
        >
          <Input.Spell style={{ width: '100%' }} placeholder={intl.get('global.pleaseEnter')} />
        </Form.Item>
        <Form.Item name='messages' label={intl.get('Prompt.modal.prompt')} rules={[{ required: true, message: intl.get('global.cannotBeNull') }]}>
          <MonacoEditor.Prompt ref={monacoRef} width={750} height={300} placeholder={intl.get('global.pleaseEnter')} options={{ border: true }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default (props: CreateAndEditPromptModalProps) => (props.open ? <CreateAndEditPromptModal {...props} /> : null);
