import { useEffect, useRef, useState, useCallback } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import { Divider, Steps as Antd_Steps } from 'antd';
import _ from 'lodash';
import { arNotification } from '@/components/ARNotification';
import { SCHEDULE_TYPE } from '@/hooks/useConstants';
import api from '@/services/data-analysis/metric-model';
import { Text, Title, Button } from '@/web-library/common';
import BasicInfo from './BasicInfo';
import styles from './index.module.less';
import ModelSettings from './ModelSettings';
import PersistenceSettings from './PersistenceSettings';
import { stepList } from './utils';
import { TBasicInfoData, TTasks, queryType as QUERY_TYPE, METRIC_TYPE } from '../type';

// 步骤条内容
enum Steps {
  basicInfo = 0, // 基本配置
  modelSettings = 1, // 模型配置
  persistenceSettings = 2, // 持久化配置
}

const FormContainer = () => {
  const history = useHistory();
  const params: any = useParams();
  const { id, createType } = params || {};

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 当前步骤
  const [basicInfoData, setBasicInfoData] = useState<any>(); // 基本配置
  const [modelData, setModelData] = useState<any>(); // 模型配置
  const [taskData, setTaskData] = useState<TTasks>(); // 任务数据
  const [isTask, setIsTask] = useState<boolean>(false);

  const basicInfoRef = useRef(null) as any;
  const modelRef = useRef(null) as any;
  const persistenceRef = useRef(null) as any;

  useEffect(() => {
    if (id) getMetricModel(id);
  }, [id]);
  /** 构建基本配置的回填数据 */
  const backfillBasicData = (data: any) => {
    const { name, id, groupName, tags, comment } = data;
    return { name, id, groupName, tags, comment };
  };
  /**构建模型配置的回填数据 -- atomic 原子指标 */
  const backfillModelData_atomic = (data: any) => {
    const {
      metricType,
      dataSource,
      queryType,
      formula,
      measureField,
      formulaConfig,
      analysisDimensions,
      dateField,
      unitType,
      unit,
      havingCondition,
      orderByFields,
    } = data;
    const newModelData: any = { metricType, dataViewId: dataSource.id, queryType, unitType, unit, havingCondition, orderByFields };
    if (queryType === QUERY_TYPE.Dsl || queryType === QUERY_TYPE.Promql) {
      // 计算公式
      newModelData.formula = formula;
      // 度量字段
      if (queryType === QUERY_TYPE.Dsl) {
        newModelData.formula = JSON.parse(formula);
        newModelData.measureField = measureField;
      }
    }

    if (queryType === QUERY_TYPE.Sql) {
      // 数据过滤
      newModelData.dataFilter = false;
      if (formulaConfig?.conditionStr) {
        newModelData.dataFilter = true;
        newModelData.conditionType = 'conditionStr';
        newModelData.conditionStr = formulaConfig?.conditionStr;
      }
      if (!_.isEmpty(formulaConfig?.condition)) {
        newModelData.dataFilter = true;
        newModelData.conditionType = 'condition';
        newModelData.condition = formulaConfig?.condition;
      }
      // 度量计算
      if (formulaConfig?.aggrExpressionStr) {
        newModelData.aggrExpressionType = 'aggrExpressionStr';
        newModelData.aggrExpressionStr = formulaConfig?.aggrExpressionStr;
      }
      if (!_.isEmpty(formulaConfig?.aggrExpression)) {
        newModelData.aggrExpressionType = 'aggrExpression';
        newModelData.aggrExpression = formulaConfig?.aggrExpression;
      }
      // 分析维度
      newModelData.analysisDimensions = analysisDimensions;

      // 分组字段
      if (!_.isEmpty(formulaConfig?.groupByFields)) {
        newModelData.groupByFields = formulaConfig?.groupByFields;
      }
      if (dateField) newModelData.dateField = dateField;
    }

    return newModelData;
  };
  /**构建模型配置的回填数据 -- derived 衍生指标 */
  const backfillModelData_derived = (data: any) => {
    const { metricType, formulaConfig, analysisDimensions, unitType, unit, havingCondition, orderByFields } = data;
    const { dependMetricModel, conditionStr, dateCondition, businessCondition } = formulaConfig;

    const newModelData: any = { metricType, dataViewId: dependMetricModel?.id, analysisDimensions, unitType, unit, havingCondition, orderByFields };

    newModelData.dataFilter = false;
    if (conditionStr) {
      newModelData.dataFilter = true;
      newModelData.conditionType = 'conditionStr';
      newModelData.conditionStr = conditionStr;
    }
    if (dateCondition) {
      newModelData.dataFilter = true;
      newModelData.conditionType = 'condition';
      newModelData.dateCondition = dateCondition;
    }
    if (businessCondition) {
      newModelData.dataFilter = true;
      newModelData.conditionType = 'condition';
      newModelData.businessCondition = businessCondition;
    }

    return newModelData;
  };
  /**构建模型配置的回填数据- - composite 复合指标 */
  const backfillModelData_composite = (data: any) => {
    const { metricType, formula, analysisDimensions, unitType, unit, havingCondition, orderByFields } = data;
    const newModelData: any = { metricType, formula, show_formula: formula, analysisDimensions, unitType, unit, havingCondition, orderByFields };
    return newModelData;
  };
  /** 构建模型配置的回填数据 */
  const backfillModelData = (data: any) => {
    const metricType = data.metricType;
    if (metricType === METRIC_TYPE.ATOMIC) return backfillModelData_atomic(data);
    if (metricType === METRIC_TYPE.DERIVED) return backfillModelData_derived(data);
    if (metricType === METRIC_TYPE.COMPOSITE) return backfillModelData_composite(data);
  };
  /** 构建任务配置的回填数据 */
  const backfillTaskData = (data: any) => {
    const { task } = data;
    // 判断持久化配置是否存在， id为0表示不存在
    if (task?.id && task?.id !== '0') {
      const { schedule, steps, ...otherTask } = task;
      const scheduleItem = schedule.type === SCHEDULE_TYPE.FIX_RATE ? { fixExpression: schedule?.expression } : { cronExpression: schedule?.expression };
      const curSteps = steps?.length === 1 && !stepList.includes(steps[0]) ? undefined : steps;
      const newTaskData = { ...otherTask, isPersistenceConfig: true, expressionType: schedule.type, steps: curSteps, ...scheduleItem };

      setIsTask(true);
      return newTaskData;
    } else {
      return undefined;
    }
  };
  const getMetricModel = useCallback(async (id: any): Promise<void> => {
    const result = await api.getMetricModelById([id]);
    //基本配置的回填
    const basicInfoData = backfillBasicData(result);
    setBasicInfoData(basicInfoData);
    //模型配置的回填
    const modeData = backfillModelData(result);
    setModelData({ ...modeData, isCalendarInterval: result.isCalendarInterval });
    // 模型配置的回填
    const taskData = backfillTaskData(result);
    setTaskData(taskData);
  }, []);

  /** 退出编辑页 */
  const goBack = () => history.goBack();

  /** 格式化基本配置数据 */
  const formatBasicData = () => {
    const { name, id, groupName, tags = [], comment = '' } = _.cloneDeep(basicInfoData) || {};
    return { name, id, groupName, tags, comment };
  };

  /** 格式化模型配置数据 -- atomic 原子指标 */
  const format_atomic = () => {
    const {
      metricType,
      dataViewId,
      queryType,
      measureField,
      formula,
      unitType,
      unit,
      conditionType,
      conditionStr,
      condition,
      aggrExpressionType,
      aggrExpressionStr,
      aggrExpression,
      groupByFields,
      analysisDimensions,
      dateField,
      orderByFields,
      resultFilter,
      havingCondition,
    } = _.cloneDeep(modelData) || {};

    // 数据源信息
    const dataSource =
      typeof dataViewId === 'string' ? { id: dataViewId } : { id: dataViewId[0]?.id, name: dataViewId[0]?.name, type: dataViewId[0]?.queryType };
    // 模型配置 -- 索引视图
    const modelConfig: any = { formula: typeof formula === 'string' ? formula : JSON.stringify(formula) };
    if (queryType === QUERY_TYPE.Dsl) modelConfig.measureField = measureField; // 度量字段

    // 模型配置 -- VEGA 视图
    const modelVega: any = {
      formulaConfig: {
        ...(conditionType === 'conditionStr' ? { conditionStr } : { condition }), // 数据过滤
        ...(aggrExpressionType === 'aggrExpressionStr' ? { aggrExpressionStr } : { aggrExpression }), // 度量计算
        groupByFields, // 分组字段
      },
      analysisDimensions, // 分析维度
    };
    if (dateField) modelVega.dateField = dateField;

    return {
      metricType,
      dataSource,
      queryType,
      ...(queryType !== QUERY_TYPE.Sql ? modelConfig : modelVega),
      unitType,
      unit,
      orderByFields,
      havingCondition: resultFilter ? havingCondition : undefined,
    };
  };
  /** 格式化模型配置数据 -- derived 衍生指标 */
  const format_derived = () => {
    const {
      metricType,
      dataViewId,
      conditionType,
      conditionStr,
      dateCondition,
      businessCondition,
      analysisDimensions,
      unitType,
      unit,
      orderByFields,
      resultFilter,
      havingCondition,
    } = _.cloneDeep(modelData) || {};
    const formulaConfig: any = {
      dependMetricModel: { id: dataViewId?.[0]?.id, name: dataViewId?.[0]?.name },
    };
    if (conditionType === 'conditionStr') {
      formulaConfig.conditionStr = conditionStr;
    }
    if (conditionType === 'condition') {
      formulaConfig.dateCondition = dateCondition;
      formulaConfig.businessCondition = businessCondition;
    }
    return { metricType, formulaConfig, analysisDimensions, unitType, unit, orderByFields, havingCondition: resultFilter ? havingCondition : undefined };
  };
  /** 格式化模型配置数据 -- composite 复合指标 */
  const format_composite = () => {
    const { metricType, formula, analysisDimensions = [], unitType, unit, orderByFields, resultFilter, havingCondition } = _.cloneDeep(modelData) || {};
    return { metricType, formula, analysisDimensions, unitType, unit, orderByFields, havingCondition: resultFilter ? havingCondition : undefined };
  };
  /** 格式化模型配置数据 */
  const formatModelSettingData = () => {
    const metricType = modelData.metricType;
    if (metricType === METRIC_TYPE.ATOMIC) return format_atomic();
    if (metricType === METRIC_TYPE.DERIVED) return format_derived();
    if (metricType === METRIC_TYPE.COMPOSITE) return format_composite();
  };

  /** 格式持久化配置数据 */
  const formatPersistenceSettingData = (data: any) => {
    const { isPersistenceConfig, expressionType, fixExpression, cronExpression, customId, ...otherTask } = data;

    const indexBase = otherTask.indexBase ? otherTask.indexBase[0].baseType : '';
    const expression = expressionType === SCHEDULE_TYPE.FIX_RATE ? fixExpression : cronExpression;
    const task = isPersistenceConfig ? { ...otherTask, indexBase, schedule: { type: expressionType, expression } } : undefined;

    return { task };
  };

  /** 配置完成 -- 提交 */
  const onSubmit = async (): Promise<void> => {
    const { form: persistenceForm } = persistenceRef.current;
    persistenceForm.validateFields().then(async (values: any) => {
      const basicData = formatBasicData(); // 基本配置
      const modelSettingData = formatModelSettingData(); // 模型配置
      const persistenceSettingData = formatPersistenceSettingData(values); // 持久化配置

      const body = { ...basicData, ...modelSettingData, ...persistenceSettingData };
      try {
        setLoading(true);
        if (!id) {
          const res: any = await api.createMetricModel(body);
          if (res?.code) {
            setLoading(false);
            return;
          }
          if (res[0] && res[0].id) arNotification.success(intl.get('Global.saveSuccess'));
          goBack();
          return;
        }

        const res = await api.updateMetricModel(body, id);
        if (res?.code) {
          setLoading(false);
          return;
        }
        arNotification.success(intl.get('Global.saveSuccess'));
        goBack();
      } catch (error) {
        setLoading(false);
      }
    });
  };

  const onChangeId = (val: string): void => {
    setBasicInfoData((prev: any) => ({ ...prev, id: val }) as TBasicInfoData);
  };

  const stepValues: any = {
    [Steps.basicInfo]: {
      content: <BasicInfo ref={basicInfoRef} values={basicInfoData} isEdit={!!id} />,
      nextClick: () => {
        basicInfoRef.current.form.validateFields().then(async (values: any) => {
          setBasicInfoData(values);
          setCurrentStep(Steps.modelSettings);
        });
      },
    },
    [Steps.modelSettings]: {
      content: <ModelSettings ref={modelRef} values={modelData} createType={createType} />,
      nextClick: () => {
        modelRef.current.form.validateFields().then(async (values: any) => {
          setModelData(values);
          if (values?.condition_validate?.current?.validate()) return;
          if (values?.dateCondition_validate?.current?.validate()) return;
          if (values?.businessCondition_validate?.current?.validate()) return;
          setCurrentStep(Steps.persistenceSettings);
        });
      },
    },
    [Steps.persistenceSettings]: {
      content: (
        <PersistenceSettings
          ref={persistenceRef}
          values={taskData}
          basicInfoId={basicInfoData?.id}
          modelData={modelData}
          isTask={isTask}
          handleID={onChangeId}
        />
      ),
      nextClick: onSubmit,
    },
  };

  /** 上一步 */
  const onPrev = () => setCurrentStep(currentStep - 1);

  /** 下一步 */
  const onNext = _.debounce(async () => {
    stepValues[currentStep].nextClick();
  }, 300);

  return (
    <div className={styles['metric-model-form-root']}>
      <div className={styles['metric-model-form-go-back']}>
        <div className="g-pointer g-flex-align-center" onClick={goBack}>
          <LeftOutlined style={{ marginTop: 2, marginRight: 6 }} />
          <Text>{intl.get('Global.back')}</Text>
        </div>
        <Divider type="vertical" style={{ margin: '0 12px' }} />
        <Title style={{ height: 54, lineHeight: '52px', background: '#fff' }}>
          {!id ? intl.get('MetricModel.newMetricModel') : intl.get('MetricModel.editMetricModel')}
        </Title>
      </div>
      <div className={styles['metric-model-form-container']}>
        <div className={styles['metric-model-form-steps']}>
          <Antd_Steps
            size="small"
            current={currentStep}
            items={[
              { title: intl.get('Global.baseConfig') },
              { title: intl.get('MetricModel.modelConfig') },
              { title: intl.get('MetricModel.persistenceConfig') },
            ]}
          />
        </div>
        <div className={styles['metric-model-form-content']}>{stepValues[currentStep].content}</div>
        <div className={styles['metric-model-form-footer']}>
          {currentStep > 0 ? (
            <Button loading={loading} onClick={onPrev}>
              {intl.get('Global.prev')}
            </Button>
          ) : (
            <div />
          )}
          <div>
            <Button className="g-mr-2" type="primary" loading={loading} onClick={onNext}>
              {currentStep === 2 ? intl.get('Global.ok') : intl.get('Global.next')}
            </Button>
            <Button onClick={goBack}>{intl.get('Global.cancel')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormContainer;
