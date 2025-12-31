import { useState, useRef, useEffect, FC } from 'react';
import intl from 'react-intl-universal';
import { useHistory, useParams } from 'react-router-dom';
import { Form } from 'antd';
import _ from 'lodash';
import api from '@/services/action';
import ActionType from '@/services/action/type';
import HOOKS from '@/hooks';
import { Button } from '@/web-library/common';
import BasicInformation from './BasicInformation';
import Header from './Header';
import styles from './index.module.less';
import Mapping from './Mapping';

interface BasicValueType {
  id?: string;
  name: string;
  tags?: string[];
  comment?: string;
  color?: string;
  action_type: ActionType.ActionTypeEnum;
  object_type_id: string;
  'affect.object_type_id'?: string;
  'affect.comment'?: string;
  condition: any;
}

const ActionCreateAndEdit: FC = () => {
  const knId = localStorage?.getItem('KnowledgeNetwork.id') || '';

  const history = useHistory();
  const params: any = useParams();
  const { message } = HOOKS.useGlobalContext();

  const mappingRef = useRef(null);

  const { id: atId } = params || {};
  const isEditPage = !!atId;

  const [isIntercept, setIsIntercept] = useState(true); // 是否有为保存中断
  const [conditionVisible, setConditionVisible] = useState(!isEditPage); // 编辑页面，当数据未获取到时，暂时隐藏condition区域，待数据获取到了再显示
  const [stepsCurrent, setStepsCurrent] = useState(0); // 当前步骤
  const [basicValue, setBasicValue] = useState<BasicValueType>({
    action_type: ActionType.ActionTypeEnum.Add,
    color: '#0e5fc5',
  } as any); // 基本信息的值
  const [mappingValue, setMappingValue] = useState({}); // 关系映射的值
  const [basicForm] = Form.useForm();
  const [mappingForm] = Form.useForm();

  useEffect(() => {
    // 编辑页面，发请求获取行动类的信息，用于填充到界面上
    const fetchActionDetail = async (knId: string, atId: string) => {
      try {
        const [detail] = await api.getActionTypeDetail(knId, [atId]);

        Object.assign(detail, {
          'affect.object_type_id': detail.affect?.object_type_id,
          'affect.comment': detail.affect?.comment,
          'schedule.type': detail.schedule?.type || 'FIX_RATE',
          'schedule.FIX_RATE.expression': detail.schedule?.type === 'FIX_RATE' ? detail.schedule?.expression : undefined,
          'schedule.CRON.expression': detail.schedule?.type === 'CRON' ? detail.schedule?.expression : undefined,
        });

        setBasicValue(detail);
        setMappingValue(detail);

        const formFields = Object.entries(detail).map(([key, val]) => ({ name: key, value: val }));

        basicForm.setFields(formFields);
        mappingForm.setFields(formFields);
        setConditionVisible(true);
      } catch (error: any) {
        if (error?.description) {
          message.error(error.description);
        }
      }
    };

    if (knId && atId) {
      fetchActionDetail(knId, atId);
    }
  }, [atId]);

  const goBack = () => {
    history.goBack();
  };

  /** 上一步 */
  const onPrev = () => setStepsCurrent(stepsCurrent - 1);
  /** 下一步 */
  const onNext = () => {
    basicForm.validateFields().then((values) => {
      setBasicValue(values);
      setStepsCurrent(stepsCurrent + 1);
    });
  };

  const onSubmit = async () => {
    const { 'affect.object_type_id': affectObjectType, 'affect.comment': affectComment, condition } = basicValue;
    const affect = affectObjectType || affectComment ? { object_type_id: affectObjectType, comment: affectComment } : undefined;
    const step1Params = {
      ..._.pick(basicValue, 'id', 'name', 'tags', 'comment', 'color', 'action_type', 'object_type_id'),
      affect,
      condition: condition?.field || condition?.operation ? condition : undefined,
    };

    const {
      action_source,
      parameters,
      'schedule.type': scheduleType,
      'schedule.FIX_RATE.expression': scheduleFixExpression,
      'schedule.CRON.expression': scheduleCronExpression,
    } = mappingForm.getFieldsValue();
    const { box_id, tool_id, tool_name, mcp_id, type } = action_source || {};
    let actionSource: any = undefined;
    if (box_id) {
      actionSource = { type, box_id, tool_id };
    } else if (mcp_id) {
      actionSource = { type, mcp_id, tool_name };
    }
    const expression = scheduleType === 'FIX_RATE' ? scheduleFixExpression : scheduleCronExpression;
    const step2Params = {
      action_source: actionSource,
      parameters: parameters?.length ? parameters : undefined,
      schedule: expression ? { type: scheduleType, expression } : undefined,
    };

    try {
      if (atId) {
        // 编辑
        await api.editActionType(knId, atId, _.omit({ ...step1Params, ...step2Params, branch: 'main' }, 'id'));
      } else {
        // 新建
        await api.createActionType(knId, [{ ...step1Params, ...step2Params, branch: 'main' }]);
      }

      goBack();
    } catch (error: any) {
      if (error?.description) {
        message.error(error.description);
      }
    }
  };

  const title = isEditPage ? basicValue.name : intl.get('Global.createActionType');
  const StepsContent: any = {
    0: {
      content: <BasicInformation form={basicForm} value={basicValue} knId={knId} atId={atId} conditionVisible={conditionVisible} isEditPage={isEditPage} />,
      nextText: intl.get('Global.nextStep'),
      nextClick: onNext,
    },
    1: {
      content: (
        <Mapping
          form={mappingForm}
          value={mappingValue}
          ref={mappingRef}
          basicForm={basicForm}
          knId={knId}
          atId={atId}
          objectTypeId={basicValue.object_type_id}
        />
      ),
      nextText: intl.get('Global.saveAndExit'),
      nextClick: () => {
        const { isValid } = (mappingRef.current as any)?.validate?.() || {};

        if (isValid) {
          onSubmit();
        }
      },
    },
  };

  return (
    <div className={styles['root']}>
      {/* {isIntercept && <RouterPrompt modal={modal} isIntercept title="确认要退出此页面吗?" content="当前内容尚未保存的更改， 是否保存？" />} */}
      <Header title={title} stepsCurrent={stepsCurrent} goBack={goBack} onPrev={onPrev} onNext={onNext} />
      <div className={styles['content']}>{StepsContent?.[stepsCurrent]?.content}</div>
      <div className={styles['footer']}>
        {stepsCurrent === 0 ? (
          <div />
        ) : (
          <Button
            onClick={() => {
              setMappingValue(mappingForm.getFieldsValue());
              onPrev();
            }}
          >
            {intl.get('Global.prevStep')}
          </Button>
        )}
        <div className="g-flex-align-center">
          <Button className="g-mr-2" type="primary" onClick={StepsContent?.[stepsCurrent]?.nextClick}>
            {StepsContent?.[stepsCurrent]?.nextText}
          </Button>
          <Button onClick={goBack}>{intl.get('Global.cancel')}</Button>
        </div>
      </div>
    </div>
  );
};

export default ActionCreateAndEdit;
