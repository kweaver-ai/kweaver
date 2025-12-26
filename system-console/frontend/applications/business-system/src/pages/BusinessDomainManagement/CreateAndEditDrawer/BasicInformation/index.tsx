import { useUpdateLayoutEffect } from 'ahooks';
import intl from 'react-intl-universal';
import { Form } from 'antd';

import ENUMS from '@/enums';
import { Input, Select } from '@/common';

const BasicInformation = (props: any) => {
  const { form, values, errorData, onChangeError } = props;

  useUpdateLayoutEffect(() => {
    form.validateFields();
  }, [errorData?.name]);

  return (
    <div>
      <Form form={form} layout='vertical' initialValues={{ products: ['dip'], ...values.current }}>
        <Form.Item
          label={intl.get('businessDomain.drawer.businessDomainName')}
          name='name'
          rules={[
            { required: true, message: intl.get('businessDomain.drawer.pleaseEnterTheBusinessDomainName') },
            { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
            {
              pattern: ENUMS.REGEXP.EXCLUDE_CHARACTERS,
              message: `${intl.get('businessDomain.title')}${intl.get('businessDomain.tableColumns.name')}${intl.get('global.specialCharacters1')}`,
            },
            {
              validator: () => {
                if (errorData?.name) return Promise.reject(new Error(errorData?.name));
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input
            placeholder={intl.get('businessDomain.drawer.pleaseEnterTheBusinessDomainName')}
            autoComplete='off'
            aria-autocomplete='none'
            onChange={() => {
              onChangeError({ name: '' });
            }}
          />
        </Form.Item>
        <Form.Item label={intl.get('businessDomain.drawer.businessDomainIntroduction')} name='description'>
          <Input.TextArea showCount rows={4} maxLength={300} placeholder={intl.get('businessDomain.drawer.pleaseEnterTheBusinessDomainIntroduction')} />
        </Form.Item>
        <Form.Item label={intl.get('businessDomain.drawer.associatedProduct')} name='products'>
          <Select
            allowClear
            mode='multiple'
            disabled={true}
            placeholder={intl.get('businessDomain.drawer.pleaseSelectCorrespondingProduct')}
            options={[
              { label: 'AS', value: 'as' },
              { label: 'AF', value: 'af' },
              { label: 'DIP', value: 'dip' },
            ]}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BasicInformation;
