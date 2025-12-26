import _ from 'lodash';

import { onCheckInputFormat } from '@/utils/handleFunction/ValueFormat';

import { MODEL_TYPE } from '../enums';
import { ALGORITHM_TYPE_KEY } from './enums';

/**
 * 新建|编辑传参处理
 */
export const onHandleParam = (values: any, benConfigList: any, adapter: any) => {
  const handleConfigId: any = onHandleConfigNameToId(values, benConfigList);
  const { error, algorithm } = handleAlg(values?.algorithm_type, values?.algorithm);
  if (error) {
    return true;
  }
  let body: any = {
    ...values,
    config_id: handleConfigId,
    adapter,
    algorithm,
    algorithm_type: values?.algorithm_type,
  };
  if (_.isEmpty(adapter)) {
    body = _.omit(body, 'adapter');
  }
  return body;
};

/**
 * 处理算法
 * 大模型: [['model_id', 'prompt_id']]
 * 小模型: [model_name]
 *  自定义应用: [customised_app_id]
 * 外部接入: [['算法名称', 'url']]
 */
const handleAlg = (type: number, algorithm: any) => {
  const { error, result } = onHandleCommonFormat(algorithm, type);
  return { error, algorithm: result };
};

/**
 * 转换成后端所需参数格式
 */
export const onHandleCommonFormat = (algorithm: any, type: any) => {
  let error: boolean = false;
  let result: any = [];
  const isExternal = type === 4;
  _.map(algorithm, item => {
    if (!item?.title) {
      error = true;
    }

    const keySplit = ALGORITHM_TYPE_KEY[type]?.split('/');
    if (!_.isEmpty(item?.children)) {
      _.map(item?.children, (child: any) => {
        let commonItem: any = {
          task_id: child?.key?.split('*')?.[1],
          task_name: child?.title,
          is_run: child?.is_run,
        };
        if (item.status) commonItem.status = item.status;
        if (item.version) commonItem.version = item.version;
        switch (type) {
          case 1:
            // 大模型
            commonItem = {
              ...commonItem,
              model_name: item?.title,
              model_id: item?.id,
              prompt_id: child?.prompt_id || '',
              prompt_name: child?.prompt_name || '',
            };
            if (!child?.prompt_name) {
              error = true;
            }
            break;
          case 2:
            // 小模型
            commonItem = { ...commonItem, model_name: item?.title };
            if (!child?.model_name) {
              error = true;
            }
            break;
          default:
            // 自定义 | Agent | 外部接入
            commonItem = {
              ...commonItem,
              [keySplit[0]]: isExternal ? child?.url : item?.id,
              [keySplit[1]]: item?.title,
            };
            if (type === 6) {
              commonItem.config_type = item?.config_type;
            }
            if ((!child?.url || child?.error) && isExternal) {
              error = true;
            }
            break;
        }

        result = [...result, { ...commonItem }];
      });
    } else {
      let commonItem: any = {};
      switch (type) {
        case 1:
          // 大模型
          commonItem = {
            model_name: item?.title,
            model_id: item?.id,
          };
          break;
        case 2:
          // 小模型
          commonItem = { model_name: item?.title };
          break;
        default:
          // 自定义 | Agent | 外部接入
          commonItem = {
            [keySplit[0]]: isExternal ? '' : item?.id,
            [keySplit[1]]: item?.title,
          };
          break;
      }
      result = [...result, { ...commonItem }];
    }
  });
  return { error, result };
};

/**
 * benchmark配置名称->id转换
 */
export const onHandleConfigNameToId = (values: any, benConfigList: any) => {
  let configId: any = '';
  _.map(_.cloneDeep(benConfigList), (item: any) => {
    if (item?.name === values?.config_id) {
      configId = item.id;
    }
  });
  return configId;
};

/**
 * 算法填入校验
 */
export const onAlgorithmError = (values: any) => {
  if (_.isEmpty(values?.algorithm)) return { error: true, algorithm: values?.algorithm };
  const algorithmType = values?.algorithm_type;

  // 小模型 | 自定义应用 | Agent
  if (_.includes([2, 3, 6], algorithmType)) {
    return onFillInDataVerification(values?.algorithm);
  }

  // 大模型 | 外部接入
  if (_.includes([1, 4], algorithmType)) {
    return onFillInDataVerificationTwo(values);
  }
};

/**
 * 小模型 | 自定义应用 | Agent填入数据校验
 */
const onFillInDataVerification = (valuesAlgorithm: any) => {
  let error: boolean = false;
  let result: any[] = [];
  result = _.map(valuesAlgorithm, item => {
    if (!item.title || item?.noPermission) {
      error = true;
    }
    item.error = onCheckInputFormat(item?.title, ['required']);
    return item;
  });
  return { error, algorithm: result };
};

/**
 * 大模型 | 外部接入填入数据校验
 */
const onFillInDataVerificationTwo = (values: any) => {
  let error: boolean = false;
  const result = values?.algorithm;
  const algorithmType = values?.algorithm_type;
  const checkTypeArr = algorithmType === 4 ? ['required', 'max', 'normal'] : ['required'];
  const loop = (value: any) =>
    _.map(value, item => {
      if (item?.children) {
        item.error = onCheckInputFormat(item?.title, checkTypeArr);
        if (item.error || item?.noPermission) {
          error = true;
        }
        loop(item.children);
        return;
      }
      const checkValue = algorithmType === 4 ? item.url : item.prompt_name;
      item.childError = onCheckInputFormat(checkValue, checkTypeArr, 255);
      if (item.childError || item?.noPermission) {
        error = true;
      }
      return item;
    });
  loop(result);
  return { error, algorithm: result };
};

/** 处理接口返回的数据 */
export const getAlgorithm = (algorithm_type: number, algorithm: any[]) => {
  const result = onReduceData(algorithm, algorithm_type);
  return result;
};

/**
 * 1.将评估对象下的应当作为树组件的父类的[id/name]作为key值,
 * 将拥有同一父类[id/name]的数据分类到一起
 */
const onReduceData = (algorithm: any, algorithm_type: number) => {
  const isSmallModel = algorithm_type === 2;
  const reduceData = _.reduce(
    algorithm,
    (pre: any, key: any, index: any) => {
      const currentAlgorithmType = isSmallModel ? ALGORITHM_TYPE_KEY[algorithm_type] : _.cloneDeep(ALGORITHM_TYPE_KEY[algorithm_type]?.split('/'));

      const currentName = key[currentAlgorithmType?.[1]]; // name
      const currentId = key[currentAlgorithmType?.[0]]; // url
      const reduceKey = isSmallModel ? key.model_name : algorithm_type === 4 ? `${currentName}` : `${currentName}/${currentId}`;
      pre[reduceKey] = [...(pre?.[reduceKey] || []), { ..._.omit(key, algorithm_type === 4 ? ['name'] : currentAlgorithmType) }];
      return pre;
    },
    {},
  );
  return onAssignKeyValue(reduceData, algorithm_type);
};

/**
 * 2.为数据分配key值---数据的索引值+1作为树结构的key值
 */
const onAssignKeyValue = (reduceData: any, algorithm_type: any) => {
  const data = _.cloneDeep(reduceData);
  const objectKeys = _.reduce(
    _.cloneDeep(Object.keys(data)),
    (pre: any, key: any, index: number) => {
      pre[key] = index + 1;
      return pre;
    },
    {},
  );
  return onHandleFormatToTree(reduceData, objectKeys, algorithm_type);
};

/**
 * 3.将数据整理成树组件所需的结构
 */
const onHandleFormatToTree = (reduceData: any, objectKeys: any, algorithm_type: any) => {
  const isSmallModel = algorithm_type === 2;
  let result: any[] = [];

  result = _.map(_.cloneDeep(reduceData), (item: any, index: any) => {
    const indexSplit = _.cloneDeep(index?.split('/'));
    let configType: string = '';

    let status = '';
    let version = '';
    let configData: any = {
      title: isSmallModel ? index : indexSplit?.[0],
      key: `${index + 1}/${objectKeys[index]}`,
      id: algorithm_type === 4 ? objectKeys[index] : indexSplit?.[indexSplit?.length - 1] || '',
      error: false,
      children: _.map(_.cloneDeep(item), (i: any, childIndex: number) => {
        let commonConfig: any = {
          title: i?.task_name,
          key:
            algorithm_type === 1
              ? `${index + 1}/${objectKeys[index]}*${i?.task_id}*${i?.prompt_id}`
              : algorithm_type === 4
                ? `${index + 1}/${objectKeys[index]}*${i?.task_id}*${childIndex + 1}`
                : `${index + 1}/${objectKeys[index]}*${i?.task_id}`,
          is_run: i?.is_run,
          valid: i?.valid,
          disableCheckbox: !i?.is_run,
        };
        if (i.status) status = i.status;
        if (i.version) version = i.version;
        if (_.includes([MODEL_TYPE.AGENT], algorithm_type)) {
          configType = i?.config_type;
        }
        if (_.includes([MODEL_TYPE.LLM], algorithm_type)) {
          commonConfig = { ...commonConfig, prompt_id: i?.prompt_id, prompt_name: i?.prompt_name };
        }
        if (_.includes([MODEL_TYPE.EXTERNAL], algorithm_type)) {
          commonConfig = { ...commonConfig, url: i?.url };
        }

        return commonConfig;
      }),
    };
    if (status) configData.status = status;
    if (version) configData.version = version;
    if (_.includes([MODEL_TYPE.AGENT], algorithm_type)) {
      configData = {
        ...configData,
        config_type: configType,
      };
    }
    return configData;
  });
  return result;
};
