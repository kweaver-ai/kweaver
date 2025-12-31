import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { CaretRightOutlined } from '@ant-design/icons';
import { useAsyncEffect } from 'ahooks';
import _ from 'lodash';
import api from '@/services/data-analysis/metric-model';
import { Button, Drawer, Input, Table, IconFont, Title, Text } from '@/web-library/common';
import Detail, { logWareHouseExpandData } from './Detail';
import styles from './index.module.less';

const paginationDefault = {
  current: 1,
  pageSize: 10,
  total: 0,
  size: 'small',
  pageSizeOptions: ['10', '20', '50'],
  showSizeChanger: true,
  showQuickJumper: true,
};

const SelectModel = (props: any) => {
  const { value, onChange } = props;
  const [open, setOpen] = useState(false); // 侧边栏控制字段
  const [filter, setFilter] = useState({ namePattern: '' });
  const [dataSource, setDataSource] = useState<any>([]); // 表格数据
  const [selectedRow, setSelectedRow] = useState<any>([]); // 选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]); // 选中行 keys
  const [tablePagination, setTablePagination] = useState<any>(paginationDefault); // 表格的 pagination 数据

  /** 获取选择数据视图 */
  const getDataViewList: any = async (filter = {}) => {
    const res = await api.getMetricModelList({ limit: -1, queryType: ['sql'], ...filter });
    const { totalCount: total, entries } = res;
    return { data: entries, total };
  };

  useEffect(() => {
    if (open) {
      const curRow = _.isArray(value) ? value : value ? [value] : [];
      const curRowKeys = _.isArray(value) ? value.map((item: any) => item?.id) : value ? [value] : [];

      setSelectedRow(curRow);
      setSelectedRowKeys(curRowKeys);
      getDataList({ pageSize: tablePagination?.pageSize, current: 1, _filter: {} });
      return;
    }

    setTablePagination(paginationDefault);
  }, [open]);

  const getDataList = async ({ pageSize, current, _filter }: any, _?: any, sorter?: any): Promise<void> => {
    const res = await getDataViewList(_filter ? _filter : filter);
    const { total, data } = res;

    setDataSource(data);
    setTablePagination({ ...tablePagination, total, pageSize, current, sorter });
  };

  const onChangeFilterName = _.debounce((data) => {
    const value = data.target.value;
    const newFilter = { ...filter, namePattern: value };
    setFilter(newFilter);
    getDataList({ pageSize: 10, current: 1, _filter: newFilter });
  }, 300);

  /** 切换侧边栏的的展示状态 */
  const toggleDrawer = (visible: boolean) => {
    setOpen(visible);
    if (!visible) setFilter({ namePattern: '' });
  };

  /** 表格的选中状态 */
  const onSelectChange = (record: any) => {
    setSelectedRowKeys([record?.id]);
    setSelectedRow([record]);
  };

  /** 删除选中项 */
  const onDelete = (data: any) => {
    if (onChange) onChange(value?.filter((item: any) => item?.id !== data));
  };

  useEffect(() => {
    if (_.isString(value)) handleClickConfirm(value);
  }, [value]);
  /** 确定选择 */
  const handleClickConfirm = async (value?: any) => {
    const data = await api.getMetricModelById(value ? [value] : selectedRowKeys);
    const newData = _.map([data], (item: any) => {
      if (value) item.__isEdit = true;
      return item;
    });
    if (onChange) onChange(newData);
    toggleDrawer(false);
  };

  const columns = [
    Table.SELECTION_COLUMN,
    Table.EXPAND_COLUMN,
    { dataIndex: 'name', title: intl.get('Global.name'), sorter: true },
    { dataIndex: 'groupName', title: intl.get('Global.groupName'), render: (text: any): string => text || '--' },
  ];

  const [isExpandAll, setIsExpandAll] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [expandedRowData, setExpandedRowData] = useState<any>([]);

  useAsyncEffect(async () => {
    if (expandedRowKeys.length) {
      const data = await api.getMetricModelById(expandedRowKeys);
      setExpandedRowData([data]);
    }
  }, [expandedRowKeys]);

  /** 展开的行变化时触发 */
  const onExpandedRowsChange = (expandedRows: any): void => {
    setExpandedRowKeys(expandedRows);
  };
  /** 全部展开 */
  const handleExpandAll = (): void => {
    setExpandedRowKeys(dataSource.map((item: any) => item.id));
    setIsExpandAll(true);
  };
  /** 全部收起 */
  const handleCollapseAll = (): void => {
    setExpandedRowKeys([]);
    setIsExpandAll(false);
  };

  const expandedRowRender = (record: any) => {
    const curItem = _.filter(expandedRowData, (item: any) => item.id === record.id);
    const data = curItem.length ? logWareHouseExpandData(curItem[0]) : [];

    return (
      <div className="g-p-2">
        {_.map(data, (item: any, index) => {
          const { name, content } = item;
          return (
            <div key={index} className="g-p-1 g-ellipsis-1" style={{ flexBasis: '100%' }} title={content}>
              {!!name && <span>{name}：</span>}
              <span>{content || '--'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <Button onClick={() => toggleDrawer(true)}>{intl.get('MetricModel.selectAtomicMetric')}</Button>
      <Detail dataSource={value} deleteItem={onDelete} />
      <Drawer
        className={styles['model-settings-select-model-root']}
        open={open}
        width={1000}
        title={intl.get('MetricModel.selectAtomicMetric')}
        maskClosable={true}
        onClose={() => toggleDrawer(false)}
      >
        <div className={styles['select-model-table-container']}>
          <Title className="g-mb-2">{intl.get('Global.filterCondition')}</Title>
          <div className="g-mb-6 g-ml-4 g-flex-align-center">
            <Text>{intl.get('Global.name')}：</Text>
            <Input.Search style={{ width: 400 }} allowClear onChange={onChangeFilterName} />
          </div>

          <Table
            size="small"
            rowKey="id"
            bordered={false}
            columns={columns}
            dataSource={dataSource}
            pagination={tablePagination}
            rowSelection={{ type: 'radio', selectedRowKeys, onSelect: onSelectChange }}
            expandable={{
              expandRowByClick: true,
              expandedRowKeys,
              expandedRowRender,
              onExpandedRowsChange,
              columnTitle: (
                <IconFont
                  className="g-ml-2"
                  type={isExpandAll ? 'icon-caidanzhankaibeifen' : 'icon-caidanzhankai'}
                  onClick={isExpandAll ? handleCollapseAll : handleExpandAll}
                />
              ),
              expandIcon: (props) => (
                <CaretRightOutlined
                  style={{ color: 'rgba(0, 0, 0, .45)', transform: props.expanded ? 'rotate(90deg)' : 'rotate(0)' }}
                  onClick={(e) => props.onExpand(props.record, e)}
                />
              ),
            }}
            onChange={getDataList}
          />
        </div>
        <div className={styles['select-model-footer']}>
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

export default SelectModel;
