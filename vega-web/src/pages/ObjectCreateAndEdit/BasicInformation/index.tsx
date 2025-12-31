import { useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form, Select } from 'antd';
import ColorSelect from '@/components/ColorSelect';
import IconSelect from '@/components/IconSelect';
import TagsSelector, { tagsSelectorValidator } from '@/components/TagsSelector';
import ENUMS from '@/enums';
import { Input } from '@/web-library/common';

const BasicInformation = (props: any) => {
  const { form, values, isEditPage, conceptGroups = [], conceptGroupsLoading = false } = props;

  useEffect(() => {
    if (values) form.setFieldsValue(values);
  }, [JSON.stringify(values)]);

  return (
    <div style={{ width: 600, margin: '0 auto' }}>
      <Form form={form} colon={false} labelAlign="left" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} initialValues={{ ...values }}>
        <Form.Item
          label={intl.get('Object.objectClassName')}
          name="name"
          rules={[
            { required: true, message: intl.get('Object.pleaseFillObjectClassName') },
            { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
          ]}
        >
          <Input placeholder={intl.get('Global.placeholder')} autoComplete="off" aria-autocomplete="none" />
        </Form.Item>
        <Form.Item
          label="ID"
          name="id"
          rules={[
            { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
            { pattern: ENUMS.REGEXP.LOWER_NUMBER, message: intl.get('Global.idLowercaseLetterNumberOnly') },
          ]}
        >
          <Input placeholder={intl.get('Global.placeholder')} disabled={isEditPage} autoComplete="off" aria-autocomplete="none" />
        </Form.Item>
        <Form.Item label={intl.get('Global.icon')} name="icon">
          <IconSelect />
        </Form.Item>
        <Form.Item label={intl.get('Global.color')} name="color">
          <ColorSelect />
        </Form.Item>
        <Form.Item
          label={intl.get('Global.tag')}
          name="tags"
          rules={[
            {
              validator: tagsSelectorValidator,
            },
          ]}
        >
          <TagsSelector />
        </Form.Item>
        <Form.Item label={intl.get('ConceptGroup.conceptGroup')} name="concept_groupIds">
          <Select
            mode="multiple"
            placeholder={intl.get('Global.pleaseSelect')}
            loading={conceptGroupsLoading}
            options={
              conceptGroups?.map((group: any) => ({
                value: group.id,
                label: group.name,
              })) || []
            }
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label={intl.get('Global.comment')} name="comment">
          <Input.TextArea placeholder={intl.get('Global.placeholder')} />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BasicInformation;
