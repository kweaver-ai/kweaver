import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import ENUMS from '@/enums';
import { Form, Modal, Input } from '@/common';

const rulesConfig = (keys: string[], maxInput = 50) => {
  const rules = {
    required: { required: true, message: intl.get('global.cannotBeNull') },
    max: { max: maxInput, message: intl.get('global.lenErr', { len: maxInput }) },
    onlyKeyboard: { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
  };

  return _.map(keys, (key: string) => rules[key as keyof typeof rules]);
};

const MODAL_TITLE = { create: '新建评测数据', edit: '重命名' };

export type CreateAndEditModalProps = {
  open: boolean;
  type: 'create' | 'edit';
  sourceData: any;
  onOk: (values: any) => Promise<any>;
  onCancel: () => void;
};

const CreateAndEditModal = (props: CreateAndEditModalProps) => {
  const { open, type, sourceData = {} } = props;
  const { onOk: props_onOk, onCancel } = props;
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const [form] = Form.useForm();

  const onOk = () => {
    form.validateFields().then(async (_values: any) => {
      const values = _.mapValues(_.cloneDeep(_values), value => (typeof value !== 'string' ? value : value.trim()));
      setIsFetching(true);
      await props_onOk(values);
      setIsFetching(false);
    });
  };

  return (
    <Modal title={MODAL_TITLE[type]} open={open} onOk={onOk} onCancel={onCancel} confirmLoading={isFetching}>
      <Form
        name='evaluation-data-create-and-edit-form'
        form={form}
        colon={false}
        labelAlign='left'
        labelCol={{ span: type === 'create' ? 24 : 3 }}
        wrapperCol={{ span: type === 'create' ? 24 : 21 }}
        layout={type === 'create' ? 'vertical' : 'horizontal'}
        initialValues={{ ...sourceData }}
      >
        <Form.Item name='name' label='名称' rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}>
          <Input.Spell style={{ width: '100%' }} placeholder={intl.get('global.pleaseEnter')} />
        </Form.Item>
        {type === 'create' && (
          <Form.Item name='description' label='简介'>
            <Input.TextArea autoSize={{ minRows: 4 }} style={{ resize: 'none' }} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default (props: CreateAndEditModalProps) => (props.open ? <CreateAndEditModal {...props} /> : null);
