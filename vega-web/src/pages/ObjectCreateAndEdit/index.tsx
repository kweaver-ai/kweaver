import { useState, useEffect, useRef } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { Form } from 'antd';
import { nanoid } from 'nanoid';
import { DataViewSource } from '@/components/DataViewSource';
import HeaderSteps from '@/components/HeaderSteps';
import frameworkProps from '@/utils/axios-http/frameworkProps';
import { deduplicateObjects } from '@/utils/object';
import { queryConceptGroups } from '@/services/concept-group';
import ConceptGroupType from '@/services/concept-group/type';
import OntologyObjectType from '@/services/object/type';
import Request from '@/services/request';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Button } from '@/web-library/common';
import AttrDef from './AttrDef';
import BasicInformation from './BasicInformation';
import DataView from './DataView';
import styles from './index.module.less';
import Mapping from './Mapping';

const ObjectCreateAndEdit = () => {
  const history = useHistory();
  const params: { id: string } = useParams();
  const { message } = HOOKS.useGlobalContext();
  const { id } = params || {};
  const isEditPage = !!id;
  const knId = localStorage?.getItem('KnowledgeNetwork.id') || '';
  const steps = [
    { title: intl.get('Global.dataView') },
    { title: intl.get('Global.basicInfo') },
    { title: intl.get('Object.attributeDefinition') },
    { title: intl.get('Object.attributeMapping') },
  ];

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stepsCurrent, setStepsCurrent] = useState(0); // 当前步骤
  const [originData, setOriginData] = useState<OntologyObjectType.ReqObjectType>();
  const [basicValue, setBasicValue] = useState<OntologyObjectType.BasicInfo>(); // 基本信息的值
  const [dataViewId, setDataViewId] = useState<string>(''); // 当前所选数据视图ID
  const [dataSource, setDataSource] = useState<OntologyObjectType.DataSource>(); // 当前所选数据源ID
  const [fields, setFields] = useState<OntologyObjectType.Field[]>([]); // 数据视图字段信息
  const [attrData, setAttrData] = useState<OntologyObjectType.Field[]>([]); // 属性字段信息
  const [dataProperties, setDataProperties] = useState<OntologyObjectType.DataProperty[]>([]); // 数据属性
  const [logicProperties, setLogicProperties] = useState<OntologyObjectType.LogicProperty[]>([]); // 逻辑属性
  const [conceptGroups, setConceptGroups] = useState<ConceptGroupType.BasicInfo[]>([]); // 概念分组列表
  const [conceptGroupsLoading, setConceptGroupsLoading] = useState(false); // 概念分组加载状态
  const [basicForm] = Form.useForm();
  const [dataViewForm] = Form.useForm();
  const mappingRef = useRef<any>(null);
  const attrDefRef = useRef<any>(null);

  // 获取概念分组列表
  const fetchConceptGroups = async () => {
    if (!knId) return;
    setConceptGroupsLoading(true);
    try {
      const res = await queryConceptGroups(knId, { limit: -1 });
      setConceptGroups(res?.entries || []);
    } catch (error) {
      setConceptGroupsLoading(false);
      console.error('Failed to fetch concept groups:', error);
    } finally {
      setConceptGroupsLoading(false);
    }
  };

  // 浏览器beforeunload事件，提示用户是否确认离开
  useEffect(() => {
    const handleBeforeUnload = (e: any) => {
      e.preventDefault();
      e.returnValue = intl.get('Global.confirmBackContent');
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    frameworkProps.data.toggleSideBarShow(false);
    fetchConceptGroups();
    if (!id) return;
    getObjectDetail();
  }, [id]);

  // 获取视图详情
  const getDataViewDetail = async (dataViewId: string) => {
    if (!dataViewId) return;
    try {
      const result = await SERVICE.dataView.dataViewGetDetail(dataViewId);
      if (result?.[0]) {
        const fields = result?.[0]?.fields || [];
        fields.forEach((item: OntologyObjectType.Field) => {
          item.id = nanoid();
        });
        // 视图变更，重置属性字段信息（属性定义、数据属性、逻辑属性）
        setFields(fields);
        if ((!originData?.data_source?.id && !dataProperties.length) || !isEditPage) {
          const underscoreStart = fields
            .filter((item: OntologyObjectType.Field) => !item.name.startsWith('_'))
            .map((item: OntologyObjectType.Field) => ({
              ...item,
              name: item.name.replace(/\./g, '_'),
            }));
          setAttrData(underscoreStart);
        }
      }
    } catch (event) {
      console.log('getDataViewDetail event: ', event);
    }
  };

  const handleChooseOk = async (e: any[]) => {
    const dataView = e?.[0] || {};
    if (!dataView.id) return;
    const result = await SERVICE.dataView.dataViewGetDetail(dataView.id);
    if (result?.[0]) {
      const fields = result?.[0]?.fields || [];
      fields.forEach((item: any) => {
        item.id = nanoid();
      });
      // 视图变更，重置属性字段信息（属性定义、数据属性、逻辑属性）
      setFields(fields);
      // if ((!originData?.data_source?.id && !dataProperties.length) || !isEditPage) {
      //     setAttrData(fields);
      // }
    }
    setDataSource({
      type: 'data_view',
      id: dataView.id,
      name: dataView.name,
    });
  };

  /** 获取object详情信息，用于编辑 */
  const getObjectDetail = async () => {
    try {
      const result = await SERVICE.object.getDetail(knId, [id]);
      const data = result?.[0];
      if (!data) return;
      // 构建基本信息的值
      const {
        name,
        tags,
        comment,
        icon,
        color,
        data_properties = [],
        data_source,
        logic_properties = [],
        primary_keys = [],
        display_key = '',
        incremental_key = '',
        concept_groups = [],
      } = data;
      setOriginData(data);
      setBasicValue({ name, id, tags, comment, icon, color, concept_groupIds: concept_groups.map((item) => item.id) });
      setDataProperties(data_properties || []);
      setLogicProperties(logic_properties || []);
      setDataSource(data_source);
      const mergeData = [...data_properties, ...logic_properties].map((item) => ({
        id: nanoid(),
        name: item?.name || '',
        type: item?.type || '',
        display_name: item?.display_name || '',
        comment: item?.comment || '',
        primary_key: primary_keys.includes(item.name),
        display_key: item.name === display_key,
        incremental_key: item.name === incremental_key,
      }));
      setAttrData(mergeData as any);
      if (data_source?.id) {
        setDataViewId(data_source?.id || '');
        const result = await SERVICE.dataView.dataViewGetDetail(data_source?.id);
        const { fields = [] } = result?.[0] || {};
        setFields(fields);
      }
    } catch (error) {
      console.log('getEdgeDetail error: ', error);
    }
  };

  /** 回退 */
  const goBack = () => {
    history.goBack();
  };

  /** 上一步 */
  const onPrev = () => setStepsCurrent(stepsCurrent - 1);
  /** 下一步 */
  const onNext = () => setStepsCurrent(stepsCurrent + 1);

  /** 提交 */
  const onSubmit = async (data: {
    dataProperties: OntologyObjectType.DataProperty[];
    logicProperties: OntologyObjectType.LogicProperty[];
    attrData?: OntologyObjectType.Field[];
  }) => {
    // 使用传入的attrData或者当前状态的attrData
    const currentAttrData = data.attrData || attrData;
    const { concept_groupIds = [], ...rest } = basicValue || {};
    // 将concept_groups从ID数组转换为数组对象格式，包含id和name属性
    const concept_groups = conceptGroups
      .filter((group) => concept_groupIds.includes(group.id))
      .map((group) => ({
        id: group.id,
        name: group.name || '',
      }));

    const dataProperties = data.dataProperties.map((item) => ({
      display_name: item.display_name || '',
      name: item.name || '',
      original_name: item.original_name || '',
      type: item.type || '',
      comment: item.comment || '',
      mapped_field: item.mapped_field,
    }));

    const postData: OntologyObjectType.ReqObjectType = {
      branch: 'main',
      ...(rest as OntologyObjectType.BasicInfo)!,
      concept_groups,
      data_properties: dataProperties,
      logic_properties: data.logicProperties,
      data_source: {
        type: 'data_view',
        id: dataViewId,
      },
      primary_keys: currentAttrData.filter((item) => item.primary_key).map((item) => item.name),
      display_key: currentAttrData.find((item) => item.display_key)?.name || '',
      incremental_key: currentAttrData.find((item) => item.incremental_key)?.name || '',
    };

    setLoading(true);
    try {
      if (isEditPage) {
        await SERVICE.object.updateObjectType(knId, id, postData);
        message.success(intl.get('Global.editSuccess'));
        goBack();
      } else {
        const result = await SERVICE.object.createObjectTypes(knId, [postData]);
        message.success(intl.get('Global.createSuccess'));
        if (result?.[0]?.id) goBack();
      }
    } catch (error) {
      setLoading(false);
      console.log('onSubmit error: ', error);
    }
  };

  const handleAttrData = (type?: string) => {
    attrDefRef.current
      .validateFields()
      .then((values: any[]) => {
        setAttrData(values);
        // 当前所有属性
        const attrDataNames = values?.map((item) => item.name) || [];

        //当前逻辑属性 类型为metric/operator的属性
        const currentLogicProperties = values?.filter((item) => ['metric', 'operator'].includes(item.type)) || [];

        // 逻辑属性处理（合并当前逻辑属性和已经编辑过的逻辑属性）
        let updatedLogicProperties: OntologyObjectType.LogicProperty[] = currentLogicProperties;

        // 已经编辑过的逻辑属性，需要保留，
        if (logicProperties.length > 0) {
          const oldLogicProperties = logicProperties.filter((item) => attrDataNames.includes(item.name));
          // 将编辑过的逻辑属性合并
          const editLogicProperties = values.filter((item) => oldLogicProperties.map((item) => item.name).includes(item.name));
          // 合并去重
          updatedLogicProperties = deduplicateObjects([...oldLogicProperties, ...currentLogicProperties, ...editLogicProperties], 'name');
        }
        setLogicProperties(updatedLogicProperties);
        // 当前数据属性
        const currentDataProperties = values?.filter((item) => !updatedLogicProperties.map((item) => item.name).includes(item.name)) || [];

        // 数据属性处理
        let updatedDataProperties: OntologyObjectType.DataProperty[] = currentDataProperties;
        // 已经编辑过的数据属性，需要保留，
        if (dataProperties?.length > 0) {
          const oldDataProperties = dataProperties.filter((item) => attrDataNames.includes(item.name));
          // 合并去重
          updatedDataProperties = deduplicateObjects([...oldDataProperties, ...currentDataProperties], 'name');
        }

        setDataProperties(updatedDataProperties);
        if (type === 'submit') {
          onSubmit({ dataProperties: updatedDataProperties, logicProperties: updatedLogicProperties, attrData: values });
        } else {
          onNext();
        }
      })
      .catch((msg: string) => {
        message.error(msg || intl.get('Object.pleaseFillCorrectAttrInfo'));
      });
  };

  const title = isEditPage ? basicValue?.name : intl.get('Global.createObjectType');
  const StepsContent: any = {
    0: {
      content: <DataView form={dataViewForm} dataSource={dataSource} isEditPage={isEditPage} />,
      nextText: intl.get('Global.nextStep'),
      nextClick: () => {
        dataViewForm.validateFields().then((values: { dataViewId: string; dataViewName: string }) => {
          if (values.dataViewId && values.dataViewId !== dataViewId) {
            getDataViewDetail(values.dataViewId);
            if (values.dataViewId !== dataViewId) {
              setDataProperties((prev) =>
                prev.map((item) => ({
                  ...item,
                  mapped_field: { name: '' },
                }))
              );
            }
            setDataViewId(values.dataViewId);
            setDataSource({
              type: 'data_view',
              id: values.dataViewId,
              name: values.dataViewName,
            });
          }
          onNext();
        });
      },
    },
    1: {
      content: (
        <BasicInformation
          form={basicForm}
          values={basicValue}
          isEditPage={isEditPage}
          conceptGroups={conceptGroups}
          conceptGroupsLoading={conceptGroupsLoading}
        />
      ),
      prevText: intl.get('Global.prevStep'),
      nextText: intl.get('Global.nextStep'),
      prevClick: () => {
        onPrev();
      },
      nextClick: () => {
        basicForm.validateFields().then((values) => {
          setBasicValue(values);
          onNext();
        });
      },
    },
    2: {
      content: <AttrDef fields={attrData} ref={attrDefRef} />,
      prevText: intl.get('Global.prevStep'),
      nextText: intl.get('Global.nextStep'),
      saveText: intl.get('Global.saveAndExit'),
      prevClick: () => {
        const fields = attrDefRef.current.getFields();
        setAttrData(fields);
        onPrev();
      },
      nextClick: () => {
        handleAttrData();
      },
      saveClick: () => {
        handleAttrData('submit');
      },
    },
    3: {
      content: (
        <Mapping
          ref={mappingRef}
          fields={fields}
          openDataViewSource={() => setOpen(true)}
          dataProperties={dataProperties}
          logicProperties={logicProperties}
          basicValue={basicValue as any}
          dataSource={dataSource}
        />
      ),
      prevText: intl.get('Global.prevStep'),
      saveText: intl.get('Global.saveAndExit'),
      prevClick: () => {
        mappingRef.current
          .validateFields()
          .then((values: { dataProperties: OntologyObjectType.DataProperty[]; logicProperties: OntologyObjectType.LogicProperty[] }) => {
            const { dataProperties = [], logicProperties = [] } = values;
            setDataProperties(dataProperties);
            setLogicProperties(logicProperties);
            onPrev();
          });
      },
      saveClick: () => {
        mappingRef.current
          .validateFields()
          .then((values: { dataProperties: OntologyObjectType.DataProperty[]; logicProperties: OntologyObjectType.LogicProperty[] }) => {
            onSubmit(values);
          });
      },
    },
  };

  return (
    <div className={styles['object-root']}>
      <HeaderSteps title={title} stepsCurrent={stepsCurrent} items={steps} />
      <div className={styles['object-content']}>{StepsContent?.[stepsCurrent]?.content}</div>
      <div className={styles['object-footer']}>
        {StepsContent?.[stepsCurrent]?.prevClick ? (
          <Button onClick={StepsContent?.[stepsCurrent]?.prevClick} loading={loading} disabled={loading}>
            {StepsContent?.[stepsCurrent]?.prevText}
          </Button>
        ) : (
          <div></div>
        )}
        <div className="g-flex-align-center">
          {StepsContent?.[stepsCurrent]?.saveClick && (
            <Button className="g-mr-2" type="primary" loading={loading} disabled={loading} onClick={StepsContent?.[stepsCurrent]?.saveClick}>
              {StepsContent?.[stepsCurrent]?.saveText}
            </Button>
          )}
          {StepsContent?.[stepsCurrent]?.nextClick && (
            <Button className="g-mr-2" type="primary" loading={loading} disabled={loading} onClick={StepsContent?.[stepsCurrent]?.nextClick}>
              {StepsContent?.[stepsCurrent]?.nextText}
            </Button>
          )}
          <Button
            onClick={() => {
              if (Request.cancels?.edgePost) Request.cancels.edgePost();
              if (Request.cancels?.edgePut) Request.cancels.edgePut();
              goBack();
            }}
          >
            {intl.get('Global.cancel')}
          </Button>
        </div>
      </div>
      {/* 数据视图源选择器 */}
      <DataViewSource
        open={open}
        onCancel={() => {
          setOpen(false);
        }}
        selectedRowKeys={[]}
        maxCheckedCount={1}
        onOk={(checkedList: any[]) => {
          handleChooseOk(checkedList);
          setOpen(false);
        }}
      />
    </div>
  );
};

export default ObjectCreateAndEdit;
