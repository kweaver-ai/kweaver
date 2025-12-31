import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Form, Row, Col, Select } from 'antd';
import _ from 'lodash';
import ColorSelect from '@/components/ColorSelect';
import DataFilterNew from '@/components/DataFilterNew';
import ObjectSelector, { renderObjectTypeLabel } from '@/components/ObjectSelector';
import TagsSelector from '@/components/TagsSelector';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Input } from '@/web-library/common';
import UTILS from '@/web-library/utils';

const BasicInformation = (props: any) => {
  const { form, value, conditionVisible, isEditPage, knId } = props;

  const { ACTION_TYPE_OPTIONS } = HOOKS.useConstants();
  const [objectOptions, setObjectOptions] = useState<any[]>([]);

  const actionSource = Form.useWatch('object_type_id', form);
  const condition = Form.useWatch('condition', form);

  useEffect(() => {
    if (condition?.object_type_id && condition.object_type_id !== actionSource) {
      form.setFieldValue('condition', undefined);
    }
  }, [actionSource, condition]);

  /** 获取对象列表 */
  const getObjectList = async () => {
    try {
      const result = await SERVICE.object.objectGet(knId, { offset: 0, limit: -1 });
      const objectOptions = _.map(result?.entries, (item) => {
        const { id, name, icon, data_properties, color } = item;
        return {
          value: id,
          name,
          data_properties,
          label: renderObjectTypeLabel({ icon, name, color }),
          detail: item,
        };
      });
      setObjectOptions(objectOptions);
    } catch (error) {
      console.log('getObjectList error: ', error);
    }
  };

  useEffect(() => {
    getObjectList();
  }, []);

  return (
    <div style={{ width: 900 }}>
      <Form form={form} colon={false} labelAlign="left" initialValues={{ ...value }} layout="vertical">
        <Row gutter={24} style={{ width: 900 }}>
          <Col span={12}>
            <Form.Item
              label={intl.get('Action.actionClassName')}
              name="name"
              rules={[
                { required: true, message: intl.get('Global.notNull') },
                { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
              ]}
            >
              <Input placeholder={intl.get('Global.placeholder')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={intl.get('Global.id')}
              name="id"
              rules={[
                { max: 40, message: intl.get('Global.lenErr', { len: 40 }) },
                {
                  pattern: ENUMS.REGEXP.LOWER_NUMBER,
                  message: intl.get('Global.idPatternError'),
                },
              ]}
            >
              <Input placeholder={intl.get('Global.placeholder')} disabled={isEditPage} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={intl.get('Global.tag')}
              name="tags"
              rules={[
                {
                  validator: (_rule: any, value: string) => {
                    if (value?.length === 0) return Promise.resolve();
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
          </Col>
          <Col span={12}>
            <Form.Item label={intl.get('Global.color')} name="color" labelCol={{ span: 10 }}>
              <ColorSelect />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="comment" label={intl.get('Global.comment')}>
              <Input.TextArea rows={4} maxLength={255} placeholder={intl.get('Global.placeholder')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item required name="action_type" label={intl.get('Action.actionType')}>
              <Select options={ACTION_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              required
              name="object_type_id"
              label={intl.get('Action.boundObjectType')}
              rules={[{ required: true, message: intl.get('Global.notNull') }]}
            >
              <ObjectSelector objectOptions={objectOptions} />
            </Form.Item>
          </Col>

          {conditionVisible && (
            <Col span={24}>
              <Form.Item name="condition" label={intl.get('Action.triggerCondition')}>
                <DataFilterNew
                  objectOptions={objectOptions.filter((item) => item.value === actionSource)}
                  isFirst
                  level={3}
                  maxCount={[10, 10, 10]}
                  transformType={UTILS.formatType}
                />
              </Form.Item>
            </Col>
          )}

          <Col span={12}>
            <Form.Item name="affect.object_type_id" label={intl.get('Action.affectedObjectTypeLabel')}>
              <ObjectSelector objectOptions={objectOptions} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="affect.comment" label={intl.get('Action.affectDescription')}>
              <Input.TextArea rows={4} maxLength={255} placeholder={intl.get('Global.placeholder')} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default BasicInformation;
