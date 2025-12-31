import { useState, useEffect } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { Form } from 'antd';
import Request from '@/services/request';
import ENUMS from '@/enums';
import HOOKS from '@/hooks';
import SERVICE from '@/services';
import { Button } from '@/web-library/common';
import BasicInformation from './BasicInformation';
import Header from './Header';
import styles from './index.module.less';
import Mapping from './Mapping';

/**
 * ✓ 1、知识网络的id是写死的，需要动态输入
 * 2、创建的时候，branch写死了main，这个后面需要动态输入
 * ✓ 3、视图数据id目前是写死的，切换也是填了固定id，后面需要使用组件
 * 4、刷新、退出、中断逻辑还没有完善
 * ✓ 5、更新接口也是没有返回的
 * ✓ 6、编辑的时候，对象属性无法回填
 * ✓ 7、隐藏侧边栏
 */
const EdgeCreateAndEdit = () => {
  const history = useHistory();
  const params: any = useParams();
  const { message, baseProps } = HOOKS.useGlobalContext();
  const { id } = params || {};
  const isEditPage = !!id;
  const knId = localStorage?.getItem('KnowledgeNetwork.id') || '';

  const [loading, setLoading] = useState(false);
  const [isIntercept, setIsIntercept] = useState(true); // 是否有为保存中断
  const [stepsCurrent, setStepsCurrent] = useState(0); // 当前步骤
  const [basicValue, setBasicValue] = useState<any>({}); // 基本信息的值
  const [mappingValue, setMappingValue] = useState({}); // 关系映射的值
  const [basicForm] = Form.useForm();
  const [mappingForm] = Form.useForm();

  useEffect(() => {
    baseProps.toggleSideBarShow(false);
    return () => baseProps.toggleSideBarShow(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    getEdgeDetail();
  }, [id]);

  /** 获取edge详情信息，用于编辑 */
  const getEdgeDetail = async () => {
    try {
      const result = await SERVICE.edge.edgeGetDetail(knId, id);
      const data = result?.[0];
      if (!data) return;
      // 构建基本信息的值
      const { name, tags, comment } = data;
      setBasicValue({ name, id, tags, comment });

      // 构建关系映射的值
      const { type, mapping_rules, source_object_type_id, target_object_type_id } = data;
      // 直接映射
      if (type === ENUMS.EDGE.TYPE_DIRECT) {
        setMappingValue({ type, mapping_rules: { source_object_type_id, target_object_type_id, mapping_rules } });
      }
      // 视图数据映射
      if (type === ENUMS.EDGE.TYPE_DATA_VIEW) {
        setMappingValue({ type, mapping_rules: { source_object_type_id, target_object_type_id, ...mapping_rules } });
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
  const onSubmit = async (data: any) => {
    const { source_object_type_id, target_object_type_id, mapping_rules, backing_data_source, source_mapping_rules, target_mapping_rules } =
      data?.mapping_rules || {};

    const postData: any = { branch: 'main', ...basicValue };

    postData.type = data.type;
    postData.source_object_type_id = source_object_type_id;
    postData.target_object_type_id = target_object_type_id;
    if (mapping_rules) postData.mapping_rules = mapping_rules;
    if (backing_data_source) {
      postData.mapping_rules = { backing_data_source, source_mapping_rules, target_mapping_rules };
    }

    setLoading(true);
    try {
      if (isEditPage) {
        await SERVICE.edge.edgePut(knId, id, postData);
        message.success(intl.get('Global.editSuccess'));
        goBack();
      } else {
        const result = await SERVICE.edge.edgePost(knId, postData);
        message.success(intl.get('Global.createSuccess'));
        if (result?.[0]?.id) goBack();
      }
    } catch (error) {
      setLoading(false);
      console.log('onSubmit error: ', error);
    }
  };

  const title = isEditPage ? basicValue?.name : intl.get('Global.createEdgeClass');
  const StepsContent: any = {
    0: {
      content: <BasicInformation form={basicForm} values={basicValue} isEditPage={isEditPage} />,
      nextText: intl.get('Global.nextStep'),
      nextClick: () => {
        basicForm.validateFields().then((values) => {
          console.log('BasicInformation values', values);
          setBasicValue(values);
          onNext();
        });
      },
    },
    1: {
      content: <Mapping form={mappingForm} values={mappingValue} />,
      nextText: intl.get('Global.saveAndExit'),
      nextClick: () => {
        mappingForm.validateFields().then((values) => {
          console.log('Mapping values', values);
          setMappingValue(values);
          onSubmit(values);
        });
      },
    },
  };

  return (
    <div className={styles['edge-create-and-edit-root']}>
      {/* {isIntercept && <RouterPrompt modal={modal} isIntercept title="确认要退出此页面吗?" content="当前内容尚未保存的更改， 是否保存？" />} */}
      <Header title={title} stepsCurrent={stepsCurrent} goBack={goBack} />
      <div className={styles['edge-create-and-edit-content']}>{StepsContent?.[stepsCurrent]?.content}</div>
      <div className={styles['edge-create-and-edit-footer']}>
        {stepsCurrent === 0 ? (
          <div />
        ) : (
          <Button onClick={onPrev} loading={loading} disabled={loading}>
            {intl.get('Global.prevStep')}
          </Button>
        )}
        <div className="g-flex-align-center">
          <Button className="g-mr-2" type="primary" loading={loading} disabled={loading} onClick={StepsContent?.[stepsCurrent]?.nextClick}>
            {StepsContent?.[stepsCurrent]?.nextText}
          </Button>
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
    </div>
  );
};

export default EdgeCreateAndEdit;
