import { useEffect, useMemo, useRef, useState } from 'react';

import _ from 'lodash';
import axios from 'axios';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Button, Form, Input, message, Select, Tooltip } from 'antd';

import HOOKS from '@/hooks';
import { ONLY_KEYBOARD } from '@/enums';
import AdSpin from '@/components/AdSpin';
import AdBadge from '@/components/AdBadge';
import AdUpload from '@/components/AdUpload';
import TipModal from '@/components/TipModal';
import IconFont from '@/components/IconFont';
import AdIconList from '@/components/AdIconList';
import EmptySvg from '@/assets/images/empty.svg';
import { knowModalFunc } from '@/components/TipModal';
import AdExitBar from '@/components/AdExitBar/AdExitBar';
import importError from '@/assets/images/ImportError.svg';
import ParamCodeEditor from '@/components/ParamCodeEditor';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { copyToBoardArea, getParam } from '@/utils/handleFunction';

import { dataSetFilesInitUpload } from '@/services/dataSet';
import { downloadAdapterFileTemplate, getBenchmarkConfigList } from '@/services/benchmark';
import {
  adapterUploadEnd,
  createBenchmarkTask,
  deleteBenchmarkFile,
  editBenchmarkTask,
  dataSetFilesDownLoad,
  getBenchTaskById,
  runBenchmarkTask,
  getTaskStatus,
} from '@/services/benchmarkTask';

import RunDetail from '../RunDetail';
import AlgorithmSelector from './AlgorithmSelector';
import { DEFAULT_ICON, TASK_ICON_LIST } from './enums';
import { onAlgorithmError, onHandleConfigNameToId, onHandleParam, getAlgorithm } from './assistFunction';
import { algorithmType, MODEL_TYPE, STATUS_COLOR, COMMON_HANDLE_TYPE, AGENT } from '@/pages/Benchmark/BenchmarkTasks/enums';

import './style.less';
import useLatestState from '@/hooks/useLatestState';

const CreateBenchmarkTask = () => {
  const [form] = Form.useForm();
  const editorRef = useRef<any>(null);
  const oldAdapterRef = useRef<any>();
  const history = HOOKS.useAdHistory();

  const [isError, setIsError] = useState(''); // 文件上传错误图标展示 error | empty
  const [adapter, setAdapter] = useState<any>(''); // 文件对象存储id
  const [taskInfo, setTaskInfo] = useState<any>();
  const [algType, setAlgType] = useState<number>(0); // 算法类型
  const [saveLoading, setSaveLoading, getSaveLoading] = useLatestState(false);
  const [isExit, setIsExit] = useState(false);
  const [isChange, setIsChange] = useState(false); // 内容改变-判断退出是否需要弹窗还是直接退出
  const [isUpload, setIsUpload] = useState(false); // 是否点击了上传按钮
  const [isRunLoading, setIsRunLoading, getIsRunLoading] = useLatestState(false); // 点击运行后加载loading
  const [isEditViewLoading, setIsEditViewLoading] = useState(false); // 编辑&查看进入loading
  const [isValidate, setIsValidate] = useState<boolean>(false); // 是否操作更改
  const [isAdapterLoading, setIsAdapterLoading] = useState(false); // adapter加载完毕
  const [tasksArr, setTasksArr] = useState<any>([]);
  const [fileList, setFileList] = useState<any[]>([]); // 上传文件列表
  const [algChange, setAlgChange] = useState<any>(false); // 评估对象类型切换
  const [saveAlgorithm, setSaveAlgorithm] = useState<any>([]); // 算法
  const [benConfigList, setBenConfigList] = useState<any[]>([]); // benchmark配置列表
  const [saveCustomData, setSaveCustomData] = useState<any>([]); // 使用的自定义数据
  const [selectFile, setSelectFile] = useState({ content: '', name: '' });
  const [detailData, setDetailData] = useState<{ visible: boolean; record: any; data: any }>({
    visible: false,
    record: '',
    data: {},
  }); // 详情弹窗
  const isView = getParam('action') === 'view';
  const backHome = useRef<boolean>(false);
  const benchmarkTaskId = useRef(getParam('id') ?? '');
  const benchmarkCopyTaskId = useRef<any>(''); // 复制任务id

  const { currentAction, currentStatus } = useMemo(() => {
    return { currentAction: getParam('action'), currentStatus: parseInt(getParam('status')) };
  }, [getParam(['status', 'action'])]);

  const oldFormValues = useRef<any>({});
  useEffect(() => {
    getBenchMarkConfig();
    if (benchmarkTaskId.current) getTaskDetails();
  }, []);

  /** 获取任务详情 */
  const getTaskDetails = async () => {
    setAlgChange(true);
    setIsEditViewLoading(true);
    setIsAdapterLoading(true);

    try {
      const { res } = await getBenchTaskById({ id: benchmarkTaskId.current });
      if (res) {
        setTaskInfo(res);
        const { name, benchmark_config, algorithm_type, adapter, description, color, algorithm } = res;

        let reduceTasks: any = {};
        _.map(_.cloneDeep(algorithm), (alg: any) => {
          reduceTasks = { ...reduceTasks, [alg.task_id]: { id: alg.task_id, name: alg.task_name } };
        });
        setTasksArr(Object.values(reduceTasks));
        // 自定义
        if (algorithm_type === 3) setSaveCustomData(algorithm);

        // 接口返回数据格式处理成页面所需要的
        const alg = getAlgorithm(algorithm_type, algorithm);
        if (!_.isEmpty(adapter)) oldAdapterRef.current = adapter?.[0];

        setAlgType(algorithm_type);
        oldFormValues.current = {
          name: currentAction === 'copy' ? `${name}的副本` : name,
          algorithm_type,
          description,
          color,
          algorithm: alg,
          config_id: benchmark_config,
        };
        oldFormValues.current.algorithm = _.map(oldFormValues.current.algorithm, item => {
          let tag = '';
          if (item.version === 'v0' && item.status === 'unpublished') {
            tag = intl.get('benchmarkTask.draft');
          }
          if (item.version !== 'v0' && item.status === 'unpublished') {
            tag = intl.get('benchmarkTask.unpublishedChanges');
          }
          if (item.status === 'published') {
            tag = intl.get('benchmarkTask.published');
          }

          item.title = `${item.title}${tag ? `(${tag})` : ''}`;
          return item;
        });

        form.setFieldsValue(oldFormValues.current);
        setSaveAlgorithm(alg);
        if (adapter?.[0]) {
          setAdapter(adapter?.[0]);
          if (getParam('action') === 'copy') {
            onFileDownLoad(adapter, true);
          } else {
            onFileDownLoad(adapter);
          }
          return;
        }
        setIsAdapterLoading(false);
      }
    } catch (err) {
      setIsEditViewLoading(false);
    }
  };

  /**
   * 使用数据集下载接口预览文件
   * @param isEdit // true-编辑进入时获取文件重新调用上传接口
   */
  const onFileDownLoad = async (data: any, isCopy = false) => {
    try {
      const [key, fileName] = data;
      const { res } = await dataSetFilesDownLoad({ upload_type: 0, key, name: fileName });
      if (res) {
        const { url } = res;
        const result = await axios.get(url);

        if (!_.isEmpty(result?.data)) {
          // 复制进入重新上传adapter，避免与要复制的文件有相同id，影响操作
          if (isCopy) {
            const blob = new Blob([result?.data], { type: 'text/x-python' });
            const file = new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
            onStartToUploadFile(file, null, null, null, true);
          } else {
            setSelectFile({ content: result?.data, name: fileName });
            const files = { name: fileName, uid: '2', status: 'done' };
            form.setFieldsValue({ adapter: [files] });
            !isUpload && setFileList([files]);
            setIsAdapterLoading(false);
          }
        } else {
          setIsError('empty');
          setIsAdapterLoading(false);
        }
      }
    } catch (err) {
      setIsAdapterLoading(false);
    }
  };

  /** 获取benchmark配置列表 */
  const getBenchMarkConfig = async () => {
    try {
      const res = await getBenchmarkConfigList({ page: 1, size: 1000, sort_order: 'desc', sort_field: 'create_time' });
      if (!_.isEmpty(res)) setBenConfigList(res?.res);
    } catch (err) {
      // console.log('err', err)
    }
  };

  /**
   * 文件上传前操作(判断文件大小|类型)
   */
  const beforeUpload = (file: any) => {
    const isSizeValid = file.size <= 2 * 1024 * 1024; // 2MB
    setIsChange(true);
    const name = file?.name?.split('.');
    // 某些浏览器对于file.status的解析不正确，因此没用file.status来做判断
    if (name?.[name?.length - 1] !== 'py' || !isSizeValid) {
      setIsError('');
      message.warning(intl.get(`${!isSizeValid ? 'benchmarkTask.fileSizeError' : 'benchmark.indicator.fileFormatErrorTip'}`));
      return false;
    }
    return true;
  };

  /**
   * 文件上传变化
   */
  const onFileChange = (status: string, info: any) => {
    setIsUpload(true);
    setIsChange(true);
    if (info.file.status === 'error') info.file.response = info.file?.error;
    setFileList([info.file]);
    switch (status) {
      case 'done':
        setIsError('');
        break;
      case 'error':
        setIsError('error');
        setAdapter('');
        break;
      case 'removed':
        if (oldAdapterRef?.current) {
          setFileList([]);
          setIsError('');
          setAdapter('');
          setSelectFile({ content: '', name: '' });
          return;
        }
        onRemove();
        break;
      default:
        break;
    }
  };

  /**
   * 开始上传文件
   */
  const onStartToUploadFile = async (file: any, config?: any, onError?: any, onSuccess?: any, isCopy = false) => {
    try {
      // upload_type和 unique_id均为固定值
      const res = await dataSetFilesInitUpload({ upload_type: 0, unique_id: '1764544435573624832' });
      // 成功后再根据返回的结果去调接口
      if (res) {
        const { authrequest, key } = res;
        const url = authrequest[1];
        const paramData: any = { AWSAccessKeyId: '', 'Content-Type': '', Policy: '', Signature: '', key: 0 };
        const formData = new FormData();
        authrequest.forEach((item: any, index: number) => {
          if (index > 1) {
            const [key, value] = item.split(':');
            paramData[key] = value;
          }
        });

        _.forEach(paramData, (item: any, index: string) => {
          formData.set(index, item);
        });

        formData.set('file', file);
        setAdapter(key);
        const result1 = await axios.post(url, formData, config);
        if (result1) {
          onEndToUploadFile(file, key, onSuccess, onError, isCopy);
        }
      }
    } catch (err) {
      setIsError('error');
      onError && onError(err);
      setIsAdapterLoading(false);
    }
  };

  /**
   * 上传结束
   */
  const onEndToUploadFile = async (file: any, key: any, onSuccess?: any, onError?: any, isCopy = false) => {
    try {
      const { res } = await adapterUploadEnd({ key, file_name: file?.name || '' });
      if (res) {
        setIsError('');
        setAdapter(key);
        if (isCopy) oldAdapterRef.current = key;
        onSuccess && onSuccess(file);
        onFileDownLoad([key, file?.name]);
        setIsAdapterLoading(false);
      }
    } catch (err) {
      setIsError('error');
      onError && onError(err);
      setIsAdapterLoading(false);
    }
  };

  /**
   * 文件移除
   */
  const onRemove = async (oldAdapter?: any) => {
    try {
      const { res } = await deleteBenchmarkFile({ key: oldAdapter || adapter });
      if (res) {
        if (!oldAdapter) {
          setIsError('');
          setAdapter('');
          setSelectFile({ content: '', name: '' });
          setFileList([]);
        }
        return true;
      }
    } catch (err: any) {
      if (!oldAdapter) {
        const { Description } = err?.response || err?.data || err || {};
        setFileList(
          _.map(fileList, (item: any) => {
            item.response = Description;
            item.status = 'error';
            return item;
          }),
        );
      }
      return true;
    }
  };

  /** 下载模板 */
  const onTemplateDownload = async () => {
    try {
      const { algorithm_type, algorithm, config_id } = form?.getFieldsValue();
      const body: any = { type: 'algorithm_adapter' };

      //  algorithm 只需要传递名字，大模型-模型名字_提示词名字
      let names: string[] = [];
      // 小模型 | agent(保存后传状态否则不传状态，例Agent名字：xxxx(草稿)) | 自定义 | 外部接入
      if (_.includes(COMMON_HANDLE_TYPE, algorithm_type)) {
        names = _.map(algorithm, item => {
          if (algorithm_type === AGENT && isChange) {
            const splitTitle = item?.title?.split(')')?.[0];
            return splitTitle?.split('(')?.[0];
          }
          const splitTitle = item?.title?.split(')')?.[0];
          return splitTitle?.split('(')?.[0];
        });
      }

      // 大模型
      if (_.includes([MODEL_TYPE.LLM], algorithm_type)) {
        _.map(algorithm, (item: any) => {
          _.map(item.children, (child: any) => {
            names = [...names, child?.name || `${child?.model_name}_${child?.prompt_name}`];
          });
        });
      }
      if (config_id) body.config_id = onHandleConfigNameToId(form?.getFieldsValue(), benConfigList);
      if (!_.isEmpty(names)) body.algorithm_name_list = names;
      await downloadAdapterFileTemplate(body);
    } catch (err) {
      //
    }
  };

  /**
   * @param type 运行 | 保存
   * @returns 运行需要先保存后运行
   */
  const onSubmit = async (type: 'save' | 'run' | 'saveCancel') => {
    return new Promise(resolve => {
      form.validateFields().then(async values => {
        setIsValidate(true);
        if (!values?.name?.trim()) {
          form.setFields([{ name: 'name', errors: [intl.get('global.noNull')] }]);
          resolve(false);
          return;
        }

        const checkAlgorithmError = onAlgorithmError(values);
        if (checkAlgorithmError?.error) {
          if (!checkAlgorithmError?.algorithm) message.error(intl.get('benchmarkTask.EvaluationNotEmty'));
          form.setFieldsValue({ algorithm: checkAlgorithmError?.algorithm });
          resolve(false);
          return;
        }

        const res = await onCreateAndUpdate(values, type);
        if (type === 'saveCancel') resolve(res);
      });
    });
  };

  /**
   * 新建 | 编辑更新
   */
  const onCreateAndUpdate = async (values: any, type: 'save' | 'run' | 'saveCancel') => {
    try {
      const body = onHandleParam(values, benConfigList, adapter);

      if (!body?.name) return false;
      setSaveLoading(true);
      let isSave = false;
      let dataCheck: any = [];
      if (isSave) {
        setSaveLoading(false);
        return false;
      }

      const isActionCopy = getParam('action') === 'copy';
      const callCondition = isActionCopy ? benchmarkCopyTaskId.current === benchmarkTaskId.current : benchmarkTaskId.current;

      const saveService = callCondition ? editBenchmarkTask : createBenchmarkTask;
      if (callCondition) body.task_id = benchmarkTaskId.current;
      // 临时处理，去掉选项的（）内容
      _.forEach(body.algorithm, item => {
        item.name = item.name?.split('(')[0];
      });
      const result = await saveService(body);
      setSaveLoading(false);
      if (result?.res) {
        if (isActionCopy) {
          benchmarkTaskId.current = result?.res?.id || benchmarkTaskId.current;
          benchmarkCopyTaskId.current = result?.res?.id || benchmarkCopyTaskId.current;
        } else if (!benchmarkTaskId.current) {
          benchmarkTaskId.current = result?.res?.id ?? getParam('id');
        }
        if (oldAdapterRef?.current && adapter !== oldAdapterRef?.current) {
          onRemove(oldAdapterRef?.current);
        }
        if (type === 'run') {
          setIsRunLoading(true);
          const res = await onRun(body);
          setIsRunLoading(false);
          if (res) {
            if (!_.isEmpty(dataCheck)) {
              knowModalFunc.open({
                title: intl.get('global.tips'),
                content: intl.get(`global.${body.algorithm.length > 1 ? 'runSuccessSomeButLimit' : 'runSuccessButLimit'}`),
                icon: <ExclamationCircleFilled className='ad-c-warning' />,
                onOk: () => {
                  message.success(intl.get('benchmarkTask.afterRunTip'));
                  history.push('/effect-evaluation?active=2');
                },
              });
            } else {
              message.success(intl.get('benchmarkTask.afterRunTip'));
              history.push('/effect-evaluation?active=2');
            }
          }
          return true;
        } else {
          message.success(intl.get('global.saveSuccess'));

          if (type === 'saveCancel') return true;
          return true;
        }
      }
      return false;
    } catch (err) {
      console.log('报了什么错', err);
      onHandleError(err);
      return false;
    }
  };

  /**
   * 运行
   */
  const onRun = (allValues: any) => {
    return new Promise(async resolve => {
      try {
        const benchmarkConfigIsPublished = _.filter(_.cloneDeep(benConfigList), (item: any) => item?.id === allValues?.config_id);
        const runRes = await runBenchmarkTask({
          id: benchmarkTaskId.current,
          published: benchmarkConfigIsPublished?.[0]?.published,
        });
        if (runRes) {
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        onHandleError(err);
        resolve(false);
      }
    });
  };

  const onHandleError = (err: any) => {
    const { Description, ErrorCode } = err?.response || err?.data || err || {};
    if (_.includes(['ADTask.BenchmarkTask.AddBenchmarkTask.NameExist', 'ADTask.BenchmarkTask.EditBenchmarkTask.NameExist'], ErrorCode)) {
      form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
    } else {
      Description && message.error(Description);
    }
    setSaveLoading(false);
  };

  /** 退出 */
  const onExit = () => {
    if (!isChange || isView) return history.push('/effect-evaluation?active=2');
    setIsExit(true);
  };

  /**
   * 保存并退出
   */
  const onSaveExit = async () => {
    let isPass: any = true;
    isPass = await onSubmit('saveCancel');
    setIsExit(false);
    if (isPass) history.goBack();
  };

  /**
   * 表单改变
   */
  const onFormChange = (change: any) => {
    const [name] = _.entries(change);
    if (name?.[0] === 'algorithm_type') form.resetFields(['algorithm']);

    setIsValidate(false);
  };

  const normFile = (e: any) => {
    if (_.isEmpty(e?.type)) {
      setFileList([]);
      return [];
    }
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const onCopy = () => {
    copyToBoardArea(selectFile?.content);
    message.success(intl.get('global.copySuccess'));
  };

  /**
   * 文件预览
   * @param isView // 是否是查看页面
   */
  const onPreviewFileContent = (isView: boolean) =>
    selectFile.name && (
      <div className={`ad-mb-${isView ? '0' : '6'}`} style={{ width: 630, marginLeft: isView ? 0 : 210 }}>
        {isView ? (
          <div className={classNames('ad-mb-1', { 'ad-pt-1': isView })}>
            <span className='ad-ellipsis' title={selectFile.name} style={{ display: 'inline-block', maxWidth: 200 }}>
              {selectFile.name}
            </span>
          </div>
        ) : null}
        <div className='previewBox'>
          <ParamCodeEditor className='functionCodeEditor' ref={editorRef} value={selectFile.content} disabled={true} height='334px' />
          <div className='ad-pointer copy-box' onClick={onCopy}>
            <IconFont type='icon-copy' />
          </div>
        </div>
      </div>
    );

  /**
   * 上传错误 | 数据为空展示
   */
  const onErrorEmptyShow = (
    <div className='ad-flex errorBox ad-mb-6'>
      <div className='ad-flex-column'>
        <img src={isError === 'error' ? importError : EmptySvg} alt='upload' />
        <div className='ad-content-center'>{isError === 'error' ? intl.get('global.fileFailed') : intl.get('benchmarkTask.noData')}</div>
      </div>
    </div>
  );

  /**
   * 保存|运行按钮点击后状态变化
   */
  const onStatusChange = (type: 'save' | 'run') => {
    setIsValidate(true);
    setIsChange(false);
    onSubmit(type);
    setIsUpload(false);
  };

  /**
   * adapter提示
   */
  const adapterTip = (
    <>
      {intl.get('benchmarkTask.adapterTitle')}
      {_.map(intl.get('benchmarkTask.adapterTip')?.split('|'), (item: string, index) => {
        return <div key={index}>{item}</div>;
      })}
    </>
  );

  /**
   * 获取状态详情
   */
  const onViewEunDetail = async () => {
    try {
      const { res } = await getTaskStatus({ id: benchmarkTaskId.current });
      setDetailData({ visible: true, record: { status: currentStatus, id: benchmarkTaskId.current }, data: res });
    } catch (err: any) {
      const { Description } = err?.response || err?.data || err || {};
      Description && message.error(Description);
    }
  };

  /**
   * 上方栏显示
   */
  const topTitle = (
    <>
      <span className='ad-mr-6'>
        {currentAction === 'create' ? intl.get('benchmarkTask.createTask') : currentAction === 'copy' ? `${taskInfo?.name}的副本` : taskInfo?.name}
      </span>
      {currentAction === 'view' ? (
        <div
          className={classNames('ad-align-center', { 'ad-pointer': !_.includes([0, 1], currentStatus) })}
          onClick={() => {
            if (_.includes([0, 1], currentStatus)) return;
            onViewEunDetail();
          }}
        >
          <AdBadge
            text={
              <>
                {STATUS_COLOR?.[currentStatus]?.text}
                {!_.includes([0, 1], currentStatus) && (
                  <Tooltip title={intl.get('global.detail')}>
                    <IconFont className='ad-ml-2 ad-pointer' type='icon-wendang-xianxing' style={{ fontSize: 14, paddingTop: 2 }} />
                  </Tooltip>
                )}
              </>
            }
            color={STATUS_COLOR?.[currentStatus]?.color}
          />
        </div>
      ) : null}
    </>
  );

  /**
   * 获取评估对象下的task
   * @param value
   */
  const onGetConfigTasks = (value: any) => {
    let newTasksArr: any = [];
    _.map(_.cloneDeep(benConfigList), (item: any) => {
      if (item.name === value) newTasksArr = item.tasks;
    });
    setTasksArr(newTasksArr);
    form.resetFields(['algorithm']);
  };

  /**
   * 评估对象相关内容加载完毕
   */
  const onCancelLoading = (isSingleCancelEditingLoading = false) => {
    if (!isSingleCancelEditingLoading) setAlgChange(false);
    setIsEditViewLoading(false); // 取消页面加载loading
  };

  return (
    <div className='createBenchmarkTask ad-flex-column'>
      {isRunLoading || isEditViewLoading || isAdapterLoading ? (
        <div className={classNames('loading-mask', { spinning: isRunLoading || isEditViewLoading || isAdapterLoading })}>
          <div className='spin-content-box ad-content-center ad-flex-column'>
            <AdSpin />
            {isEditViewLoading || isAdapterLoading ? null : <div className='ad-mt-3'>{intl.get('global.loadingDot')}</div>}
          </div>
        </div>
      ) : null}
      <AdExitBar
        style={{ height: 48 }}
        onExit={() => {
          backHome.current = false;
          onExit();
        }}
        title={topTitle}
      />
      <div className='createBenchmarkTask-content ad-flex-item-full-height ad-content-center ad-flex'>
        <div
          style={{ display: (isEditViewLoading && !isRunLoading) || isAdapterLoading ? 'none' : 'block' }}
          className='ad-mt-6 ad-w-100 createBenchmarkTask-content-box ad-flex-column ad-h-100'
        >
          <div className='createBenchmarkTask-content-box-form ad-content-center'>
            <div style={{ justifyContent: 'left', width: 1050 }}>
              <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                onValuesChange={onFormChange}
                style={{ width: 876 }}
                encType='multipart/form-data'
                initialValues={{ color: DEFAULT_ICON }}
              >
                {/* 任务名称 */}
                <Form.Item
                  label={intl.get('benchmarkTask.taskName')}
                  name={'name'}
                  rules={[
                    { required: true, message: intl.get('global.noNull') },
                    { max: 50, message: intl.get('global.lenErr', { len: 50 }) },
                    { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
                  ]}
                >
                  <Input
                    autoComplete='off'
                    aria-autocomplete='none'
                    onChange={() => setIsChange(true)}
                    placeholder={intl.get('global.pleaseEnter')}
                    disabled={isView}
                    data-testid='input'
                  />
                </Form.Item>

                {/* benchmark 选择 */}
                <Form.Item
                  name={'config_id'}
                  label={intl.get('benchmarkTask.BenchmarkConfig')}
                  rules={[{ required: true, message: intl.get('global.noNull') }]}
                >
                  <Select
                    placeholder={intl.get('global.pleaseSelect')}
                    onChange={(value: any) => {
                      setIsChange(true);
                      setAlgChange(true);
                      onGetConfigTasks(value);
                    }}
                    disabled={isView}
                    showSearch
                  >
                    {_.map(benConfigList, item => {
                      return (
                        <Select.Option value={item?.name} key={item?.id} published={item?.published}>
                          {item?.name}
                        </Select.Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                {/* 评估对象类型 */}
                {form.getFieldValue('config_id') ? (
                  <Form.Item
                    name={'algorithm_type'}
                    label={intl.get('benchmarkTask.evalObjType')}
                    rules={[{ required: true, message: intl.get('global.noNull') }]}
                  >
                    <Select
                      placeholder={intl.get('global.pleaseSelect')}
                      disabled={isView}
                      onChange={e => {
                        setAlgType(e);
                        setIsChange(true);
                        setAlgChange(true);
                      }}
                    >
                      {_.map(
                        algorithmType.filter((_, index) => index !== 0),
                        (item: any) => {
                          return (
                            <Select.Option key={item?.text} value={item?.value}>
                              {item?.text}
                            </Select.Option>
                          );
                        },
                      )}
                    </Select>
                  </Form.Item>
                ) : null}

                {/* 评估对象*/}
                {algType ? (
                  <Form.Item
                    label={
                      <>
                        {intl.get('benchmarkTask.selectEvalObj')}
                        <Tooltip placement='top' className='ad-ml-1' title={intl.get('benchmarkTask.algtooltip')}>
                          <IconFont style={{ opacity: 0.45 }} type='icon-wenhao' />
                        </Tooltip>
                      </>
                    }
                    name='algorithm'
                    required
                  >
                    <AlgorithmSelector
                      disabled={isView}
                      algType={algType}
                      isValidate={isValidate}
                      tasksArr={tasksArr}
                      algChange={algChange}
                      onCancelLoading={onCancelLoading}
                      saveAlgorithm={saveAlgorithm}
                      operateChange={() => setIsChange(true)}
                      saveCustomData={saveCustomData}
                    />
                  </Form.Item>
                ) : null}
                {isView && _.isEmpty(adapter) ? null : (
                  <Form.Item
                    label={
                      <>
                        {intl.get('benchmarkTask.adapterFile')}
                        <Tooltip className='ad-ml-1' placement='top' title={adapterTip}>
                          <IconFont style={{ opacity: 0.45 }} type='icon-wenhao' />
                        </Tooltip>
                      </>
                    }
                    name={'adapter'}
                    extra={
                      !isView ? (
                        <div>
                          <div className='list'>{intl.get('benchmarkTask.uploadExtra1')}</div>
                          <div className='list'>{intl.get('benchmark.indicator.uploadFileTip1')}</div>
                          <div className='list'>
                            {intl.get('benchmarkTask.uploadExtra3')?.split('|')[0]}
                            <span className='ad-pointer ad-c-primary' data-testid='upload-btn' onClick={onTemplateDownload}>
                              {intl.get('benchmarkTask.uploadExtra3')?.split('|')[1]}
                            </span>
                          </div>
                        </div>
                      ) : null
                    }
                    getValueFromEvent={normFile}
                    valuePropName='fileList'
                  >
                    {!isView && !isAdapterLoading ? (
                      <div>
                        <AdUpload
                          accept='.py'
                          maxCount={1}
                          fileList={fileList}
                          setFileList={setFileList}
                          disabled={isView}
                          beforeUpload={(file: any) => beforeUpload(file)}
                          onChange={onFileChange}
                          onFileStartUpload={onStartToUploadFile}
                        />
                      </div>
                    ) : (
                      onPreviewFileContent(true)
                    )}
                  </Form.Item>
                )}

                {isError ? onErrorEmptyShow : null}
                {!isView && !isAdapterLoading ? onPreviewFileContent(false) : null}
                <Form.Item
                  name={'description'}
                  label={intl.get('global.desc')}
                  rules={[
                    { max: 255, message: intl.get('global.lenErr', { len: 255 }) },
                    { pattern: ONLY_KEYBOARD, message: intl.get('global.onlyKeyboard') },
                  ]}
                >
                  <Input.TextArea
                    placeholder={intl.get('benchmark.config.inputDes')}
                    onChange={() => {
                      setIsChange(true);
                    }}
                    disabled={isView}
                    data-testid='input-area'
                    rows={4}
                  />
                </Form.Item>
                <Form.Item name={'color'} label={intl.get('benchmarkTask.color')}>
                  <AdIconList disabled={isView} iconList={TASK_ICON_LIST} setIsChange={setIsChange} />
                </Form.Item>
              </Form>
            </div>
          </div>
          {!isView && (
            <div className='ad-content-center ad-pb-6 ad-w-100'>
              <div className='footer-content-box ad-flex'>
                <Button
                  loading={saveLoading}
                  onClick={() => {
                    if (!getSaveLoading()) onStatusChange('save');
                  }}
                  data-testid='save-btn'
                >
                  {intl.get('global.save')}
                </Button>
                <Button
                  type='primary'
                  data-testid='run-btn'
                  className='ad-ml-2'
                  onClick={() => {
                    if (!getSaveLoading() && !getIsRunLoading()) onStatusChange('run');
                  }}
                >
                  {intl.get('benchmarkTask.run')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <TipModal
        open={isExit}
        closable={true}
        title={intl.get('benchmarkTask.exitTitle')}
        content={intl.get('benchmarkTask.exitContent')}
        onCancel={() => setIsExit(false)}
        onOk={() => onSaveExit()}
        okText={intl.get('prompt.saveClose')}
        replaceCancelBtn={<Button onClick={() => history.goBack()}>{intl.get('prompt.abandon')}</Button>}
      />

      <RunDetail visible={detailData?.visible} detailData={detailData} onCancel={() => setDetailData({ visible: false, record: '', data: '' })} />
    </div>
  );
};

export default CreateBenchmarkTask;
