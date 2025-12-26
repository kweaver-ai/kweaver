import React, { useEffect, useState } from 'react';
import { Form, message } from 'antd';
import intl from 'react-intl-universal';
import { ONLY_KEYBOARD } from '@/enums';
import TrimmedInput from '@/components/TrimmedInput';
import AdIconList from '@/components/AdIconList';
import { editIndicator } from '@/services/benchmark';
import UniversalModal from '@/components/UniversalModal';

const FormItem = Form.Item;
const EditIndicator = ({ onClose, refresh, editData }: any) => {
  const prefixLocale = 'benchmark.indicator';
  const [nameFieldValidate, setNameFieldValidate] = useState({
    status: undefined as any,
    help: undefined as any,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        name: editData.name,
        color: editData.color,
      });
    }
  }, [editData]);

  const formFinish = async (values: any) => {
    const data = await editIndicator({
      id: editData.id,
      ...values,
    });
    if (data) {
      message.success(intl.get('global.saveSuccess'));
      onClose();
      refresh();
    } else {
      setNameFieldValidate({
        status: 'error',
        help: intl.get('global.repeatName'),
      });
    }
  };
  return (
    <UniversalModal
      visible
      width={640}
      title={intl.get(`${prefixLocale}.editIndicator`)}
      footerData={[
        {
          label: intl.get('global.cancel'),
          onHandle: () => {
            onClose();
          },
        },
        {
          label: intl.get('global.ok'),
          type: 'primary',
          onHandle: () => {
            form.submit();
          },
        },
      ]}
      onCancel={() => {
        onClose();
      }}
    >
      <Form form={form} layout='vertical' onFinish={formFinish}>
        <FormItem
          name='name'
          label={intl.get(`${prefixLocale}.name`)}
          rules={[
            {
              required: true,
              message: intl.get('global.noNull'),
            },
            {
              pattern: ONLY_KEYBOARD,
              message: intl.get('global.onlyKeyboard'),
            },
            {
              max: 50,
              message: intl.get('global.lenErr', { len: 50 }),
            },
          ]}
          validateStatus={nameFieldValidate.status}
          help={nameFieldValidate.help}
        >
          <TrimmedInput
            placeholder={intl.get(`${prefixLocale}.namePlaceholder`)}
            autoComplete='off'
            aria-autocomplete='none'
            onChange={() => {
              if (nameFieldValidate.status === 'error') {
                setNameFieldValidate({
                  status: undefined,
                  help: undefined,
                });
              }
            }}
          />
        </FormItem>
        <FormItem
          label={intl.get('global.color')}
          name='color'
          rules={[
            {
              required: true,
              message: intl.get('global.noNull'),
            },
          ]}
          initialValue='icon-color-zbk-126EE3'
        >
          <AdIconList
            iconList={[
              'icon-color-zbk-FADB14',
              'icon-color-zbk-FF8501',
              'icon-color-zbk-F759AB',
              'icon-color-zbk-F75959',
              'icon-color-zbk-9254DE',
              'icon-color-zbk-126EE3',
              'icon-color-zbk-019688',
              'icon-color-zbk-13C2C2',
              'icon-color-zbk-52C41A',
              'icon-color-zbk-8C8C8C',
            ]}
          />
        </FormItem>
      </Form>
    </UniversalModal>
  );
};

export default ({ visible, ...restProps }: any) => {
  return visible && <EditIndicator {...restProps} />;
};
