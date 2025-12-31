import React, { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { Table, Button, Switch, Form, Space, Input } from 'antd';
import atomDataViewApi from '@/services/atomDataView';
import AtomDataViewType from '@/services/atomDataView/type';
import { Drawer } from '@/web-library/common';
import styles from './index.module.less';

interface DataPreviewProps {
  visible: boolean;
  dataViewId?: string;
  onClose: () => void;
}

interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  sorter?: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ visible, dataViewId, onClose }) => {
  const [form] = Form.useForm();
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataViewDetail, setDataViewDetail] = useState<AtomDataViewType.Data | null>(null);
  const [filters, setFilters] = useState<any[]>([]);
  const [enableFilters, setEnableFilters] = useState(false);

  useEffect(() => {
    if (visible && dataViewId) {
      loadDataPreview();
    }
  }, [visible, dataViewId]);

  const loadDataPreview = async () => {
    if (!dataViewId) return;

    setLoading(true);
    try {
      // 获取数据视图详情
      const detailRes = await atomDataViewApi.getDataViewsByIds([dataViewId]);
      setDataViewDetail(detailRes[0]);

      // 构建表格列配置
      const tableColumns: TableColumn[] =
        detailRes[0].fields?.map((field: any) => ({
          title: field.display_name || field.name,
          dataIndex: field.name,
          key: field.name,
          width: 150,
          sorter: field.sortable || false,
        })) || [];
      setColumns(tableColumns);

      // 获取数据预览
      const previewParams = {
        limit: 100,
        offset: 0,
        filters: enableFilters ? filters : undefined,
      };

      const previewRes = await atomDataViewApi.postFormViewDataPreview(dataViewId, previewParams);
      setData(previewRes.data?.entries || []);
    } catch (error) {
      console.error('Error loading data preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const formValues = form.getFieldsValue();
    const searchFilters: any = [];

    // 构建搜索条件
    Object.keys(formValues).forEach((key) => {
      if (formValues[key]) {
        searchFilters.push({
          field: key,
          operation: 'eq',
          value: formValues[key],
        });
      }
    });

    setFilters(searchFilters);
    loadDataPreview();
  };

  const handleReset = () => {
    form.resetFields();
    setFilters([]);
    loadDataPreview();
  };

  const getSearchFields = () => {
    if (!dataViewDetail?.fields) return [];

    return dataViewDetail.fields.filter((field: any) => !field.system_field).slice(0, 5); // 限制搜索字段数量
  };

  return (
    <Drawer title={intl.get('Global.dataPreview')} placement="right" width="90%" onClose={onClose} open={visible} maskClosable={false}>
      <div className={styles['data-preview']}>
        <div className={styles['search-section']}>
          <div className={styles['search-header']}>
            <Space>
              <span>{intl.get('Global.dataFilter')}</span>
              <Switch
                checked={enableFilters}
                onChange={setEnableFilters}
                checkedChildren={intl.get('Global.enabled')}
                unCheckedChildren={intl.get('Global.disabled')}
              />
            </Space>
            <Space>
              <Button icon={<SearchOutlined />} type="primary" onClick={handleSearch}>
                {intl.get('Global.search')}
              </Button>
              <Button icon={<CloseOutlined />} onClick={handleReset}>
                {intl.get('Global.reset')}
              </Button>
            </Space>
          </div>

          {enableFilters && (
            <div className={styles['filter-form']}>
              <Form form={form} layout="inline" size="small">
                {getSearchFields().map((field: any) => (
                  <Form.Item key={field.name} name={field.name} label={field.display_name || field.name}>
                    <Input placeholder={intl.get('Global.enterKeyword')} allowClear style={{ width: 200 }} />
                  </Form.Item>
                ))}
              </Form>
            </div>
          )}
        </div>

        <div className={styles['table-section']}>
          <Table
            loading={loading}
            columns={columns}
            dataSource={data}
            scroll={{ x: '100%', y: 'calc(100vh - 300px)' }}
            pagination={{
              total: data.length,
              pageSize: 100,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total) => intl.get('Global.totalRecords', { count: total }),
            }}
            size="small"
            rowKey={(record, index) => `${dataViewId}-${index}`}
          />
        </div>
      </div>
    </Drawer>
  );
};

export default DataPreview;
