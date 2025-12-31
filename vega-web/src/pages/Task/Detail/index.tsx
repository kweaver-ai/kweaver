import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Empty } from 'antd';
import dayjs from 'dayjs';
import { formatMsToHMS } from '@/utils/time';
import TaskType from '@/services/task/type';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Drawer, Table, Select } from '@/web-library/common';
import { StateItem } from '..';

interface DetailProps {
  open: boolean;
  knId: string;
  taskId: string;
  onClose: () => void;
}

const Detail: React.FC<DetailProps> = ({ open, knId, taskId, onClose }) => {
  const [isLoading, setIsLoading] = useState<any>(null);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [filterValues, setFilterValues] = useState<any>({ name_pattern: '', concept_type: '', state: '' });
  const { pageState, pagination, onUpdateState } = HOOKS.usePageStateNew({
    direction: 'desc',
    sort: 'start_time',
  });
  const { sort, direction } = pageState || {};

  // 使用全局 Hook 获取国际化常量
  const { TASK_DETAIL_MENU_SORT_ITEMS, CONCEPT_TYPE_LABELS, CONCEPT_TYPE_OPTIONS, TASK_STATE_OPTIONS } = HOOKS.useConstants();

  useEffect(() => {
    if (!taskId) return;
    if (open) {
      getList();
    } else {
      setDataSource([]);
    }
  }, [taskId, open]);

  const getList = async (data?: any) => {
    try {
      setIsLoading(true);
      const _pageState = { ...pageState, ...data };
      const { page, limit, sort, direction, name_pattern, concept_type, state } = _pageState;
      const params: any = { offset: limit * (page - 1), limit, sort, direction };
      if (name_pattern) params.name_pattern = name_pattern;
      if (concept_type) params.concept_type = concept_type;
      if (state) params.state = state;
      const result = await SERVICE.task.taskGetDetail(knId, taskId, params);
      const { entries = [], total_count = 0 } = result || {};
      setDataSource(entries);
      onUpdateState({ ...params, ..._pageState, count: total_count });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  /** 筛选 */
  const onChangeFilter = (values: any) => {
    getList({ page: 1, ...values });
    setFilterValues(values);
  };

  /** 排序 */
  const onSortChange = (data: any) => {
    const state = { sort: data.key, direction: data.key !== sort ? 'desc' : direction === 'desc' ? 'asc' : 'desc' };
    getList(state);
  };

  /** table的翻页、筛选、排序变更 */
  const onTableChange = (pagination: any, _filters: any, sorter: any) => {
    const { field, order } = sorter;
    const { current, pageSize } = pagination;
    const stateOrder = ENUMS.SORT_ENUM[order as keyof typeof ENUMS.SORT_ENUM] || 'desc';
    const state = { page: current, limit: pageSize, sort: field || sort, direction: stateOrder };
    onUpdateState(state);
    getList(state);
  };

  const columns: any = [
    {
      title: intl.get('Global.type'),
      dataIndex: 'concept_type',
      width: 200,
      __selected: true,
      render: (value: TaskType.conceptTypeEnum) => {
        return <div className="g-flex-align-center">{CONCEPT_TYPE_LABELS[value]}</div>;
      },
    },
    {
      title: intl.get('Task.className'),
      dataIndex: 'name',
      width: 200,
      __selected: true,
    },
    {
      title: intl.get('Task.buildCount'),
      dataIndex: 'doc_count',
      width: 200,
      __selected: true,
    },
    {
      title: intl.get('Global.status'),
      dataIndex: 'state',
      width: 200,
      __selected: true,
      render: (value: TaskType.StateEnum, record: any) => {
        return <StateItem state={value} error={record?.state_detail} />;
      },
    },
    {
      title: intl.get('Task.taskDuration'),
      dataIndex: 'time_cost',
      width: 200,
      __selected: true,
      sorter: true,
      render: (text: any): string => (text ? formatMsToHMS(text) : '--'),
    },
    {
      title: intl.get('Global.startTime'),
      dataIndex: 'start_time',
      width: 200,
      __selected: true,
      sorter: true,
      render: (text: any): string => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
    {
      title: intl.get('Global.endTime'),
      dataIndex: 'finish_time',
      width: 200,
      __selected: true,
      sorter: true,
      render: (text: any): string => (text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '--'),
    },
  ];

  return (
    <Drawer open={open} width={1200} title={intl.get('Task.taskDetail')} onClose={onClose} maskClosable={true}>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <Table.PageTable
          name="taskDetail"
          rowKey="id"
          columns={columns}
          loading={isLoading}
          dataSource={dataSource}
          pagination={pagination}
          onChange={onTableChange}
          locale={{
            emptyText:
              filterValues.name_pattern || filterValues.state !== 'all' || filterValues.concept_type !== 'all' ? (
                <Empty image={noSearchResultImage} description={intl.get('Global.emptyNoSearchResult')} />
              ) : (
                <Empty image={emptyImage} description={intl.get('Task.emptyDescription')} />
              ),
          }}
        >
          <Table.Operation
            nameConfig={{ key: 'name_pattern', placeholder: intl.get('Task.searchClassName') }}
            sortConfig={{ items: TASK_DETAIL_MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
            initialFilter={filterValues}
            onChange={onChangeFilter}
            onRefresh={() => getList({ page: 1 })}
          >
            <Select.LabelSelect key="concept_type" label={intl.get('Global.type')} defaultValue="all" style={{ width: 190 }} options={CONCEPT_TYPE_OPTIONS} />
            <Select.LabelSelect key="state" label={intl.get('Global.status')} defaultValue="all" style={{ width: 190 }} options={TASK_STATE_OPTIONS} />
          </Table.Operation>
        </Table.PageTable>
      </div>
    </Drawer>
  );
};

export default Detail;
