import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Dropdown, Empty, Modal } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { formatMsToHMS } from '@/utils/time';
import TaskType from '@/services/task/type';
import emptyImage from '@/assets/images/common/empty.png';
import noSearchResultImage from '@/assets/images/common/no_search_result.svg';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE, { KnowledgeNetworkType } from '@/services';
import { Title, Table, Select, Button, IconFont } from '@/web-library/common';
import CreateTask, { NewTaskFormValues } from './CreateTask';
import Detail from './Detail';
import styles from './index.module.less';

interface TProps {
  detail?: KnowledgeNetworkType.Detail;
  isPermission: boolean;
}

export const StateItem = ({ state, error }: { state: TaskType.StateEnum; error?: string }) => {
  const [errorOpen, setErrorOpen] = useState(false);
  const { TASK_STATE_LABELS } = HOOKS.useConstants();

  return (
    <>
      <div className={styles['task-state']}>
        <div className={classnames(styles['task-state-icon'], styles[state])}></div>
        <div className={styles['task-state']}>{TASK_STATE_LABELS[state]}</div>
        {(state === TaskType.StateEnum.failed || state === TaskType.StateEnum.canceled) && (
          <IconFont type="icon-dip-Details" onClick={() => setErrorOpen(true)} />
        )}
      </div>
      <Modal title={intl.get('Task.errorTitle')} open={errorOpen} onCancel={() => setErrorOpen(false)} footer={null}>
        <div className={styles['task-error']}>{error}</div>
      </Modal>
    </>
  );
};

const Task = (props: TProps) => {
  const { detail, isPermission } = props;
  const { modal, message } = HOOKS.useGlobalContext();
  const { pageState, pagination, onUpdateState } = HOOKS.usePageStateNew({
    direction: 'desc',
    sort: 'create_time',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [filterValues, setFilterValues] = useState<any>({ name: '', job_type: '', state: '' });
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);

  const knId = detail?.id || localStorage.getItem('KnowledgeNetwork.id')!;
  const { sort, direction } = pageState || {};

  // 使用全局 Hook 获取国际化常量
  const { TASK_MENU_SORT_ITEMS, JOB_TYPE_LABELS, JOB_TYPE_OPTIONS, TASK_STATE_LABELS, TASK_STATE_OPTIONS } = HOOKS.useConstants();

  useEffect(() => {
    if (!knId) return;
    getList();
  }, [knId]);

  /** 获取任务列表 */
  const getList = async (data?: any) => {
    try {
      setIsLoading(true);
      const _pageState = { ...pageState, ...data };
      const { page, limit, sort, direction, name_pattern, job_type, state } = _pageState;
      const params: any = { offset: limit * (page - 1), limit, sort, direction };
      if (name_pattern) params.name_pattern = name_pattern;
      if (job_type) params.job_type = job_type;
      if (state) params.state = state;
      const result = await SERVICE.task.taskGet(knId, params);
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

  /** 打开任务详情侧边栏 */
  const onOpenDetail = (sourceData = null) => setTaskDetail(sourceData);
  /** 打开任务详情侧边栏  */
  const onCloseDetail = () => setTaskDetail(null);

  /** 创建任务 */
  const onCreateTask = async (values: NewTaskFormValues) => {
    try {
      setCreateLoading(true);
      const res = await SERVICE.task.taskPost(knId, {
        name: values.name,
        job_type: values.jobType,
      });
      if (res?.id) {
        message.success(intl.get('Global.createSuccess'));
        setCreateTaskModalOpen(false);
        getList();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setCreateLoading(false);
    }
  };

  /** 创建任务弹窗打开 */
  const onOpenCreateTask = () => {
    setCreateTaskModalOpen(true);
  };

  /** 创建任务弹窗取消 */
  const onCancelCreateTask = () => {
    setCreateTaskModalOpen(false);
  };

  /** 删除 */
  const onDelete = async (taskId: string) => {
    try {
      await SERVICE.task.taskDelete(knId, taskId);
      getList();
      message.success(intl.get('Global.deleteSuccess'));
    } catch (error) {
      console.log(error);
    }
  };

  /** 删除 */
  const onDeleteConfirm = (record: any) => {
    if (!record?.id) return;
    modal.confirm({
      title: intl.get('Global.deleteConfirmTitle'),
      closable: true,
      icon: <ExclamationCircleFilled />,
      content: intl.get('Global.deleteConfirm', { name: `"${record?.name}"` }),
      okText: intl.get('Global.delete'),
      okType: 'danger',
      cancelText: intl.get('Global.cancel'),
      footer: (__: any, { OkBtn, CancelBtn }: any) => (
        <>
          <OkBtn />
          <CancelBtn />
        </>
      ),
      onOk: async () => {
        await onDelete(record.id);
      },
    });
  };

  /** 操作按钮 */
  const onOperate = (key: any, record: any) => {
    if (key === 'view') onOpenDetail(record);
    if (key === 'delete') onDeleteConfirm(record);
  };

  const columns: any = [
    {
      title: intl.get('Task.taskName'),
      dataIndex: 'name',
      fixed: 'left',
      width: 200,
      __fixed: true,
      __selected: true,
      render: (value: string, record: any) => (
        <div onClick={() => onOpenDetail(record)} style={{ cursor: 'pointer' }}>
          {value}
        </div>
      ),
    },
    {
      title: intl.get('Global.operation'),
      dataIndex: 'operation',
      fixed: 'left',
      width: 80,
      __fixed: true,
      __selected: true,
      render: (_value: any, record: any) => {
        const dropdownMenu: any = [
          { key: 'view', label: intl.get('Global.view'), visible: true },
          { key: 'delete', label: intl.get('Global.delete'), visible: isPermission },
        ];
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: dropdownMenu.filter((item: { visible: boolean }) => item.visible),
              onClick: (event: any) => {
                event.domEvent.stopPropagation();
                onOperate(event?.key, record);
              },
            }}
          >
            <Button.Icon icon={<EllipsisOutlined style={{ fontSize: 20 }} />} onClick={(event) => event.stopPropagation()} />
          </Dropdown>
        );
      },
    },
    {
      title: intl.get('Task.buildType'),
      dataIndex: 'job_type',
      width: 200,
      __selected: true,
      render: (value: TaskType.JobType) => {
        return <div className="g-flex-align-center">{JOB_TYPE_LABELS[value]}</div>;
      },
    },
    {
      title: intl.get('Task.taskStatus'),
      dataIndex: 'state',
      width: 200,
      __selected: true,
      render: (value: TaskType.StateEnum, record: any) => {
        return <StateItem error={record?.state_detail} state={value} />;
      },
    },
    { title: intl.get('Global.modifier'), dataIndex: 'creator', width: 200, __selected: true, render: (value: { name: string }) => value?.name || '--' },
    {
      title: intl.get('Task.taskDuration'),
      dataIndex: 'time_cost',
      width: 200,
      __selected: true,
      sorter: true,
      render: (text: any): string => (text ? formatMsToHMS(text) : '--'),
    },
    {
      title: intl.get('Global.createTime'),
      dataIndex: 'create_time',
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
    <div className={styles['task-root']}>
      <Title>{intl.get('Global.taskManagement')}</Title>
      <Table.PageTable
        name="task"
        rowKey="id"
        columns={columns}
        loading={isLoading}
        dataSource={dataSource}
        pagination={pagination}
        onChange={onTableChange}
        locale={{
          emptyText:
            filterValues.name_pattern || filterValues.state !== 'all' || filterValues.job_type !== 'all' ? (
              <Empty image={noSearchResultImage} description={intl.get('Global.emptyNoSearchResult')} />
            ) : (
              <Empty image={emptyImage} description={intl.get('Task.emptyDescription')} />
            ),
        }}
      >
        <Table.Operation
          nameConfig={{ key: 'name_pattern', placeholder: intl.get('Global.searchName') }}
          sortConfig={{ items: TASK_MENU_SORT_ITEMS, order: direction, rule: sort, onChange: onSortChange }}
          initialFilter={filterValues}
          onChange={onChangeFilter}
          onRefresh={() => getList({ page: 1 })}
        >
          {isPermission && <Button.Create onClick={onOpenCreateTask} loading={createLoading} />}
          <Select.LabelSelect key="job_type" label={intl.get('Task.buildType')} defaultValue="all" style={{ width: 190 }} options={JOB_TYPE_OPTIONS} />
          <Select.LabelSelect key="state" label={intl.get('Task.taskStatus')} defaultValue="all" style={{ width: 190 }} options={TASK_STATE_OPTIONS} />
        </Table.Operation>
      </Table.PageTable>
      <Detail open={!!taskDetail} knId={knId} taskId={taskDetail?.id} onClose={onCloseDetail} />
      <CreateTask detail={detail} open={createTaskModalOpen} onCancel={onCancelCreateTask} onOk={onCreateTask} confirmLoading={createLoading} />
    </div>
  );
};

export default Task;
