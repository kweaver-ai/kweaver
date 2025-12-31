import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Pagination, Checkbox } from 'antd';
import api from '@/services/customDataView/index';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

const DataViewList: React.FC<{
  condition: any;
  checkedList: any[];
  onChange: (checkedItem: any) => void;
  onPreview: (id: string) => void;
  queryType: string;
}> = ({ condition, checkedList, onChange, onPreview, queryType }) => {
  const [listData, setListData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState<any>({ pageSize: 10, page: 1 });

  const ListItem = ({ item, onChecked }: { item: any; onChecked: (checked: boolean) => void }) => {
    return (
      <div className={styles['list-item']}>
        <Checkbox
          onChange={(e) => {
            onChecked(e.target.checked);
          }}
          checked={checkedList.findIndex((val) => val.id === item.id) !== -1}
        ></Checkbox>
        <div className={styles['list-item-content']} title={item.name} onClick={() => onPreview(item.id)}>
          <IconFont type="icon-dip-color-shitusuanzi" style={{ fontSize: '18px' }} />
          <div className={styles['list-item-title']}>{item.name}</div>
        </div>
      </div>
    );
  };

  const getDataList = async (newPagination?: typeof pagination) => {
    try {
      setLoading(true);
      const currentPagination = newPagination || pagination;
      const res = await api.getAtomViewList({
        ...condition,
        offset: (currentPagination.page - 1) * currentPagination.pageSize,
        limit: currentPagination.pageSize,
        name: searchValue,
        queryType,
      });
      setListData(res?.entries || []);
      setTotal(res?.total_count || 0);
    } catch (error) {
      setListData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination({ ...pagination, page: 1 });
    getDataList();
  }, [JSON.stringify(condition), searchValue, queryType]);

  const paginationChange = (page: number, pageSize: number): void => {
    const newPagination = { ...pagination, page, pageSize };
    setPagination(newPagination);
    getDataList(newPagination);
  };

  return (
    <div className={styles['data-view-list']}>
      <div className={styles['search-input']}>
        <Input
          prefix={<SearchOutlined style={{ color: 'rgba(0, 0, 0, 0.3)', fontSize: '16px' }} />}
          allowClear
          placeholder={intl.get('Global.search')}
          onChange={(e) => {
            setSearchValue(e.target.value || '');
          }}
        />
      </div>
      <div className={styles['list-container']}>
        {listData.map((item) => (
          <ListItem
            key={item.id}
            item={item}
            onChecked={() => {
              onChange(item);
            }}
          />
        ))}
      </div>
      <div className={styles['pagination-container']}>
        <Pagination simple current={pagination.page} total={total} pageSize={pagination.pageSize} showSizeChanger={false} onChange={paginationChange} />
      </div>
    </div>
  );
};

export default DataViewList;
