import React, { useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { Form, Select, Input, message } from 'antd';
import type { FormInstance } from 'antd';
import styles from './database-connection-config.module.less';
import { API, MicroAppContext } from '@applet/common';
import { FormItem } from '../../components/editor/form-item';

const { Option } = Select;

interface DatabaseConnectionConfigProps {
  onConnectionTest?: (connectionInfo: any) => Promise<boolean>;
  onChange?: (values: any) => void;
  initialValues?: any;
  form?: FormInstance;
  t?: (key: string, defaultValue?: string) => string;
}

export const DatabaseConnectionConfig: React.FC<DatabaseConnectionConfigProps> = ({
  onChange,
  initialValues = {},
  form: externalForm,
  t = (key, defaultValue) => defaultValue || key,
}) => {
  const [innerForm] = Form.useForm();
  const form = externalForm || innerForm;
  const { prefixUrl } = useContext(MicroAppContext);

  const [loading, setLoading] = useState(false);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const TYPE_LABELS: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
    kingbase: '人大金仓',
    dameng: '达梦',
  };

  useEffect(() => {
    const fetchDataSources = async () => {
      try {
        setLoading(true);
        const { data } = await API.axios.get(
          `${prefixUrl}/api/data-connection/v1/datasource?sort=updated_at&direction=desc&limit=-1&offset=0&type=structured`
        );
        const list = Array.isArray(data?.entries) ? data.entries : (Array.isArray(data) ? data : []);
        setDataSources(list);
      } catch (e) {
        console.error(e);
        message.error('获取数据源失败');
      } finally {
        setLoading(false);
      }
    };
    fetchDataSources();
  }, [prefixUrl]);

  const typeOptions = useMemo(() => {
    const types = new Map<string, string>();
    dataSources.forEach((ds: any) => {
      const type = ds?.type || ds?.db_type || ds?.category || 'unknown';
      if (!types.has(type)) types.set(type, type);
    });
    return Array.from(types.keys());
  }, [dataSources]);

  const selectedType = Form.useWatch('connectionType', form);

  const nameOptions = useMemo(() => {
    return dataSources
      .filter((ds: any) => {
        const type = ds?.type || ds?.db_type || ds?.category || 'unknown';
        return selectedType ? type === selectedType : true;
      })
      .map((ds: any) => {
        const name = ds?.name || ds?.label || ds?.id;
        return {
          value: name,
          label: name,
          id: ds?.id,
          detail: ds?.bin_data,
        };
      });
  }, [dataSources, selectedType]);


  const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
    // 仅用于内部联动，不直接向上传递，避免在未就绪时上报不完整数据
  }, []);

  return (
    <div className={styles.connectionCard}>
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
          label={t('connection.connectionType', '连接类型')}
          name="connectionType"
          required
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}>
          <Select 
            placeholder={t('connection.selectConnectionType', '请选择数据连接类型')}
            loading={loading}
            allowClear
            onChange={() => {
              form.setFieldValue('connectionName', undefined);
            }}
          >
            {typeOptions.map((type) => (
              <Option key={type} value={type}>{TYPE_LABELS[type] || type}</Option>
            ))}
          </Select>
        </FormItem>

        <FormItem
          label={t('connection.connectionName', '连接名称')}
          name="connectionName"
          required
          rules={[
            {
              required: true,
              message: t("emptyMessage"),
            },
          ]}
        >
          <Select 
            placeholder={selectedType ? t('connection.selectConnectionName', '请选择连接名称') : t('connection.selectConnectionTypeFirst', '请先选择数据连接类型')}
            loading={loading}
            disabled={!selectedType}
            showSearch
            optionFilterProp="label"
            options={nameOptions}
            onChange={(val, option: any) => {
              form.setFieldValue('connectionId', option?.id);
              form.setFieldValue('connectionDetail', option?.detail);
              if (onChange) {
                setTimeout(() => {
                  onChange(form.getFieldsValue());
                }, 0);
              }
            }}
          />
        </FormItem>

        {/* 隐藏字段：用于后续提交给后端 */}
        <Form.Item name="connectionId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="connectionDetail" hidden>
          <Input />
        </Form.Item>
      </Form>
    </div>
  );
};
