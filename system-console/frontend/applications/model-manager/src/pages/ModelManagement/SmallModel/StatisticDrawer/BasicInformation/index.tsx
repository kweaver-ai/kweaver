import { useState } from 'react';
import _ from 'lodash';

import { Form, Button } from '@/common';
import CreateAndEditForm from '../../CreateAndEditForm';

export type CreateAndEditModalProps = {
  sourceData: any;
  onOk: (type: 'create' | 'edit' | 'view', values: any) => Promise<any>;
  onTest: (values: any, notMessage?: boolean) => Promise<any>;
};

/** 基础信息 */
const BasicInformation = (props: CreateAndEditModalProps) => {
  const { sourceData = {} } = props;
  const { onOk: props_onOk, onTest: props_onTest } = props;
  const [isFetching, setIsFetching] = useState(false);

  const [form] = Form.useForm();
  const [modalType, setModalType] = useState<'edit' | 'view'>('view');

  const onToEdit = () => setModalType('edit');
  const onToView = () => {
    form.resetFields(['model_name']);
    setModalType('view');
  };
  const constructValues = (_values: any) => {
    const values = _.mapValues(_.cloneDeep(_values), value => (typeof value !== 'string' ? value : value.trim()));
    const { model_name, model_type, api_model, api_url, api_key, adapter, adapter_code } = values;

    const model_config: any = { api_model, api_url };
    if (api_key) model_config.api_key = api_key;

    const result: any = { model_name, model_type, model_id: sourceData.model_id };
    if (adapter) {
      result.adapter = true;
      result.adapter_code = adapter_code || '';
    } else {
      result.model_config = model_config;
    }

    return result;
  };

  const onOk = () => {
    if (!props_onOk || !props_onTest) return;
    form.validateFields().then(async _values => {
      const postData = constructValues(_values);

      try {
        setIsFetching(true);
        const testResult = await props_onTest(sourceData?.model_id ? { model_id: sourceData?.model_id } : postData, true);
        if (testResult === 'ok') await props_onOk(modalType, postData);
        setModalType('view');
      } finally {
        setIsFetching(false);
      }
    });
  };

  return (
    <div>
      <CreateAndEditForm form={form} type={modalType} sourceData={sourceData} onToEdit={onToEdit} />
      {modalType === 'edit' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button key='save' type='primary' disabled={isFetching} loading={isFetching} onClick={onOk}>
            保存
          </Button>
          <Button className='g-ml-2' key='cancel' disabled={isFetching} onClick={onToView}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
};

export default BasicInformation;
