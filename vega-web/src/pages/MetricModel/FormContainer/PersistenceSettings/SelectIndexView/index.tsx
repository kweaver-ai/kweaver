import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Tag } from 'antd';
import _ from 'lodash';
import { PAGINATION_DEFAULT } from '@/hooks/useConstants';
import apiService from '@/utils/axios-http';
import { formatKeyOfObjectToCamel } from '@/utils/format-objectkey-structure';
import { Button, Drawer, Title, Text, Input } from '@/web-library/common';
import ExpandTable from './ExpandTable';
import styles from './index.module.less';

const SelectIndexView = (props: any) => {
  const { value, onChange } = props;
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState({ name_pattern: '' });
  const [dataSource, setDataSource] = useState<any>([]);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
  const [tablePagination, setTablePagination] = useState<any>(PAGINATION_DEFAULT);

  const getDataIndexList = async (filter: any) => {
    const queryData = {
      limit: -1,
      offset: 0,
      direction: 'asc',
      sort: 'name',
      process_status: '',
      ...filter,
    };
    const res = await apiService.axiosGetEncode('/api/mdl-index-base/v1/index_bases', queryData);

    const { totalCount: total, entries: data } = formatKeyOfObjectToCamel(res);
    return { total, data };
  };

  useEffect(() => {
    if (open) {
      const curRow = _.isArray(value) ? value : value ? [value] : [];
      const curRowKeys = _.isArray(value) ? _.map(value, (item: any) => item?.id) : value ? [value] : [];

      setSelectedRow(curRow);
      setSelectedRowKeys(curRowKeys);
      getDataList({ pageSize: tablePagination?.pageSize, current: 1, _filter: {} });
      return;
    }

    setTablePagination(PAGINATION_DEFAULT);
  }, [open]);

  const getDataList = async ({ pageSize, current, _filter }: any, _?: any, sorter?: any): Promise<void> => {
    const res = await getDataIndexList(_filter ? _filter : filter);
    const { total, data } = res;

    setDataSource(data);
    setTablePagination({ ...tablePagination, total, pageSize, current, sorter });
  };

  const onChangeFilterName = _.debounce((data) => {
    const value = data.target.value;
    const newFilter = { ...filter, name_pattern: value };
    setFilter(newFilter);
    getDataList({ pageSize: 10, current: 1, _filter: newFilter });
  }, 300);

  const logWareHouseExpandData = ({ tags, dataType, category, modelName, docsCount, comment }: any) => {
    return [
      {
        name: intl.get('Global.tag'),
        content: tags.length ? _.map(tags, (value: any, index: any) => <Tag key={index.toString()}>{value}</Tag>) : '--',
      },
      { name: intl.get('Global.comment'), content: comment || '--' },
      { name: intl.get('MetricModel.modelName'), content: modelName },
      { name: intl.get('MetricModel.dataType'), content: dataType },
      { name: intl.get('MetricModel.category'), content: category },
      { name: intl.get('MetricModel.docsCount'), content: docsCount },
    ];
  };

  /** 切换侧边栏的的展示状态 */
  const toggleDrawer = (visible: boolean) => {
    setOpen(visible);
    if (!visible) setFilter({ name_pattern: '' });
  };

  /** 表格的选中状态 */
  const onSelectChange = (record: any) => {
    setSelectedRowKeys([record.baseType]);
    setSelectedRow([record]);
  };

  /** 删除选中项 */
  const onDelete = (val: any): void => {
    onChange && onChange(value?.filter((item: any) => item.baseType !== val));
  };

  useEffect(() => {
    if (_.isString(value)) handleClickConfirm(value);
  }, [value]);
  /** 确定选择 */
  const handleClickConfirm = async (value?: any): Promise<void> => {
    let selected: any = null;
    if (value) {
      const result = await getDataIndexList({});
      selected = _.filter(result?.data, (item) => item.baseType === value);
    }

    onChange && onChange(value ? selected : selectedRow);
    toggleDrawer(false);
  };

  const columns = [
    { title: intl.get('Global.name'), dataIndex: 'name', sorter: true },
    { title: intl.get('Global.comment'), dataIndex: 'comment', render: (item: any): string => item || '--' },
  ];
  const tableOperationColumns = [
    ..._.map(columns, (item) => _.omit(item, 'sorter')),
    {
      title: intl.get('Global.operation'),
      render: (record: any) => {
        return <Button.Link onClick={() => onDelete(record.baseType)}>{intl.get('Global.delete')}</Button.Link>;
      },
    },
  ];

  return (
    <div>
      <Button onClick={() => toggleDrawer(true)}>{intl.get('Global.addIndexBase')}</Button>
      {_.isArray(value) && value?.length > 0 && (
        <div className={styles['index-view-table']}>
          <ExpandTable
            rowKey="baseType"
            columns={tableOperationColumns}
            dataSource={value}
            pagination={false}
            expandData={(data: any) => logWareHouseExpandData(data)}
            noSelection
          />
        </div>
      )}
      <Drawer
        className={styles['model-settings-select-index-view-root']}
        open={open}
        title={intl.get('Global.chooseDataView')}
        width={1000}
        maskClosable={true}
        onClose={() => toggleDrawer(false)}
      >
        <div className={styles['select-index-view-table-container']}>
          <Title className="g-mb-2">{intl.get('Global.filterCondition')}</Title>
          <div className="g-mb-6 g-ml-4 g-flex-align-center">
            <Text>{intl.get('Global.name')}：</Text>
            <Input.Search style={{ width: 400 }} allowClear onChange={onChangeFilterName} />
          </div>
          <ExpandTable
            rowKey="baseType"
            columns={columns}
            dataSource={dataSource}
            pagination={tablePagination}
            selectedRowKeys={selectedRowKeys}
            expandData={(data: any) => logWareHouseExpandData(data)}
            onChange={getDataList}
            onSelectChange={(record: any) => onSelectChange(record)}
          />
        </div>
        <div className={styles['select-index-view-footer']}>
          <Button className="g-mr-2" onClick={() => toggleDrawer(false)}>
            {intl.get('Global.cancel')}
          </Button>
          <Button type="primary" disabled={!selectedRow.length} onClick={() => handleClickConfirm()}>
            {intl.get('Global.ok')}
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default SelectIndexView;
