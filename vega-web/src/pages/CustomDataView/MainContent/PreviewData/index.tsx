import { useEffect, useRef, useState } from 'react';
import intl from 'react-intl-universal';
import { Button, Form, Switch, Table } from 'antd';
import { INIT_FILTER } from '@/hooks/useConstants';
import api from '@/services/customDataView/index';
import noData from '@/assets/images/no-right.svg';
import { Drawer } from '@/web-library/common';
import DataFilter from '@/web-library/components/DataFilter';
import UTILS from '@/web-library/utils';
import styles from './index.module.less';

const PreviewData: React.FC<{ open: boolean; id: string; name?: string; params?: any; onClose: () => void }> = ({ open, id, name, params = {}, onClose }) => {
  const [form] = Form.useForm();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState([]);
  const [title, setTitle] = useState('');
  const [switchFilter, setSwitchFilter] = useState<boolean>(false);
  const [filedList, setFiledList] = useState<any>([]);
  const dataFilterRef = useRef<any>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const getDetail = async (values?: any): Promise<void> => {
    setLoading(true);
    setTableData([]);
    setColumns([]);
    try {
      const resData = await api.getViewDataPreview(id, { limit: 1000, offset: 0, ...values, ...params });
      const cols: any = [];
      const fields: any = [];
      if (resData?.view) {
        if (params?.output_fields) {
          resData.view.fields = resData.view.fields.filter((item: any) => params.output_fields.includes(item.name));
        }
        resData.view.fields.forEach((item: any) => {
          cols.push({
            title: item.display_name,
            dataIndex: item.name,
            width: 180,
            ellipsis: true,
            render: (text: any) => {
              if (typeof text !== 'string') {
                return JSON.stringify(text);
              }
              return text;
            },
          });
          fields.push({
            displayName: item.display_name,
            name: item.name,
            type: item.type,
          });
        });
        setFiledList(fields);
        setColumns(cols);
        setTableData(resData.entries);
        setTitle(resData.view.name);
        setIsForbidden(false);
      }
    } catch (error: any) {
      setTableData([]);
      setColumns([]);
      setTitle('');
      if (error?.status === 403) {
        setIsForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      getDetail();
    } else {
      setTableData([]);
      setColumns([]);
      setSwitchFilter(false);
      form.setFieldValue('dataFilter', INIT_FILTER);
    }
  }, [open]);

  const handleSearch = () => {
    if (switchFilter && dataFilterRef.current) {
      const filters = switchFilter ? form.getFieldValue('dataFilter') : {};
      const validate = dataFilterRef.current?.validate();
      if (!validate) {
        getDetail({ filters });
      }
    } else {
      getDetail();
    }
  };

  return (
    <Drawer size="large" title={title || name || intl.get('Global.dataPreview')} width={'90%'} onClose={onClose} open={open}>
      {isForbidden ? (
        <>
          <div className="g-flex-center g-c-text-sub" style={{ flexDirection: 'column', height: 100, marginTop: 220 }}>
            <img src={noData} />
            <div style={{ marginTop: 8, color: 'rgba(0, 0, 0, 0.65)' }}>{intl.get('Global.noPreviewPermission', { title: title || name })}</div>
          </div>
        </>
      ) : (
        <>
          <div className={styles['search-box']}>
            <div className={styles['switch-box']}>
              <div className={styles['config-title']}>{intl.get('Global.dataFilter')}</div>
              <Switch
                size="small"
                value={switchFilter}
                onChange={(e) => {
                  setSwitchFilter(e);
                }}
              />
            </div>
            <Button type="primary" onClick={handleSearch}>
              {intl.get('Global.search')}
            </Button>
          </div>
          {switchFilter && (
            <div style={{ marginBottom: 12 }}>
              <Form form={form}>
                <Form.Item name="dataFilter">
                  <DataFilter
                    ref={dataFilterRef}
                    fieldList={filedList}
                    required={true}
                    transformType={UTILS.formatType}
                    maxCount={[10, 10, 10]}
                    level={3}
                    isFirst
                  />
                </Form.Item>
              </Form>
            </div>
          )}
          <Table loading={loading} scroll={{ x: 1000 }} size="small" columns={columns} dataSource={tableData} />
        </>
      )}
    </Drawer>
  );
};

export default PreviewData;
