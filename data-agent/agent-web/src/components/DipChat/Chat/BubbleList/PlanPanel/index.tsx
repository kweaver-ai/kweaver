import styles from './index.module.less';
import React, { useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button, Checkbox, Skeleton, Statistic, Tooltip } from 'antd';
import { nanoid } from 'nanoid';
import _ from 'lodash';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';
import { useDipChatStore } from '@/components/DipChat/store';
import Logo from '@/components/Logo';
import ShinyText from '@/components/animation/ShinyText';
import { useDeepCompareEffect, useDeepCompareMemo } from '@/hooks';
import DipIcon from '@/components/DipIcon';
import TaskListColorIcon from '@/assets/icons/task-list-color.svg';
import PanelFooter from '../PanelFooter';
import { PlusCircleFilled } from '@ant-design/icons';
import { getDefaultCountdown } from '@/components/DipChat/utils';
import DownTimer from '@/components/DipChat/components/DownTimer';

export type PlanItemNetSearchProcessChildType = {
  content: string;
  icon: string;
  link: string;
  media: string;
  title: string;
};

export type PlanItemNetSearchProcessType = {
  title: string;
  children: PlanItemNetSearchProcessChildType[];
};

export type PlanItemDocSearchProcessType = {
  content: string;
  doc_id: string;
  doc_name: string;
  ext_type: string;
  object_id: string;
};

export type PlanItemGraphSearchProcessType = {
  content: string;
  kg_name: string;
  id: string;
};

export type PlanItemProcessType =
  | PlanItemNetSearchProcessType
  | PlanItemDocSearchProcessType
  | PlanItemGraphSearchProcessType;

export type PlanSearchType = 'net-search' | 'graph-search' | 'doc-search' | 'summary';

export type PlanItemType = {
  text: string; // 计划文本
  finished: boolean; // 是否执行完成
  loading: boolean; // 是否正在执行
  id: string;
  processData: PlanItemProcessType[]; // 计划的执行过程数据, 不同的searchType，结构不同
  executeResult: string; // 计划的执行结果
  searchType: PlanSearchType | '';
  deadline?: number; // 确认计划的倒计时, 为0则不渲染倒计时
};

type PlanPanelType = {
  type?: 'chat' | 'explore';
  chatItemIndex: number;
};
const PlanPanel = ({ type = 'chat', chatItemIndex }: PlanPanelType) => {
  const {
    dipChatStore: { chatList, streamGenerating, activeChatItemIndex, aiInputValue, expandedExploreItemId },
    sendChat,
    setDipChatStore,
  } = useDipChatStore();
  const chatItem = chatList[chatItemIndex];
  const { interrupt, generating, content } = chatItem;
  const [isEdit, setIsEdit] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [planList, setPlanList] = useState<PlanItemType[]>([]);
  const cachePlanList = useRef<any>([]);
  const cancelConfirmPlan = useRef(false);
  const btnDisabled = aiInputValue.mode !== 'deep-search';
  const isLastChatItem = chatItemIndex === chatList.length - 1;
  useDeepCompareEffect(() => {
    const isPlan = content && Array.isArray(content); //  大模型回答的是不是计划
    if (isPlan) {
      if (type === 'chat') {
        // 渲染完整计划
        setPlanList(content);
      }
      if (type === 'explore') {
        // 渲染未执行的计划
        setPlanList(content.filter((item: any) => !item.finished));
      }
    }
  }, [content]);
  const deletePlan = (index: number) => {
    const clonePlanList = _.cloneDeep(planList);
    clonePlanList.splice(index, 1);
    setPlanList(clonePlanList);
  };

  const onDragEnd = (params: any) => {
    const { active, over } = params;
    if (active.id !== over.id) {
      const oldIndex = planList.findIndex((item: any) => item.id === active.id);
      const newIndex = planList.findIndex((item: any) => item.id === over.id);
      const newPlanList = arrayMove(planList, oldIndex, newIndex);
      setPlanList(newPlanList);
    }
  };

  const planItemClick = (planId: string, planIndex: number) => {
    // 当前中断处在什么操作，confirm_plan是确认剩余未执行的计划，task_result是确认计划执行的结果
    const argsItem = chatItem.interrupt?.tool_args?.find((arg: any) => arg.key === 'field');
    const isLastItem = chatItemIndex === chatList.length - 1;
    let executePlanItemIndex = -1;
    if (isLastItem && argsItem?.value === 'task_result') {
      executePlanItemIndex = planList.findLastIndex(plan => plan.finished);
    }
    if (type === 'chat') {
      setDipChatStore({
        activeChatItemIndex: chatItemIndex,
        scrollIntoViewPlanId: planId,
        expandedExploreItemId: expandedExploreItemId ? planId : '',
      });
      setDipChatStore({ executePlanItemIndex: planIndex });
      // if (executePlanItemIndex === planIndex) {
      //   setDipChatStore({ executePlanItemIndex });
      // } else {
      //   setDipChatStore({
      //     executePlanItemIndex: -1,
      //   });
      // }
    }
  };

  const loadingPlan = useDeepCompareMemo(() => {
    return planList.find(item => item.loading);
  }, [planList]);

  const readOnly = useDeepCompareMemo(() => {
    return chatItemIndex !== chatList.length - 1 || !!planList.find(item => item.loading || item.finished);
  }, [planList]);

  const hasUnFinishPlan = useDeepCompareMemo(() => {
    return planList.find(item => !item.finished);
  }, [planList]);

  const isPlan = content && Array.isArray(content); //  大模型回答的是不是计划
  const renderTitle = () => {
    if (loadingPlan && isLastChatItem && streamGenerating) {
      return (
        <ShinyText
          loading={streamGenerating && chatItemIndex === chatList.length - 1}
          className="dip-ml-8 dip-flex-item-full-width dip-ellipsis"
          text={`正在执行：${loadingPlan.text}`}
        />
      );
    }
    if (generating) {
      return (
        <ShinyText
          loading={streamGenerating && chatItemIndex === chatList.length - 1}
          className="dip-ml-8 dip-flex-item-full-width dip-ellipsis"
          text="任务方案正在生成中，请稍候..."
        />
      );
    }
    if (!isPlan) {
      return (
        <div
          className="dip-ml-8 dip-flex-item-full-width dip-ellipsis"
          title="我无法理解这个输入，建议您重新表述问题，我会尽力回答。"
        >
          我无法理解这个输入，建议您重新表述问题，我会尽力回答。
        </div>
      );
    }
    return (
      <div className="dip-ml-8 dip-flex-item-full-width dip-ellipsis">
        任务方案已生成！请立即核对，如需调整请确认前告知
      </div>
    );
  };

  const renderHeader = () => {
    if (planList.length > 0) {
      if (type === 'chat') {
        return (
          <div className="dip-flex-align-center">
            <Logo loading={generating} />
            {renderTitle()}
          </div>
        );
      }
      if (type === 'explore') {
        return (
          <div className="dip-flex-align-center">
            <TaskListColorIcon style={{ width: 20, height: 20 }} />
            <span className="dip-text-color dip-ml-8">是否修改未执行的任务指令并重新运行：</span>
          </div>
        );
      }
    }
  };

  const confirmContinue = () => {
    const newChatList = _.cloneDeep(chatList);
    const newInterrupt = _.cloneDeep(interrupt)!;
    newInterrupt.tool_args.forEach(item => {
      if (item.key === 'value') {
        item.value = content.map((item: any) => item.text);
      }
    });
    const reqBody: any = {
      query: chatList[chatItemIndex - 1].content,
      tool: newInterrupt,
      interrupted_assistant_message_id: chatItem.key,
    };
    if (cancelConfirmPlan.current) {
      reqBody.confirm_plan = false;
      newChatList[chatItemIndex].confirm = false;
    }
    sendChat({
      body: reqBody,
      chatList: newChatList,
    });
    setDipChatStore({
      executePlanItemIndex: -1,
    });
  };

  const startExecutePlan = () => {
    const newInterrupt = _.cloneDeep(interrupt)!;
    if (!_.isEmpty(newInterrupt?.tool_args)) {
      newInterrupt.tool_args.forEach(item => {
        if (item.key === 'value') {
          item.value = content.map((item: any) => item.text);
        }
      });
      sendChat({
        body: {
          query: chatList[chatItemIndex - 1].content,
          tool: newInterrupt,
          interrupted_assistant_message_id: chatItem.key,
        },
      });
      setDipChatStore({
        activeChatItemIndex: chatItemIndex,
        // executePlanItemIndex: 0,
      });
    }
  };

  const renderBtn = () => {
    if (!readOnly && isLastChatItem) {
      if (isEdit) {
        return (
          <span>
            <Button
              disabled={btnDisabled}
              shape="round"
              onClick={() => {
                setPlanList(cachePlanList.current);
                setIsEdit(!isEdit);
              }}
            >
              取消修改
            </Button>
            <Button
              disabled={btnDisabled}
              onClick={() => {
                setIsEdit(!isEdit);
                if (type === 'chat') {
                  const newChatList = _.cloneDeep(chatList);
                  newChatList[chatItemIndex].content = planList;
                  setDipChatStore({
                    chatList: newChatList,
                  });
                }
                if (type === 'explore') {
                  const finishedPlanList = content.filter((item: any) => item.finished);
                  const newPlanList = [...finishedPlanList, ...planList];
                  const newChatList = _.cloneDeep(chatList);
                  newChatList[chatItemIndex].content = newPlanList;
                  setDipChatStore({
                    chatList: newChatList,
                  });
                }
              }}
              shape="round"
              type="primary"
              className="dip-ml-8"
            >
              确认修改
            </Button>
          </span>
        );
      }

      return (
        <span>
          <Button
            disabled={btnDisabled}
            shape="round"
            onClick={() => {
              cachePlanList.current = _.cloneDeep(planList);
              setIsEdit(!isEdit);
              if (type === 'explore') {
                setShowCountdown(false);
              }
            }}
          >
            修改方案
          </Button>
          {type === 'chat' ? (
            <Button disabled={btnDisabled} shape="round" type="primary" className="dip-ml-8" onClick={startExecutePlan}>
              开始执行
              {showCountdown && (
                <DownTimer
                  onFinish={() => {
                    setShowCountdown(false);
                    startExecutePlan();
                  }}
                />
              )}
            </Button>
          ) : (
            <Button disabled={btnDisabled} shape="round" type="primary" className="dip-ml-8" onClick={confirmContinue}>
              确认，继续
              {showCountdown && (
                <DownTimer
                  onFinish={() => {
                    setShowCountdown(false);
                    confirmContinue();
                  }}
                />
              )}
            </Button>
          )}
        </span>
      );
    }
  };

  const renderStopGenerate = () => {
    if (chatItem.cancel && type === 'chat') {
      return (
        <div
          className={classNames(' dip-mt-16', {
            // 'dip-text-color-45': !!content?.result,
            'dip-text-color-45': true,
          })}
        >
          已停止输出
        </div>
      );
    }
  };

  const renderFooter = () => {
    if (!isPlan || (!generating && type === 'chat' && chatItem.error)) {
      return <PanelFooter className="dip-mt-8" chatItemIndex={chatItemIndex} />;
    }
  };

  const renderPlanList = () => {
    if (planList.length > 0) {
      return (
        <div className={classNames(styles.planContainer, 'dip-mt-16')}>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={planList.map((item: any) => item.id)} strategy={verticalListSortingStrategy}>
              {planList.map((item, index: number) => (
                <PlanItem
                  disabledDelete={planList.length === 1}
                  planItem={item}
                  key={item.id}
                  deleteItem={() => {
                    deletePlan(index);
                  }}
                  editable={!readOnly && isEdit && isLastChatItem}
                  onClick={() => {
                    planItemClick(item.id, index);
                  }}
                  onChange={(planText: string) => {
                    const clonePlanList = _.cloneDeep(planList);
                    clonePlanList[index].text = planText;
                    setPlanList(clonePlanList);
                  }}
                  isLastChatItem={isLastChatItem}
                />
              ))}
            </SortableContext>
          </DndContext>
          {!readOnly && isEdit && isLastChatItem && (
            <div>
              <Button
                icon={<PlusCircleFilled style={{ fontSize: 26 }} />}
                type="link"
                onClick={() => {
                  const clonePlanList = _.cloneDeep(planList);
                  clonePlanList.push({
                    id: nanoid(),
                    text: '',
                    finished: false,
                    loading: false,
                    processData: [],
                    executeResult: '',
                    searchType: 'net-search',
                  });
                  setPlanList(clonePlanList);
                }}
              />
            </div>
          )}
          <div className="dip-flex-space-between dip-mt-24">
            {type === 'chat' ? (
              <div className="dip-flex">
                <div
                  className={classNames(styles.sign, 'dip-text-color-65 dip-border-radius-10 dip-flex-align-center')}
                >
                  <DipIcon type="icon-dip-task-list" />
                  <ShinyText
                    className="dip-ml-8"
                    text="任务规划"
                    loading={streamGenerating && chatItemIndex === chatList.length - 1}
                  />
                </div>
                {!hasUnFinishPlan && (
                  <Tooltip title="展示探索过程">
                    <Button
                      className="dip-ml-8"
                      onClick={() => {
                        setDipChatStore({
                          activeChatItemIndex: activeChatItemIndex === -1 ? chatItemIndex : -1,
                          // executePlanItemIndex: -1,
                          expandedExploreItemId: '',
                        });
                      }}
                      type="text"
                      icon={<DipIcon type="icon-dip-list" />}
                    />
                  </Tooltip>
                )}
              </div>
            ) : (
              <Checkbox
                onChange={e => {
                  cancelConfirmPlan.current = e.target.checked;
                  setShowCountdown(false);
                }}
              >
                不再提示
              </Checkbox>
            )}
            {renderBtn()}
          </div>
        </div>
      );
    }
  };

  const getSkeletonLoading = () => {
    if (generating && chatItemIndex === chatList.length - 1) {
      if (!isPlan) {
        return true;
      }
    }
    return false;
  };
  return (
    <div
      className={classNames({
        [styles.chatContainer]: type === 'chat',
        [styles.exploreContainer]: type === 'explore',
      })}
    >
      {renderHeader()}

      <Skeleton active loading={getSkeletonLoading()} className="dip-mt-16">
        {renderPlanList()}
        {renderStopGenerate()}
        {renderFooter()}
      </Skeleton>
    </div>
  );
};

export default PlanPanel;
