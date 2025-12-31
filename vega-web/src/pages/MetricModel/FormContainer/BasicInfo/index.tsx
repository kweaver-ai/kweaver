import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import intl from 'react-intl-universal';
import { Form } from 'antd';
import TagsSelector from '@/components/TagsSelector';
import { METRIC_ID_REGEX } from '@/hooks/useConstants';
import api from '@/services/data-analysis/metric-model';
import { Input, Select } from '@/web-library/common';
import styles from './index.module.less';

export enum ConfigType {
  default = 'default',
  kafka = 'kafka',
}

const BasicInfo = forwardRef((props: any, ref) => {
  const [form] = Form.useForm();
  const { values, isEdit } = props;
  const [groupList, setGroupList] = useState<any>([]);

  useImperativeHandle(ref, () => ({ form }));

  const getGroupList = async (): Promise<void> => {
    const res = await api.getGroupList();
    setGroupList(res.entries);
  };

  useEffect(() => {
    getGroupList();
  }, []);

  useEffect(() => {
    if (values) form.setFieldsValue(values);
  }, [JSON.stringify(values)]);

  const tagNumberValidator = (_: any, value: Array<string> | undefined) => {
    if (value && value.length > 5) {
      return Promise.reject(new Error(intl.get('MetricModel.tagQuantityLimitInfo')));
    }
    return Promise.resolve();
  };

  return (
    <div className={styles['basic-info-root']}>
      <Form form={form} className={styles.form} layout="vertical" initialValues={{ tags: [] }}>
        {/* 基本配置 */}
        <Form.Item
          name="name"
          label={intl.get('Global.name')}
          rules={[
            { required: true, message: intl.get('Global.nameCannotNull') },
            { max: 40, message: intl.get('Global.nameCannotOverFourty') },
          ]}
        >
          <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
        <Form.Item
          name="id"
          label="ID"
          extra={<p className={styles['form-item-tip']}>{intl.get('MetricModel.idTip')}</p>}
          rules={[
            {
              validator: (_rule: any, value: string) => {
                if (value && value.length > 40) {
                  return Promise.reject(new Error(intl.get('Global.idMaxLength')));
                }
                if (value && !METRIC_ID_REGEX.test(value)) {
                  return Promise.reject(new Error(intl.get('Global.idSpecialVerification')));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input autoComplete="off" aria-autocomplete="none" disabled={isEdit} placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
        {/* 指标模型分组 */}
        <Form.Item name="groupName" label={intl.get('Global.group')}>
          <Select showSearch optionFilterProp="children" placeholder={intl.get('Global.pleaseSelect')}>
            {groupList
              .filter((v: any) => v.name && !v.builtin)
              .map((item: any) => {
                return (
                  <Select.Option key={item.name} value={item.name}>
                    {item.name === '' ? intl.get('Global.ungrouped') : item.name}
                  </Select.Option>
                );
              })}
          </Select>
        </Form.Item>
        <Form.Item name="tags" label={intl.get('Global.tag')} rules={[{ validator: tagNumberValidator }]}>
          <TagsSelector placeholder={intl.get('Global.pleaseInput')} />
        </Form.Item>
        <Form.Item name="comment" label={intl.get('Global.comment')}>
          <Input.TextArea rows={4} maxLength={255} />
        </Form.Item>
      </Form>
    </div>
  );
});

export default BasicInfo;
