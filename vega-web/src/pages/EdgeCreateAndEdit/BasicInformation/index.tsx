import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form } from 'antd';
import _ from 'lodash';
import TagsSelector from '@/components/TagsSelector';
import ENUMS from '@/enums';
import { Input } from '@/web-library/common';

const BasicInformation = (props: any) => {
  const { form, values, isEditPage } = props;

  useEffect(() => {
    if (values) form.setFieldsValue(values);
  }, [JSON.stringify(values)]);

  return (
    <div style={{ width: 600 }}>
      <Form form={form} colon={false} labelAlign="left" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} initialValues={{ ...values }}>
        <Form.Item
          label={intl.get('Edge.edgeClassName')}
          name="name"
          rules={[
            { required: true, message: intl.get('Edge.edgeClassNameRequired') },
            { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
          ]}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} autoComplete="off" aria-autocomplete="none" />
        </Form.Item>
        <Form.Item
          label="ID"
          name="id"
          rules={[
            { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
            { pattern: ENUMS.REGEXP.LOWER_NUMBER, message: intl.get('Global.idPatternError') },
          ]}
        >
          <Input placeholder={intl.get('Global.pleaseInput')} disabled={isEditPage} autoComplete="off" aria-autocomplete="none" />
        </Form.Item>
        <Form.Item
          label={intl.get('Global.tag')}
          name="tags"
          rules={[
            {
              validator: (_rule: any, value: string) => {
                if (_.isArray(value) && value.length === 0) return Promise.resolve();
                if (value && value.length > 5) return Promise.reject(new Error(intl.get('Global.tagMaxError')));
                if (value && _.some(value, (str) => str.length > 40)) return Promise.reject(new Error(intl.get('Global.tagLengthError')));
                if (value && !ENUMS.REGEXP.EXCLUDE_CHARACTERS.test(value)) {
                  return Promise.reject(new Error(intl.get('Global.tagCharacterError')));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TagsSelector />
        </Form.Item>
        <Form.Item name="comment" label={intl.get('Global.comment')}>
          <Input.TextArea showCount rows={4} maxLength={255} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BasicInformation;
