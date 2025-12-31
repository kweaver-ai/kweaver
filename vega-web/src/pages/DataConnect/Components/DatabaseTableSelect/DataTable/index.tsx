import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Pagination, Checkbox } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import api from '@/services/scanManagement';
import ScanTaskType from '@/services/scanManagement/type';
import emptyImg from '@/assets/images/customDataView/empty.png';
import { IconFont } from '@/web-library/common';
import styles from './index.module.less';

const DataTable: React.FC<{
  selectedKey: string;
  checkedList: ScanTaskType.TableInfo[];
  onChange: (checkedItem: ScanTaskType.TableInfo) => void;
  onPreview: (id: string) => void;
}> = ({ selectedKey, checkedList, onChange, onPreview }) => {
  const [listData, setListData] = useState<ScanTaskType.TableInfo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState('');
  const [pagination, setPagination] = useState<any>({ pageSize: PAGINATION_DEFAULT.pageSize, page: PAGINATION_DEFAULT.current });

  const ListItem = ({ item, onChecked }: { item: ScanTaskType.TableInfo; onChecked: (checked: boolean) => void }) => {
    return (
      <div className={styles['list-item']}>
        <Checkbox
          onChange={(e) => {
            onChecked(e.target.checked);
          }}
          checked={checkedList.findIndex((val) => val.id === item.id) !== -1}
        ></Checkbox>
        <div className={styles['list-item-content']} title={item.name} onClick={() => onPreview(item.id)}>
          <IconFont type="icon-dip-table" style={{ fontSize: '18px' }} />
          <div className={styles['list-item-title']}>{item.name}</div>
        </div>
      </div>
    );
  };

  const getDataList = async (newPagination?: typeof pagination) => {
    try {
      setLoading(true);
      const currentPagination = newPagination || pagination;
      const res = await api.getDataSourceTables(selectedKey, {
        offset: (currentPagination.page - 1) * currentPagination.pageSize,
        limit: currentPagination.pageSize,
        keyword: searchValue,
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
    if (!selectedKey) {
      return;
    }
    getDataList();
  }, [selectedKey, searchValue]);

  const paginationChange = (page: number, pageSize: number): void => {
    const newPagination = { ...pagination, page, pageSize };
    setPagination(newPagination);
    getDataList(newPagination);
  };

  return listData.length > 0 ? (
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
  ) : (
    <div className={styles['empty-container']}>
      <img className={styles['empty-img']} src={emptyImg} alt={intl.get('Global.noData')} />
      <span className={styles['empty-tip']}>{intl.get('Global.noData')}</span>
    </div>
  );
};

export default DataTable;
