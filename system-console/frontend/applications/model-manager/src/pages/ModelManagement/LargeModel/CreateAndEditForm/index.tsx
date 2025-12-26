import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Divider, InputNumber, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import { Button, Form, Input, Select } from '@/common';
import { MODEL_TYPE_OPTIONS, AUTH_OPTIONS } from '../enums';

const AUTH_OPTIONS_KV = _.keyBy(AUTH_OPTIONS, 'value');
const MODEL_TYPE_OPTIONS_KV = _.keyBy(MODEL_TYPE_OPTIONS, 'value');
const MODEL_ICON_LIST_KV = _.keyBy(ENUMS.MODEL_ICON_LIST, 'value');

const rulesConfig = (keys: string[], maxInput = 50) => {
  const rules = {
    required: { required: true, message: intl.get('global.cannotBeNull') },
    max: { max: maxInput, message: intl.get('global.lenErr', { len: maxInput }) },
    onlyKeyboard: { pattern: ENUMS.REGEXP.ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
  };

  return _.map(keys, (key: string) => rules[key as keyof typeof rules]);
};

export type CreateAndEditFormProps = {
  form: any;
  type: 'create' | 'edit' | 'view';
  sourceData: any;
  onToEdit: () => void;
};

const unitSuffix = (unit: string) => (
  <div className='g-ml-2 g-flex-align-center'>
    <Divider type='vertical' style={{ height: 12, marginRight: 12, borderColor: '#e5e5e5' }} />
    <div style={{ fontWeight: 400 }}>{unit}</div>
  </div>
);

/** 创建和编辑弹窗 */
const CreateAndEditForm = (props: CreateAndEditFormProps) => {
  const { form, type, sourceData = {}, onToEdit } = props;
  const { baseProps } = HOOKS.useGlobalContext();
  const isAdmin = baseProps?.username === 'admin';

  const authValue = Form.useWatch('auth', form);

  const isView = type === 'view';
  const isViewOrEdit = type === 'view' || type === 'edit';

  return (
    <Form
      name='large-model-create-and-edit-form'
      form={form}
      labelAlign='left'
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 19 }}
      colon={type === 'view'}
      initialValues={{
        model_type: 'llm',
        auth: sourceData?.api_key ? 'auth' : sourceData?.secret_key ? 'dual_key' : 'empty',
        ...sourceData,
      }}
    >
      <Form.ViewOrEditItem
        name='model_name'
        label={intl.get('ModelManagement.modal.modelName')}
        view={isView}
        viewRender={value => (
          <div className='g-flex-align-center' title={value}>
            <div className='g-ellipsis-1'>{value}</div>
            <Button.Icon className='g-ml-2' icon={<EditOutlined title='编辑' />} onClick={onToEdit} />
          </div>
        )}
        rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}
      >
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='model_series'
        label={intl.get('ModelManagement.modal.baseModel')}
        view={isView}
        rules={rulesConfig(['required'])}
        viewRender={fieldValue => {
          const item = MODEL_ICON_LIST_KV[fieldValue];
          return (
            <div className='g-flex-align-center' title={item.label}>
              <img src={item?.icon} className='g-mr-2' style={{ width: 20, height: 20 }} />
              <div className='g-ellipsis-1'>{item.label}</div>
            </div>
          );
        }}
      >
        <Select
          placeholder={intl.get('global.pleaseSelect')}
          getPopupContainer={triggerNode => triggerNode.parentNode}
          options={_.map(ENUMS.MODEL_ICON_LIST, item => ({
            label: (
              <div className='g-pt-1 g-pb-1 g-flex-align-center'>
                <img src={item?.icon} className='g-mr-2' style={{ width: 20, height: 20 }} />
                {item.label}
              </div>
            ),
            value: item.value,
          }))}
        />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='model_type'
        label={intl.get('ModelManagement.modal.modelType')}
        view={isView}
        rules={rulesConfig(['required'])}
        getFieldValue={fieldValue => MODEL_TYPE_OPTIONS_KV[fieldValue]?.label}
      >
        <Select options={MODEL_TYPE_OPTIONS} getPopupContainer={triggerNode => triggerNode.parentNode} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem name='api_model' label='API Model' view={isView} rules={rulesConfig(['required', 'max', 'onlyKeyboard'])}>
        <Input.Spell placeholder={`${intl.get('global.pleaseEnter')}${intl.get('ModelManagement.modal.attentionUppercaseAndLowercase')}`} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='api_url'
        label='API URL'
        view={isView}
        viewRender={value => (
          <div className='g-w-90 g-flex-align-center' title={value}>
            <div className='g-ellipsis-1 '>{value}</div>
            <Button.Copy style={{ top: 0, right: 0 }} copyText={value} />
          </div>
        )}
        rules={rulesConfig(['required', 'max', 'onlyKeyboard'], 400)}
      >
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='auth'
        label={intl.get('ModelManagement.modal.auth')}
        view={isView}
        rules={rulesConfig(['required'])}
        getFieldValue={fieldValue => AUTH_OPTIONS_KV[fieldValue]?.label}
      >
        <Select options={AUTH_OPTIONS} getPopupContainer={triggerNode => triggerNode.parentNode} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem name='api_key' label='API Key' view={isView} isVisible={authValue === 'auth'} rules={rulesConfig(['required', 'onlyKeyboard'])}>
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='secret_key'
        label='Secret Key'
        view={isView}
        isVisible={authValue === 'dual_key'}
        rules={rulesConfig(['required', 'onlyKeyboard'])}
      >
        <Input.Spell placeholder={intl.get('global.pleaseEnter')} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='max_model_len'
        label={intl.get('ModelManagement.modal.maximumContext')}
        view={isView}
        viewRender={value => (
          <div className='g-flex-align-center'>
            <div className='g-ellipsis-1'>{value}</div>
            K
            <Button.Icon className='g-ml-2' icon={<EditOutlined title={intl.get('global.edit')} />} onClick={onToEdit} />
          </div>
        )}
        rules={rulesConfig(['required'])}
      >
        <InputNumber className='g-w-100' controls={false} placeholder={intl.get('global.pleaseEnter')} suffix={unitSuffix('K')} />
      </Form.ViewOrEditItem>

      <Form.ViewOrEditItem
        name='model_parameters'
        label={intl.get('ModelManagement.modal.parameterQuantity')}
        view={isView}
        viewRender={value => (
          <div className='g-flex-align-center'>
            <div className='g-ellipsis-1'>{value}</div> B
            <Button.Icon className='g-ml-2' icon={<EditOutlined title={intl.get('global.edit')} />} onClick={onToEdit} />
          </div>
        )}
      >
        <InputNumber className='g-w-100' controls={false} placeholder={intl.get('global.pleaseEnter')} suffix={unitSuffix('B')} />
      </Form.ViewOrEditItem>

      {isAdmin && (
        <React.Fragment>
          <Form.ViewOrEditItem
            name='quota'
            label={intl.get('ModelManagement.modal.quotaTitle')}
            view={isView}
            valuePropName='checked'
            viewRender={value => (
              <div className='g-flex-align-center'>
                <Switch value={value} disabled={true} />
              </div>
            )}
          >
            <Switch />
          </Form.ViewOrEditItem>
          <div className='ad-mb-6' style={{ marginTop: -12 }}>
            {intl.get('ModelManagement.modal.quotaTitleDescribe1')}
          </div>
          <div className='ad-mb-6'>
            {isViewOrEdit ? intl.get('ModelManagement.modal.quotaTitleDescribe2_') : intl.get('ModelManagement.modal.quotaTitleDescribe2')}
          </div>
        </React.Fragment>
      )}
    </Form>
  );
};

export default CreateAndEditForm;
