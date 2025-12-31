import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { useParams } from 'react-router-dom';
import { Form, Spin } from 'antd';
import { DataViewQueryType } from '@/components/CustomDataViewSource';
import TagsSelector from '@/components/TagsSelector';
import api from '@/services/customDataView/index';
import HOOKS from '@/hooks';
import { GroupType } from '@/pages/CustomDataView/type';
import { Input, Select } from '@/web-library/common';
import styles from './index.module.less';
import { useDataViewContext } from '../context';

const idValidator = (_rule: any, value: string) => {
  if (value && value.length > 40) return Promise.reject(new Error(intl.get('Global.idMaxLength')));
  const regex = /^(?!_)(?!-)[a-z0-9_-]+$/; // 正则规则：id只能包含小写英文字母、数字、下划线，且不能以下划线开头
  if (value && !regex.test(value)) return Promise.reject(new Error(intl.get('Global.idSpecialVerification')));
  return Promise.resolve();
};

const tagNumberValidator = (_: any, value: Array<string> | undefined) => {
  if (value && value.length > 5) return Promise.reject(new Error(intl.get('MetricModel.tagQuantityLimitInfo')));
  return Promise.resolve();
};

const BasicInfo: React.FC<{ form: any; filedsValue?: any }> = ({ form, filedsValue }) => {
  const { dataViewTotalInfo } = useDataViewContext();
  const [groupList, setGroupList] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState<DataViewQueryType>(DataViewQueryType.SQL);
  const { modal } = HOOKS.useGlobalContext();

  const params: { id?: string } = useParams();
  const { id } = params;

  /** 获取分组列表 */
  const getGroupList = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await api.getGroupList();
      setGroupList(res.entries);
    } finally {
      setLoading(false);
    }
  };

  const changeQueryType = (value: DataViewQueryType) => {
    if (dataViewTotalInfo.data_scope.length <= 2 && dataViewTotalInfo.data_scope.some((item: any) => item.id === 'node-init')) {
      setQueryType(value);
      return;
    }
    modal.confirm({
      title: intl.get('CustomDataView.confirmChangeQueryType'),
      content: intl.get('CustomDataView.confirmChangeQueryTypeContent'),
      okText: intl.get('Global.ok'),
      cancelText: intl.get('Global.cancel'),
      onOk: () => {
        setQueryType(value);
      },
    });
  };

  useEffect(() => {
    getGroupList();
  }, []);

  useEffect(() => {
    if (filedsValue) {
      // 延迟设置表单值，确保组件已完全挂载
      const timer = setTimeout(() => {
        form.setFieldsValue(filedsValue);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [filedsValue, form]);

  return (
    <div className={styles['basic-info-root']}>
      <Spin spinning={loading}>
        <Form
          form={form}
          className={styles.form}
          layout="vertical"
          initialValues={{
            name: '',
            id: '',
            groupName: undefined,
            tags: [],
            comment: '',
            query_type: DataViewQueryType.SQL,
          }}
        >
          {/* 名称 */}
          <Form.Item
            name="name"
            label={intl.get('Global.name')}
            rules={[
              { required: true, message: intl.get('Global.nameCannotNull') },
              { max: 40, message: intl.get('Global.nameCannotOverFourty') },
              { pattern: /^[^\t]*$/, message: intl.get('Global.noTabCharacters') },
            ]}
          >
            <Input autoComplete="off" aria-autocomplete="none" placeholder={intl.get('Global.pleaseInput')} maxLength={40} showCount />
          </Form.Item>
          {/* ID */}
          <Form.Item
            name="id"
            label="ID"
            extra={<p className={styles['form-item-tip']}>{intl.get('CustomDataView.idTip')}</p>}
            rules={[{ validator: idValidator }]}
          >
            <Input autoComplete="off" disabled={!!id} aria-autocomplete="none" placeholder={intl.get('Global.pleaseInput')} maxLength={40} showCount />
          </Form.Item>
          {/* 分组 */}
          <Form.Item name="group_name" label={intl.get('Global.group')}>
            <Select
              showSearch
              optionFilterProp="children"
              placeholder={intl.get('Global.pleaseSelect')}
              notFoundContent={loading ? null : intl.get('CustomDataView.noGroupsFound')}
            >
              {groupList
                .filter((item: GroupType) => item.name && !item.builtin)
                .map((item: GroupType) => {
                  return (
                    <Select.Option key={item.name} value={item.name}>
                      {item.name === '' ? intl.get('Global.ungrouped') : item.name}
                    </Select.Option>
                  );
                })}
            </Select>
          </Form.Item>
          {/* 标签 */}
          <Form.Item name="tags" label={intl.get('Global.tag')} rules={[{ validator: tagNumberValidator }]}>
            <TagsSelector placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          {/* 描述 */}
          <Form.Item name="comment" label={intl.get('Global.description')}>
            <Input.TextArea rows={4} maxLength={255} showCount placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          {/* 查询类型 */}
          <Form.Item name="query_type" label={intl.get('Global.queryTypeLabel')} required>
            <Select
              disabled={!!id}
              options={[
                { label: 'SQL', value: DataViewQueryType.SQL },
                { label: 'DSL', value: DataViewQueryType.DSL },
                { label: 'IndexBase', value: DataViewQueryType.IndexBase },
              ]}
              onChange={changeQueryType}
              value={queryType}
              getPopupContainer={(triggerNode: HTMLElement): HTMLElement => triggerNode.parentNode as HTMLElement}
            />
          </Form.Item>
        </Form>
      </Spin>
    </div>
  );
};

export default BasicInfo;
