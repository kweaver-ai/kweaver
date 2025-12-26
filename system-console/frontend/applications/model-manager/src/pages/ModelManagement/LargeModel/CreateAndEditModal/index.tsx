import { useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import { Button, Form, Modal } from '@/common';
import { MODAL_TITLE } from '../enums';
import CreateAndEditForm from '../CreateAndEditForm';

export type CreateAndEditModalProps = {
  open: boolean;
  type: 'create' | 'edit' | 'view';
  sourceData: any;
  onOk: (type: 'create' | 'edit' | 'view', values: any) => Promise<any>;
  onTest: (values: any, notMessage?: boolean) => Promise<any>;
  onCancel: () => void;
};

/** 创建和编辑弹窗 */
const CreateAndEditModal = (props: CreateAndEditModalProps) => {
  const { open, type, sourceData = {} } = props;
  const { onOk: props_onOk, onTest: props_onTest, onCancel } = props;
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [form] = Form.useForm();
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>(type);

  const onToEdit = () => setModalType('edit');

  const constructValues = (_values: any) => {
    const values = _.mapValues(_.cloneDeep(_values), value => (typeof value !== 'string' ? value : value.trim()));
    const { model_name, model_series, max_model_len, model_parameters, model_type, api_model, api_url, api_key, secret_key, quota } = values;

    const model_config: any = { api_model, api_url };
    if (api_key) model_config.api_key = api_key;
    if (secret_key) model_config.secret_key = secret_key;

    const result: any = { model_config, model_name, model_series, max_model_len, model_type, quota: quota || false };
    if (model_parameters) result.model_parameters = model_parameters;

    if (api_key !== sourceData?.api_key || !sourceData) result.change = true;
    if (sourceData?.model_id) result.model_id = sourceData.model_id;

    return result;
  };

  const onTest = () => {
    if (!props_onTest) return;
    form.validateFields().then(async _values => {
      const postData = constructValues(_values);

      try {
        setIsTesting(true);
        await props_onTest(postData);
      } finally {
        setIsTesting(false);
      }
    });
  };

  const onOk = () => {
    if (!props_onOk || !props_onTest) return;
    form.validateFields().then(async _values => {
      const postData = constructValues(_values);

      try {
        setIsFetching(true);
        const testResult = await props_onTest(postData, true);
        if (modalType === 'edit') postData.model_id = sourceData.model_id;
        if (testResult === 'ok') await props_onOk(modalType, postData);
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <Modal
      open={open}
      width={640}
      title={MODAL_TITLE[modalType]}
      onCancel={onCancel}
      footer={
        modalType === 'view' ? (
          <Button loading={isTesting} onClick={onTest}>
            {intl.get('ModelManagement.modal.testConnection')}
          </Button>
        ) : (
          [
            <Button key='save' type='primary' disabled={isTesting} loading={isFetching} onClick={onOk}>
              {intl.get('ModelManagement.modal.save')}
            </Button>,
            <Button key='test' disabled={isFetching} loading={isTesting} onClick={onTest}>
              {intl.get('ModelManagement.modal.testConnection')}
            </Button>,
            <Button key='cancel' onClick={onCancel}>
              {intl.get('ModelManagement.modal.cancel')}
            </Button>,
          ]
        )
      }
    >
      <CreateAndEditForm form={form} type={modalType} sourceData={sourceData} onToEdit={onToEdit} />
    </Modal>
  );
};

export default (props: CreateAndEditModalProps) => (props.open ? <CreateAndEditModal {...props} /> : null);
