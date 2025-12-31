import intl from 'react-intl-universal';
import { Form, Input } from 'antd';
import TagsSelector, { tagsSelectorValidator } from '@/components/TagsSelector';

const { TextArea } = Input;

const BasicConfig = ({ initialVal, dataSourceType }: any): JSX.Element => {
  return (
    <>
      <Form.Item label={intl.get('Global.dataSourceType_common')}>{intl.get(`DataConnect.${dataSourceType}`)}</Form.Item>
      <Form.Item
        label={intl.get('Global.dataSourceName_common')}
        name="name"
        preserve={true}
        initialValue={initialVal?.name}
        rules={[
          {
            required: true,
            message: intl.get('Global.nameCannotNull'),
          },
          {
            max: 40,
            message: intl.get('Global.nameCannotOverFourty'),
          },
        ]}
      >
        <Input placeholder={intl.get('Global.pleaseInput')} />
      </Form.Item>
      <Form.Item
        label={intl.get('Global.tag')}
        name="tags"
        preserve={true}
        initialValue={initialVal?.tags || []}
        rules={[{ validator: tagsSelectorValidator }]}
      >
        <TagsSelector />
      </Form.Item>
      <Form.Item label={intl.get('Global.comment')} name="comment" preserve={true} initialValue={initialVal?.comment || ''}>
        <TextArea rows={4} maxLength={255} />
      </Form.Item>
    </>
  );
};

export default BasicConfig;
