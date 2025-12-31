import { useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import { Input, Table } from 'antd';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import AtomDataViewType from '@/services/atomDataView/type';
import styles from './index.module.less';

interface TProps {
  data?: AtomDataViewType.Field[];
}

const FieldTable = (props: TProps): JSX.Element => {
  const { data = [] } = props;
  const [searchValue, setSearchValue] = useState<string>();
  const [pagination, setPagination] = useState<{
    current?: number;
    pageSize?: number;
  }>({
    current: 1,
    pageSize: 10,
  });

  useEffect(() => {
    setSearchValue(undefined);
    setPagination({
      current: PAGINATION_DEFAULT.current,
      pageSize: PAGINATION_DEFAULT.pageSize,
    });
  }, [JSON.stringify(data)]);

  const filterData = useMemo(() => {
    if (searchValue) {
      return data.filter((item) => item.display_name.includes(searchValue) || item.name.includes(searchValue));
    }
    return data;
  }, [data, searchValue]);

  return (
    <>
      <Input.Search
        className={styles['table-field-search']}
        value={searchValue}
        onChange={(value): void => setSearchValue(value.target.value)}
        placeholder={intl.get('Global.search')}
        allowClear
      ></Input.Search>
      <Table
        rowKey="name"
        dataSource={filterData}
        size="small"
        columns={[
          {
            title: intl.get('Global.fieldDisplayName'),
            dataIndex: 'display_name',
          },
          {
            title: intl.get('Global.fieldName'),
            dataIndex: 'name',
          },
          {
            title: intl.get('Global.fieldType'),
            dataIndex: 'type',
          },
          {
            title: intl.get('Global.fieldComment'),
            dataIndex: 'comment',
            render: (text) => text || '--',
          },
        ]}
        onChange={(val): void => setPagination(val)}
        scroll={{
          y: 390,
        }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filterData.length,
          showTotal: (total) => intl.get('Global.total', { total }),
          pageSizeOptions: [10, 20, 50],
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </>
  );
};

export default FieldTable;
