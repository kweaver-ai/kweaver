import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import ENUMS from '@/enums';
import { Form, Modal, Input } from '@/common';

const MODAL_TITLE: any = { create: '新建版本', edit: '编辑' };

export type CreateAndEditModalProps = {
  open: boolean;
  type: 'create' | 'edit';
  sourceData: any;
  onOk: (type: 'create' | 'edit', values: any) => Promise<any>;
  onCancel: () => void;
};

const rulesConfig = (keys: string[], maxInput = 50) => {
  const rules = {
    required: { required: true, message: intl.get('global.cannotBeNull') },
    max: { max: maxInput, message: intl.get('global.lenErr', { len: maxInput }) },
    onlyKeyboard: { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
  };

  return _.map(keys, (key: string) => rules[key as keyof typeof rules]);
};

/** 创建和编辑弹窗 */
const CreateVersionModal = (props: CreateAndEditModalProps) => {
  const { open, type, sourceData = {} } = props;
  const { onOk: props_onOk, onCancel } = props;
  const [isFetching, setIsFetching] = useState(false);

  const [form] = Form.useForm();

  const constructValues = (_values: any) => {
    const values = _.mapValues(_.cloneDeep(_values), value => (typeof value !== 'string' ? value : value.trim()));
    const { name, description } = values;

    const result: any = { name, description };

    return result;
  };

  const onOk = () => {
    if (!props_onOk) return;
    form.validateFields().then(async _values => {
      const postData = constructValues(_values);
      try {
        setIsFetching(true);
        if (type === 'edit') postData.model_id = sourceData.model_id;
        await props_onOk(type, postData);
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <Modal open={open} width={640} title={MODAL_TITLE[type]} confirmLoading={isFetching} onOk={onOk} onCancel={onCancel}>
      <Form form={form} colon={false} layout='vertical' initialValues={{ ...sourceData }}>
        <Form.ViewOrEditItem name='name' label='名称' rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}>
          <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
        </Form.ViewOrEditItem>

        <Form.ViewOrEditItem name='description' label='描述' rules={rulesConfig(['max'], 150)}>
          <Input.TextArea autoSize={{ minRows: 4 }} style={{ resize: 'none' }} />
        </Form.ViewOrEditItem>
      </Form>
    </Modal>
  );
};

export default (props: CreateAndEditModalProps) => (props.open ? <CreateVersionModal {...props} /> : null);
