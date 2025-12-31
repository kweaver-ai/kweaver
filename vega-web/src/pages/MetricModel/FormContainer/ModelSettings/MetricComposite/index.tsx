import { useMemo, useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { Form, Switch } from 'antd';
import _ from 'lodash';
import AddTag from '@/components/AddTag';
import AddTagBySort from '@/components/AddTagBySort';
import ResultFilter from '@/components/ResultFilter';
import { TEMPLATE_REGEX } from '@/hooks/useConstants';
import api from '@/services/data-analysis/metric-model';
import CompoundExpression from './CompoundExpression';
import styles from './index.module.less';

/** 替换字符串为对象中的字段 */
const replaceTemplate = (string: string, object: any, field: string) => {
  if (!string) return undefined;
  return string.replace(TEMPLATE_REGEX, (match, key) => {
    return !!object?.[key] ? `{{${object?.[key]?.[field]}}}` : match;
  });
};

/** 获取选中的指标 id */
const extractFromString = (str: string) => {
  const matches = [];
  let match;
  while ((match = TEMPLATE_REGEX.exec(str)) !== null) {
    matches.push(match[1]);
  }

  return matches;
};

/** 获取分析维度交集 */
const getCommonElements = (arrays: any) => {
  if (!arrays.length) return [];
  if (arrays.length === 1) return arrays[0];

  // 使用第一个数组作为基准
  return arrays[0].filter((baseItem: any) => {
    // 检查当前元素是否在所有其他数组中都存在
    return arrays.slice(1).every((otherArray: any) => {
      // 使用find方法查找完全相同的对象
      return otherArray.some((item: any) => {
        const one = { type: item.type, name: item.name };
        const two = { type: baseItem.type, name: baseItem.name };
        return JSON.stringify(one) === JSON.stringify(two);
      });
    });
  });
};

const MetricComposite = (props: any) => {
  const { form } = props;
  const show_formula = Form.useWatch('show_formula', form); // 复合表达式 - 用来显示的
  const formula = Form.useWatch('formula', form); // 复合表达式 - 用来传参的
  const [sortFieldList, setSortFieldList] = useState<any[]>([]);
  const resultFilter = Form.useWatch('resultFilter', form);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const { menuItemsKV, menuItems_nameKV }: any = useMemo(() => {
    return { menuItemsKV: _.keyBy(menuItems, 'id'), menuItems_nameKV: _.keyBy(menuItems, 'name') };
  }, [menuItems]);
  const [fieldsMap, setFieldsMap] = useState<any>({});

  const getMetricList = async (name: string = '') => {
    try {
      setLoading(true);
      const result: any = await api.getMetricModelList({ limit: -1, queryType: ['', 'sql'], namePattern: name });
      if (result?.code) return;
      const { entries } = result;
      setMenuItems(entries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMetricList();
  }, []);

  useEffect(() => {
    const str = replaceTemplate(show_formula, menuItems_nameKV, 'id');
    form.setFieldValue('formula', str);
    form.setFieldValue('orderByFields', []);
  }, [show_formula, menuItems_nameKV]);

  /** 复合表达式中的变量 -- 指标 ID */
  const variable = useMemo(() => extractFromString(formula), [formula]);

  /** 复合表达式中的指标 */
  const metrics = useMemo(() => {
    return variable.map((id) => menuItemsKV[id]).filter((item) => !!item);
  }, [variable, menuItemsKV]);

  /** 复合表达式中指标模型的分析维度处理 */
  const analysisDimensions = useMemo(() => {
    return metrics.map((item) => {
      // 处理每个指标的分析维度
      return (item?.analysis_dimensions || []).map((d: any) => {
        return {
          ...d,
          type: d.type?.toLowerCase(),
          display_name: d.display_name || d.name,
        };
      });
    });
  }, [metrics]);

  // 计算所有指标共有的分析维度
  const commonAnalysisDimensions = useMemo(() => {
    const common = getCommonElements(analysisDimensions);
    return common.map((item: any) => ({
      ...item,
      comment: fieldsMap[item.name]?.comment || '',
    }));
  }, [analysisDimensions, fieldsMap]);

  useEffect(() => {
    form.setFieldValue('analysisDimensions', commonAnalysisDimensions);
  }, [commonAnalysisDimensions, form]);

  // 合并并去重 fields_map
  const mergeAndDeduplicateFieldsMap = (data: any[]) => {
    const mergedFields = data.map((item) => item.fields_map || []);
    const deduplicatedFields = Object.assign({}, ...mergedFields);
    return deduplicatedFields;
  };

  const getMetricModelByIds = async (ids: any[]) => {
    if (!ids?.length) return;
    const result = await api.getMetricModelByIds(ids);
    const fieldsMap = mergeAndDeduplicateFieldsMap(result);
    setFieldsMap(fieldsMap);
  };

  useEffect(() => {
    console.log('variable', variable);
    console.log('commonAnalysisDimensions', commonAnalysisDimensions);
    getMetricModelByIds(variable);
  }, [variable]);

  const getSortFieldList = async (ids: any[]) => {
    if (!ids?.length) return;
    const resultList = await api.getMetricOrderFields(ids);
    const commonSortFields = getCommonElements(resultList);
    const fieldList = commonSortFields?.map((item: any) => ({ displayName: item.display_name, name: item.name, type: item.type, comment: item.comment })) || [];
    setSortFieldList(fieldList);
    form.setFieldValue('sortFieldList', fieldList);
  };

  const handleAddBtnClick = () => {
    // 添加结果排序列表
    getSortFieldList(variable);
  };

  return (
    <div className={styles['model-setting-composite-root']}>
      {/* 复合表达式 */}
      <Form.Item name="formula" hidden />
      <Form.Item name="show_formula" label={intl.get('MetricModel.compoundExpression')}>
        <CompoundExpression
          loading={loading}
          menuItems={menuItems}
          menuItemsKV={menuItemsKV}
          menuItems_nameKV={menuItems_nameKV}
          getMetricList={getMetricList}
        />
      </Form.Item>

      <Form.Item name="sortFieldList" hidden />
      <Form.Item name="orderByFields" label={intl.get('MetricModel.resultSort')}>
        <AddTagBySort options={sortFieldList} onAddBtnClick={() => handleAddBtnClick()} />
      </Form.Item>
      <Form.Item
        name="resultFilter"
        layout="horizontal"
        label={intl.get('MetricModel.resultFilter')}
        initialValue={false}
        style={!!resultFilter ? { marginBottom: 0 } : {}}
      >
        <Switch />
      </Form.Item>
      {resultFilter && (
        <Form.Item
          name="havingCondition"
          rules={[
            {
              required: true,
              message: intl.get('Global.cannotBeNull'),
            },
            {
              validator: async (_, value) => {
                // 如果没有值,则校验失败
                if (!value || !value.operation) {
                  return Promise.reject(new Error(intl.get('MetricModel.pleaseSelectOperator')));
                }

                if (!value.value || (Array.isArray(value.value) && value.value.length === 0)) {
                  return Promise.reject(new Error(intl.get('MetricModel.pleaseInputFilterValue')));
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <ResultFilter />
        </Form.Item>
      )}

      <Form.Item name="analysisDimensions" label={intl.get('MetricModel.analysisDimension')}>
        <AddTag options={commonAnalysisDimensions} />
      </Form.Item>
    </div>
  );
};

export default MetricComposite;
