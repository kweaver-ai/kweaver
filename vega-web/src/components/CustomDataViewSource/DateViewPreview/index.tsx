import { useEffect, useState } from 'react';
import { Table } from 'antd';
import api from '@/services/customDataView/index';
import emptyImg from '@/assets/images/customDataView/empty.png';
import styles from './index.module.less';

const DateViewPreview: React.FC<{ id: string }> = ({ id }) => {
  const [columns, setColumns] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tableData, setTableData] = useState<any>([]);
  const [dataViewInfo, setDataViewInfo] = useState<any>({});

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
      getDetail();
    } else {
      setTableData([]);
      setColumns([]);
    }
  }, [id]);

  return !!id ? (
    <div className={styles['preview-container']}>
      <div className={styles['preview-title']}>
        <span>{dataViewInfo?.name || '预览'}</span>
        <span className={styles['preview-tip']}>（展示部分数据）</span>
      </div>
      <Table rowKey="id" loading={loading} scroll={{ y: 380 }} size="small" columns={columns} dataSource={tableData} pagination={false} />
    </div>
  ) : (
    <div className={styles['empty-container']}>
      <img className={styles['empty-img']} src={emptyImg} alt="暂无数据预览" />
      <span className={styles['empty-tip']}>您可点击视图名称查看详情</span>
    </div>
  );
};

export default DateViewPreview;
