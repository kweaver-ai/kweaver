import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { message } from 'antd';

import HOOKS from '@/hooks';
import * as benchmarkTaskService from '@/services/benchmarkTask';

import { DeleteModal } from '@/components/TipModal';

import TaskTable from './TaskTable';
import RunDetail from './RunDetail';
import RunModal from './RunModal';
import { benchmarkConfig, SIZE } from './enums';

import './style.less';

const { useRouteCache, useAdHistory } = HOOKS;

const BenchMarkTask: React.FC = () => {
  const history = useAdHistory();
  const [dataSource, setDataSource] = useState<any[]>([]); // 表格数据
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const [configOptions, setConfigOptions] = useState([...benchmarkConfig]); // 任务列表
  const [detailData, setDetailData] = useState<{ visible?: boolean; runModal?: boolean; record: any; data: any }>({
    visible: false,
    runModal: false,
    record: '',
    data: {},
  }); // 详情弹窗
  const [listProps, setListProps] = useState({
    config_id: routeCache?.config_id || 'all',
    algorithm_type: routeCache?.algorithm_type || 'all',
    status: routeCache?.status || 'all',
    rule: routeCache?.rule || 'update_time',
    order: routeCache?.order || 'desc',
    loading: false,
    name: routeCache?.name || '',
    page: routeCache.page ?? 1,
    size: SIZE,
    activeRowKey: routeCache.activeRowKey ?? '',
  });

  const [selectedRow, setSelectedRow] = useState<any>({});

  useEffect(() => {
    getTaskList({ ...listProps });
  }, [listProps.algorithm_type, listProps.status, listProps.order, listProps.rule, listProps.config_id, listProps.page, listProps.size]);

  /** 获取任务列表 */
  const getTaskList = async (state: any) => {
    try {
      setListProps(prevState => ({ ...prevState, ...state, loading: true }));
      const body: any = onHandleParam({ ...listProps, ...state });
      const result = await benchmarkTaskService.benchmarkTaskList(body);
      setListProps(prevState => ({ ...prevState, ...state, total: result?.total }));
      if (_.isEmpty(result?.res) && body.page !== 1) {
        setListProps(prevState => ({ ...prevState, ...state, page: body.page - 1 }));
        return;
      }

      // 配置下拉列表后端返回
      const configList = _.map(result?.benchmark_config_list, item => ({
        key: item?.id,
        value: item?.id,
        text: item?.name,
      }));
      setDataSource(result?.res);
      setConfigOptions([...benchmarkConfig, ...configList]);
      onLoadingFalse();
    } catch (err) {
      onLoadingFalse();
    }
  };

  /**
   * 列表参数处理
   */
  const onHandleParam = (data: any) => {
    const { name, config_id, algorithm_type, status, rule, order, page, size }: any = { ...data };
    const body: any = { rule, order, page, size };
    if (name) body.name = name;
    if (config_id !== 'all') body.config_id = config_id;
    if (algorithm_type !== 'all') body.algorithm_type = algorithm_type;
    if (status !== 'all') body.status = status;
    return body;
  };

  /**
   * 关闭loading
   */
  const onLoadingFalse = () => {
    setListProps(prevState => ({ ...prevState, loading: false }));
  };

  /** 点击操作项目 */
  const onClickOpMenu = async (key: string, record: any) => {
    switch (key) {
      case 'delete':
        onDelete(record);
        break;
      case 'run':
      case 'stop':
        if (_.includes([1, 2], record?.status)) {
          runTask(record);
        } else {
          setDetailData({ runModal: true, record, data: [] });
        }
        break;
      case 'edit':
      case 'view':
      case 'copy':
        onEdit(record, key);
        break;
      case 'detail':
        setSelectedRow(record);
        onViewEunDetail(record);
        break;
      default:
        break;
    }
  };

  /**
   * 获取状态详情
   */
  const onViewEunDetail = async (record: any) => {
    try {
      const { res } = await benchmarkTaskService.getTaskStatus({ id: record?.id });
      setDetailData({ visible: true, record, data: res });
    } catch (err: any) {
      const { Description } = err?.response || err?.data || err || {};
      Description && message.error(Description);
    }
  };

  /**
   * 编辑或查看任务
   */
  const onEdit = (record: any, type: 'view' | 'edit' | 'copy') => {
    setRouteCache({
      name: listProps.name,
      algorithm_type: listProps.algorithm_type,
      status: listProps.status,
      order: listProps.order,
      rule: listProps.rule,
      config_id: listProps.config_id,
      page: listProps.page,
      size: listProps.size,
      activeRowKey: record.id,
    });
    history.push(`/effect-evaluation/create-task?action=${type}&id=${record?.id}&status=${record?.status}`);
  };

  /**
   * 运行
   */
  const runTask = async (record: any, dataCheck?: any, isStopRestart = false) => {
    try {
      const isStop = _.includes([1, 2], record?.status);
      // 先判断任务状态 运行中则终止，否则运行
      const serviceFun = isStop ? benchmarkTaskService.stopBenchmarkTask : benchmarkTaskService.runBenchmarkTask;
      let body: any = { id: record?.id };
      if (!isStop) {
        body = { ...body, algorithm_type: record?.algorithm_type, algorithm_run: record?.algorithm };
      }

      const result = await serviceFun(body);
      if (result?.res) {
        if (!isStop) {
          message.success(intl.get('benchmarkTask.taskRun'));
          getTaskList({});
        } else {
          if (isStop && isStopRestart) {
            runTask({ ...detailData?.record, status: 0 }, dataCheck, false);
            return;
          }
          const msg = intl.get(`benchmarkTask.${isStop ? 'stop' : 'taskRun'}`);
          message.success(msg);
          getTaskList({});
        }
        setDetailData({ visible: false, runModal: false, record: '', data: '' });
      }
    } catch (err: any) {
      //
    }
  };

  /**
   * @param record 删除
   * @returns
   */
  const onDelete = async (record: any) => {
    const isOk = await DeleteModal({
      isSingleDelete: true,
      content: (
        <>
          <span>{intl.get('benchmarkTask.taskDelete').split('|')[0]}</span>
          <span className='ad-c-bold ad-ellipsis' title={record.name} style={{ maxWidth: 160, verticalAlign: 'top', display: 'inline-block' }}>
            {record.name}
          </span>
          <span>{intl.get('benchmarkTask.taskDelete').split('|')[1]}</span>
        </>
      ),
      currentDeleteName: record.name || '',
      currentDeleteType: intl.get('delete.task'),
    });
    if (!isOk) return;
    try {
      const res = await benchmarkTaskService.deleteBenchmarkTask({ id: record?.id });
      if (res?.res) {
        setSelectedRow({});
        message.success(intl.get('global.deleteSuccess'));
        setSelectedRow({});
        getTaskList({});
      }
    } catch (err: any) {
      //
    }
  };

  return (
    <div className='BenchMarkTask ad-w-100'>
      <TaskTable
        listProps={listProps}
        setListProps={setListProps}
        dataSource={dataSource}
        configOptions={configOptions}
        onClickOpMenu={onClickOpMenu}
        setDetailData={setDetailData}
        onViewEunDetail={onViewEunDetail}
        getTaskList={getTaskList}
        setRouteCache={setRouteCache}
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
      />
      <RunDetail
        visible={detailData?.visible}
        detailData={detailData}
        onCancel={() => setDetailData({ visible: false, record: '', data: '' })}
        runTask={runTask}
      />
      <RunModal
        visible={detailData?.runModal}
        onCancel={() => setDetailData({ ...detailData, runModal: false, record: '', data: '' })}
        record={detailData}
        runTask={runTask}
      />
    </div>
  );
};

export default BenchMarkTask;
