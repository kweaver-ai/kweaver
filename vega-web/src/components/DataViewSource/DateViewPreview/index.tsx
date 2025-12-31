import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { Table } from 'antd';
import api from '@/services/dataView/index';
import emptyImg from '@/assets/images/dataView/empty.png';
import styles from './index.module.less';

const DateViewPreview: React.FC<{ id: string }> = ({ id }) => {
  const [columns, setColumns] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any>([]);
  const [dataViewInfo, setDataViewInfo] = useState<any>({});
  const [empty, setEmpty] = useState<boolean>(true);

  const getDetail = async (): Promise<void> => {
    setLoading(true);
    setTableData([]);
    setColumns([]);
    try {
      const resData = await api.getViewDataPreview(id, { limit: 20, offset: 0 });
      const cols: any = [];
      if (resData?.view) {
        resData.view.fields.forEach((item: any) => {
          cols.push({
            title: item.display_name,
            dataIndex: item.name,
            width: 100,
            ellipsis: true,
          });
        });
        setColumns(cols);
        setTableData(resData.entries);
        setDataViewInfo(resData.view);
        setEmpty(false);
      }
    } catch {
      setTableData([]);
      setColumns([]);
      setDataViewInfo({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setEmpty(false);
      getDetail();
    } else {
      setEmpty(true);
      setTableData([]);
      setColumns([]);
    }
  }, [id]);

  return !empty ? (
    <div className={styles['preview-container']}>
      <div className={styles['preview-title']}>
        <span>{dataViewInfo?.name || intl.get('Components.dataViewSource.preview')}</span>
        <span className={styles['preview-tip']}>{intl.get('Components.dataViewSource.previewTip')}</span>
      </div>
      <Table loading={loading} scroll={{ y: 380 }} size="small" columns={columns} dataSource={tableData} pagination={false} />
    </div>
  ) : (
    <div className={styles['empty-container']}>
      <img className={styles['empty-img']} src={emptyImg} />
      <span className={styles['empty-tip']}>{intl.get('Components.dataViewSource.detail')}</span>
    </div>
  );
};

export default DateViewPreview;
