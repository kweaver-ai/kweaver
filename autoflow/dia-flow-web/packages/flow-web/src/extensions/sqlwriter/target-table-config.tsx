import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Form, Select, Input, Radio } from 'antd';
import type { FormInstance } from 'antd';
import styles from './target-table-config.module.less';
import { API, MicroAppContext } from '@applet/common';
import { FormItem } from '../../components/editor/form-item';

const { TextArea } = Input;

interface TargetTableConfigProps {
  onChange?: (values: any) => void;
  initialValues?: any;
  dataSourceId?: string;
  form?: FormInstance;
  t?: (key: string, defaultValue?: string) => string;
}

export const TargetTableConfig: React.FC<TargetTableConfigProps> = ({
  onChange,
  initialValues = {},
  dataSourceId,
  form,
  t = (key, defaultValue) => defaultValue || key,
}) => {
  const { prefixUrl } = useContext(MicroAppContext);
  const [loading, setLoading] = useState(false);
  const [tableOptions, setTableOptions] = useState<{ label: string; value: string }[]>([]);

  const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
    if (onChange) {
      onChange({...initialValues, ...allValues});
    }
  }, [onChange]);

  useEffect(() => {
    const fetchTables = async () => {
      if (!dataSourceId) {
        setTableOptions([]);
        return;
      }
      try {
        setLoading(true);
        const { data } = await API.axios.get(
          `${prefixUrl}/api/automation/v1/database/tables?data_source_id=${encodeURIComponent(dataSourceId)}`
        );
        const entries = Array.isArray(data?.entries) ? data.entries : (Array.isArray(data) ? data : []);
        const options = entries.map((t: any) => ({ label: t?.table_name || t?.name || t, value: t?.table_name || t?.name || String(t) }));
        setTableOptions(options);
      } catch (e) {
        console.error(e);
        setTableOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [dataSourceId]);

  return (
    <div className={styles.tableCard}>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        labelAlign="left"
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        <FormItem
          label={t('targetTable.targetTable', '目标表')}
          name="tableMode"
          required
          initialValue="create"
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}>
          <Radio.Group>
            <Radio value="create">{t('targetTable.createNewTable', '新建目标表')}</Radio>
            <Radio value="existing">{t('targetTable.selectExistingTable', '选择已有目标表')}</Radio>
          </Radio.Group>
        </FormItem>

        {/* 新建目标表时显示表名与描述 */}
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.tableMode !== cur.tableMode}>
          {({ getFieldValue }) =>
            getFieldValue('tableMode') !== 'existing' ? (
              <>
                <FormItem
                  label={t('targetTable.tableName', '表名')}
                  name="tableName"
                  required
                  rules={[
                    {
                      required: true,
                      message: t("emptyMessage"),
                    },
                  ]}
                >
                  <Input placeholder={t('targetTable.enterTableName', '请输入表名')} />
                </FormItem>

                <FormItem label={t('targetTable.tableDescription', '表描述')} name="tableDescription">
                  <TextArea
                    rows={3}
                    placeholder={t('targetTable.enterTableDescription', '请输入表描述')}
                    showCount
                    maxLength={500}
                  />
                </FormItem>
              </>
            ) : (
              // 选择已有目标表时显示下拉，数据来源接口
              <FormItem label={t('targetTable.existingTableName', '已有表名')} name="existingTable" required>
                <Select
                  placeholder={dataSourceId ? t('targetTable.selectExistingTableName', '请选择已有表名') : t('targetTable.selectConnectionFirst', '请先选择连接')}
                  loading={loading}
                  disabled={!dataSourceId}
                  showSearch
                  optionFilterProp="label"
                  options={tableOptions}
                />
              </FormItem>
            )
          }
        </Form.Item>

        <div className={styles.hintText}>
{t('targetTable.tableNameCaseNote', '如需批量修改表名/字段名大小写,请联系管理员')}
        </div>
      </Form>
    </div>
  );
};
