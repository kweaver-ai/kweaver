import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form, Radio, Switch } from 'antd';
import { useForm } from 'antd/es/form/Form';
import OntologyObjectType from '@/services/object/type';
import { IconFont, Input } from '@/web-library/common';
import styles from './index.module.less';

export type TAttrForm = {
  data?: OntologyObjectType.Field;
  onClose: () => void;
};

const AttrForm = (props: TAttrForm) => {
  const { data, onClose } = props;
  const [form] = useForm();

  useEffect(() => {
    form.setFieldsValue(data);
  }, [JSON.stringify(data)]);

  return (
    <div className={styles['attr-form-box']}>
      <div className={styles['attr-title']}>
        <h3 style={{ fontSize: 16, fontWeight: 500 }}>{intl.get('Global.view')}</h3>
        <IconFont type="icon-dip-close" onClick={onClose} />
      </div>
      <Form layout="vertical" form={form}>
        <Form.Item label={intl.get('Global.attributeName')} name="name" rules={[{ required: true, message: intl.get('Global.cannotBeNull') }]}>
          <Input disabled />
        </Form.Item>
        <Form.Item label={intl.get('Global.attributeDisplayName')} name="display_name">
          <Input disabled />
        </Form.Item>
        <Form.Item label={intl.get('Global.attributeType')} name="type">
          <Input disabled />
        </Form.Item>
        <Form.Item label={intl.get('Global.comment')} name="comment">
          <Input.TextArea disabled />
        </Form.Item>
        <Form.Item label={intl.get('Global.primaryKey')} name="primary_key" valuePropName="checked">
          <Switch disabled />
        </Form.Item>
        <Form.Item label={intl.get('Global.title')} name="display_key">
          <Radio.Group
            name="radiogroup"
            disabled
            options={[
              { value: true, label: intl.get('Global.yes') },
              { value: false, label: intl.get('Global.no') },
            ]}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default AttrForm;
