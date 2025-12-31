import React, { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { Input, Transfer, Button, Form, Switch } from 'antd';
import TagsSelector from '@/components/TagsSelector';
import { INIT_FILTER } from '@/hooks/useConstants';
import RowColumnPermissionType from '@/services/rowColumnPermission/type';
import noData from '@/assets/images/no-data.svg';
import HOOKS from '@/hooks';
import PreviewData from '@/pages/CustomDataView/MainContent/PreviewData';
import { Drawer, IconFont } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';
import type { TransferProps } from 'antd';

interface FieldItem {
  id: string;
  name: string;
  type: string;
}

interface CreateRuleDrawerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: RowColumnPermissionType.CreateRuleParams) => void;
  initialData?: RowColumnPermissionType.CreateRuleParams & { id?: string };
  availableFields?: FieldItem[];
}

const CreateRuleDrawer: React.FC<CreateRuleDrawerProps & { dataViewId: string }> = ({
  visible,
  onClose,
  onConfirm,
  initialData,
  availableFields = [],
  dataViewId,
}) => {
  const [form] = Form.useForm();
  const [targetKeys, setTargetKeys] = useState<any[]>([]);
  const [rowFiltersEnabled, setRowFiltersEnabled] = useState<boolean>(false);
  const dataFilterRef = useRef<any>(null);
  const [isPreviewDataModalShow, setIsPreviewDataModalShow] = useState(false);
  const [previewParams, setPreviewParams] = useState<any>({});

  // 初始化数据
  useEffect(() => {
    if (visible) {
      initialData && form.setFieldsValue(initialData);
      requestAnimationFrame(() => {
        setTargetKeys(initialData?.fields || []);
        setRowFiltersEnabled(!!initialData?.row_filters);
        form.setFieldsValue({
          row_filters: initialData?.row_filters || INIT_FILTER,
        });
      });
    } else {
      form.setFieldsValue({
        fields: [],
        row_filters: INIT_FILTER,
        tags: [],
        name: '',
        comment: '',
      });
      requestAnimationFrame(() => {
        setRowFiltersEnabled(false);
        setTargetKeys([]);
      });
    }
  }, [visible, initialData, form]);

  // Transfer 变化处理
  const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys);
    form.setFieldsValue({ fields: newTargetKeys });
  };

  // 切换行数据过滤开关
  const handleSwitchChange = (checked: boolean) => {
    setRowFiltersEnabled(checked);
    if (!checked) {
      form.setFieldsValue({ row_filters: INIT_FILTER });
    }
  };

  // 获取全局message组件
  const { message } = HOOKS.useGlobalContext();

  // 确定
  const handleConfirm = async () => {
    try {
      // 验证表单
      await form.validateFields();
      // 验证行数据过滤条件
      if (rowFiltersEnabled && dataFilterRef.current?.validate()) {
        message.error(intl.get('RowColumnPermission.pleaseCompleteFilterCondition'));
        return;
      }

      // 确保选择了字段
      if (targetKeys.length === 0) {
        message.error(intl.get('Global.pleaseSelectFields'));
        return;
      }

      // 调用父组件的确认函数
      const params = form.getFieldsValue();
      if (!rowFiltersEnabled) {
        params.row_filters = undefined;
      }
      onConfirm(params);
    } catch (error: any) {
      // 自动滚动到第一个错误字段
      if (error?.errorFields && error.errorFields.length > 0) {
        const firstErrorField = error.errorFields[0].name[0];
        form.scrollToField(firstErrorField);
      }
    }
  };

  // 预览数据
  const handlePreviewData = () => {
    setPreviewParams({
      filters: rowFiltersEnabled ? form.getFieldValue('row_filters') : undefined,
      output_fields: targetKeys,
    });
    setIsPreviewDataModalShow(true);
  };

  // 自定义渲染列表项
  const renderItem: TransferProps['render'] = (item) => {
    const icon = UTILS.formatIconByType(item.type);
    return (
      <div>
        <IconFont type={icon} style={{ marginRight: 4 }} />
        <span>{item.title}</span>
      </div>
    );
  };

  // 准备 Transfer 数据源
  const transferDataSource = availableFields.map((field) => ({
    key: field.name,
    title: field.name,
    type: field.type,
  }));

  const tagNumberValidator = (_: any, value: Array<string> | undefined) => {
    if (value && value.length > 5) return Promise.reject(new Error(intl.get('MetricModel.tagQuantityLimitInfo')));
    return Promise.resolve();
  };

  const footer = (
    <div className={styles.footer}>
      <Button onClick={handleConfirm} type="primary">
        {intl.get('Global.ok')}
      </Button>
      <Button onClick={onClose}>{intl.get('Global.cancel')}</Button>
    </div>
  );

  return (
    <>
      <Drawer
        title={initialData?.id ? intl.get('Global.editRule') : intl.get('Global.createRule')}
        width={800}
        open={visible}
        onClose={onClose}
        className={styles.createRuleDrawer}
        footer={footer}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          {/* 规则名称 */}
          <Form.Item name="name" label={intl.get('Global.ruleName')} rules={[{ required: true, message: intl.get('RowColumnPermission.pleaseInputRuleName') }]}>
            <Input maxLength={255} className={styles.input} placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          {/* 标签 */}
          <Form.Item name="tags" label={intl.get('Global.tag')} rules={[{ validator: tagNumberValidator }]}>
            <TagsSelector placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          {/* 描述 */}
          <Form.Item name="comment" label={intl.get('Global.description')}>
            <Input.TextArea rows={4} maxLength={255} showCount placeholder={intl.get('Global.pleaseInput')} />
          </Form.Item>
          <Form.Item name="fields" label={intl.get('RowColumnPermission.selectColumns')}>
            <Transfer
              dataSource={transferDataSource}
              targetKeys={targetKeys}
              onChange={handleTransferChange}
              render={renderItem}
              showSearch
              filterOption={(inputValue, item) => {
                return item.title.toLowerCase().includes(inputValue.toLowerCase());
              }}
              locale={{
                itemUnit: intl.get('RowColumnPermission.transfer.item'),
                itemsUnit: intl.get('RowColumnPermission.transfer.items'),
                searchPlaceholder: intl.get('Global.searchFieldPlaceholder'),
                notFoundContent: (
                  <>
                    <img src={noData} />
                    <div>{intl.get('Global.noData')}</div>
                  </>
                ),
              }}
              listStyle={{
                width: 352,
                height: 443,
              }}
            />
          </Form.Item>

          <Form.Item
            name="row_filters"
            label={
              <>
                <span style={{ marginRight: 8 }}>{intl.get('RowColumnPermission.configRowData')}</span>
                <Switch size="small" onChange={handleSwitchChange} value={rowFiltersEnabled} />
              </>
            }
          >
            {rowFiltersEnabled && (
              <DataFilter
                ref={dataFilterRef}
                fieldList={availableFields}
                required={true}
                transformType={UTILS.formatType}
                maxCount={[10, 10, 10]}
                level={3}
                isFirst
              />
            )}
          </Form.Item>
          <Form.Item label={intl.get('RowColumnPermission.viewDataDescription')} className={styles.viewDataButton}>
            <Button type="default" onClick={handlePreviewData} disabled={targetKeys.length === 0}>
              {intl.get('Global.viewData')}
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
      {/* 预览 */}
      <PreviewData id={dataViewId} name={''} params={previewParams} open={isPreviewDataModalShow} onClose={() => setIsPreviewDataModalShow(false)} />
    </>
  );
};

export default CreateRuleDrawer;
