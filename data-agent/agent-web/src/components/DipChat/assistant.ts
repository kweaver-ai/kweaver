// 逻辑处理

import intl from 'react-intl-universal';
import { getBotIdByAgentKey } from '@/apis/super-assistant';
import type { DipChatState, DipChatItem, DipChatContextType } from './interface';
import { getAgentDetailInUsagePage } from '@/apis/agent-factory';
import {
  getDeepSearchModePlanReport,
  getDefaultCountdown,
  getPlanExecuteProcess,
  getPlanExecuteResult,
  getPlanList,
  getPlanType,
  getChatItemContent,
  isConfirmPlan,
  isExecutePlan,
  isGeneratePlan,
} from './utils';
import _ from 'lodash';
import type { UseTypeOutResponse } from '@/hooks/useStreamingOut';
import { isJSONString } from '@/utils/handle-function';
import type { PlanItemType } from '@/components/DipChat/Chat/BubbleList/PlanPanel';
import { nanoid } from 'nanoid';
import type { GetStateAction } from '@/hooks/useLatestState';
import dayjs from 'dayjs';

/** 获取超级助手配置基础信息 */
export const getSuperAssistantConfig = (): Promise<Partial<DipChatState> | false> =>
  new Promise(async resolve => {
    const agentKeys = [
      { agentKey: 'SimpleChat_Agent', mode: 'normal' },
      { agentKey: 'OnlineSearch_Agent', mode: 'networking' },
      { agentKey: 'deepsearch', mode: 'deep-search' },
      { agentKey: 'DocQA_Agent' },
      { agentKey: 'GraphQA_Agent' },
      { agentKey: 'Summary_Agent' },
      { agentKey: 'Plan_Agent' },
    ];
    const reqArr = agentKeys.map(item => getBotIdByAgentKey(item.agentKey));
    const res = await Promise.all(reqArr);
    let disabled = false;
    let deepThinkHidden = true;
    let deepThinkDisabledForNormal = true;
    let deepThinkDisabledForNetworking = true;
    let deepThinkSelectedForNormal = false;
    let deepThinkSelectedForNetworking = false;
    let agentDetails = {};
    // console.log(res, '依赖的所有Agent的配置');
    const botIdsData: any = {};
    for (let index = 0; index < agentKeys.length; index++) {
      const item = agentKeys[index];
      if (item.mode) {
        botIdsData[item.mode] = {
          botId: res[index]?.id,
          version: 'latest',
        };
      }
      if (!res[index] || !res[index].id) {
        disabled = true;
        break;
      }
      if (item.mode === 'normal' || item.mode === 'networking') {
        if (item.mode === 'normal') {
          agentDetails = res[index];
        }
        if (res[index] && res[index].config) {
          const llms = res[index].config?.llms ?? [];
          llms.forEach((llm: any) => {
            if (llm?.llm_config?.model_type === 'rlm') {
              // 说明配置了推理模型
              deepThinkHidden = false;
              if (item.mode === 'normal') {
                deepThinkDisabledForNormal = false;
                // 说明常规模式只配置了推理模型，深度思考按钮激活 且不可取消激活状态
                if (llms.length === 1) {
                  deepThinkSelectedForNormal = true;
                }
              }
              if (item.mode === 'networking') {
                deepThinkDisabledForNetworking = false;
                // 说明联网模式只配置了推理模型，深度思考按钮激活 且不可取消激活状态
                if (llms.length === 1) {
                  deepThinkSelectedForNetworking = true;
                }
              }
            }
          });
        }
      }
    }
    resolve({
      botIds: botIdsData,
      dipChatDisabled: disabled,
      deepThinkHidden,
      deepThinkDisabledForNormal,
      deepThinkDisabledForNetworking,
      deepThinkSelectedForNormal,
      deepThinkSelectedForNetworking,
      agentDetails,
      agentAppKey: 'super_assistant',
    });
  });

/** 获取普通单一Agent配置基础信息 */
export const getCommentAgentConfig = ({
  agentId,
  agentVersion,
  customSpaceId,
}: any): Promise<Partial<DipChatState> | false> =>
  new Promise(async resolve => {
    const res: any = await getAgentDetailInUsagePage({
      id: agentId,
      version: agentVersion,
      is_visit: true,
      customSpaceId,
    });
    if (res) {
      resolve({
        agentDetails: res,
        deepThinkHidden: true,
        deepThinkDisabledForNormal: false,
        deepThinkDisabledForNetworking: false,
        agentAppKey: res.key,
      });
    } else {
      resolve(false);
    }
  });

/** 后端数据转化为前端渲染结构逻辑处理 */
export const handleChatItemContent = (
  newChatList: DipChatItem[],
  response: UseTypeOutResponse,
  // options: GetChatItemContentOption
  debug: boolean = false
) => {
  const lastIndex = newChatList.length - 1;
  const contentObj = JSON.parse(response.content);
  console.log(contentObj, '通用场景处理');
  // 删除block_answer
  _.forEach(contentObj?.message?.content?.middle_answer?.progress, item => {
    if (item && 'block_answer' in item) {
      delete item.block_answer;
    }
  });
  const { user_message_id, assistant_message_id, message } = contentObj;
  const progress = _.get(message, 'content.middle_answer.progress');
  console.log(progress, '++通用场景处理Progress++');
  newChatList[lastIndex].loading = response.pending;
  newChatList[lastIndex].generating = response.generating;
  if (assistant_message_id) {
    newChatList[lastIndex].key = assistant_message_id;
  }
  if (user_message_id) {
    newChatList[lastIndex - 1].key = user_message_id;
  }
  newChatList[lastIndex].content = _.get(message, 'content') ? getChatItemContent(message) : {};
  newChatList[lastIndex].interrupt = _.get(message, 'ext.ask');
  // debug模式下记录原始数据，方便调试区展示原始输出结果
  if (debug) {
    // 把之前的sourceData移除，只保留最后一次的sourceData
    for (let i = 0; i < newChatList.length; i++) {
      newChatList[i].sourceData = undefined;
    }
    newChatList[lastIndex].sourceData = contentObj;
  }
};

/** 处理流式输出过程中报的错误 */
export const handleStreamingError = (newChatList: DipChatItem[], response: UseTypeOutResponse, error: any) => {
  const contentObj = JSON.parse(response.content);
  const { user_message_id, assistant_message_id } = contentObj;
  const lastIndex = newChatList.length - 1;
  newChatList[lastIndex].loading = false;
  newChatList[lastIndex].generating = false;
  if (assistant_message_id) {
    newChatList[lastIndex].key = assistant_message_id;
  }
  if (user_message_id) {
    newChatList[lastIndex - 1].key = user_message_id;
  }
  console.log(error, '流式过程中报错了');
  // newChatList[lastIndex].error = _.get(error, ['BaseError', 'error_details']) || intl.get('dipChat.streamingError');
  newChatList[lastIndex].error = error;
};

/** 处理接口响应的过程中报的错误 */
export const handleResponseError = (newChatList: DipChatItem[], response: UseTypeOutResponse) => {
  console.log(response, '流式接口本身报错');
  const contentObj = isJSONString(response.content) ? JSON.parse(response.content) : {};
  console.log(contentObj, '流式接口本身报错信息解析');
  const { user_message_id, assistant_message_id } = contentObj;
  const lastIndex = newChatList.length - 1;
  newChatList[lastIndex].loading = false;
  newChatList[lastIndex].generating = false;
  if (assistant_message_id) {
    newChatList[lastIndex].key = assistant_message_id;
  }
  if (user_message_id) {
    newChatList[lastIndex - 1].key = user_message_id;
  }
  newChatList[lastIndex].error = response.error;
};

/** 深度搜索后端数据转化为前端渲染结构逻辑处理 */
export const handleDeepSearch = ({
  newChatList,
  response,
  getStore,
  setDipChatStore,
}: {
  newChatList: DipChatItem[];
  response: UseTypeOutResponse;
  getStore: GetStateAction<DipChatState>;
  setDipChatStore: DipChatContextType['setDipChatStore'];
}) => {
  const lastIndex = newChatList.length - 1;
  const contentObj = JSON.parse(response.content);
  console.log(contentObj, '流式响应handleDeepSearch');
  const {
    assistant_message_id,
    user_message_id,
    message: {
      content: {
        middle_answer: { other_variables },
        final_answer,
      },
      ext: { ask, total_time, total_tokens },
    },
  } = contentObj;

  if (assistant_message_id) {
    newChatList[lastIndex].key = assistant_message_id;
  }
  if (user_message_id) {
    newChatList[lastIndex - 1].key = user_message_id;
  }
  const currentRole = newChatList[lastIndex]?.role;
  if (currentRole === 'plan') {
    // 说明是正在生成计划
    if (isGeneratePlan(other_variables)) {
      newChatList[lastIndex].loading = response.pending;
      newChatList[lastIndex].generating = response.generating;
      const plan_list = getPlanList(other_variables);
      if (Array.isArray(plan_list)) {
        newChatList[lastIndex].content = plan_list
          .filter((item: string) => !!item)
          .map((item: string) => {
            const planItem: PlanItemType = {
              id: nanoid(),
              text: item,
              finished: false,
              loading: false,
              processData: [],
              executeResult: '',
              searchType: 'net-search',
            };
            return planItem;
          });
      }
      newChatList[lastIndex].interrupt = ask;
    }
    // 说明在执行计划
    if (isExecutePlan(other_variables)) {
      newChatList[lastIndex].loading = false;
      newChatList[lastIndex].generating = false;
      const executingPlan = other_variables.plan;
      const planIndex = newChatList[lastIndex].content.findIndex((item: any) => item.text === executingPlan);
      const planItem = newChatList[lastIndex].content[planIndex];
      // 存在流式会返回上个已经执行完的计划的情况，故做判断，只有未完成的计划才可以继续执行
      if (planIndex !== -1 && !planItem.finished) {
        newChatList[lastIndex].content[planIndex].loading = true;
        newChatList[lastIndex].content[planIndex].processData = getPlanExecuteProcess(other_variables, planIndex) ?? [];
        newChatList[lastIndex].content[planIndex].executeResult =
          getPlanExecuteResult(other_variables, planIndex) ?? '';
        newChatList[lastIndex].content[planIndex].searchType = getPlanType(other_variables, planIndex);
        if (ask) {
          // 说明单个计划执行完毕
          newChatList[lastIndex].content[planIndex].loading = false;
          newChatList[lastIndex].content[planIndex].finished = true;
          // 给计划添加倒计时
          newChatList[lastIndex].content[planIndex].deadline = getDefaultCountdown();
          newChatList[lastIndex].interrupt = ask;
        }
        // 用当前正在执行的计划索引，去更新页面中激活的计划索引
        // if (getStore().executePlanItemIndex !== planIndex) {
        if (getStore().executePlanItemIndex === -1) {
          setDipChatStore({
            executePlanItemIndex: planIndex,
          });
        }
      }
    }
    // 说明要确认计划
    if (isConfirmPlan(other_variables)) {
      if (ask) {
        newChatList[lastIndex].confirm = true;
        newChatList[lastIndex].interrupt = ask;
      }
    }
  }
  if (currentRole === 'plan-report') {
    // 说明在生成计划的最终报告
    newChatList[lastIndex].loading = response.pending;
    newChatList[lastIndex].generating = response.generating;
    newChatList[lastIndex].content = {
      markdownText: getDeepSearchModePlanReport(final_answer),
      totalTime: total_time,
      totalTokens: total_tokens,
    };
    setDipChatStore({
      chatListAutoScroll: false,
    });
  }
};

/** 处理会话分组 */
export const handleConversationGroup = (entries: any[]) => {
  // 将列表项按照时间分组
  const groupedItems: Record<string, any[]> = {
    [intl.get('dipChat.today')]: [],
    [intl.get('dipChat.within7Days')]: [],
    [intl.get('dipChat.within30Days')]: [],
  };

  // 先将每个会话按时间分组
  entries.forEach((listItem: any) => {
    const time = listItem.update_time ?? listItem.create_time;
    // const timestamp = Math.floor(time / 1000000); // 将纳秒转换为毫秒
    const timestamp = Math.floor(time); // 将纳秒转换为毫秒
    const date = dayjs(timestamp);
    const now = dayjs();
    let group = intl.get('dipChat.within30Days');

    if (date.isSame(now, 'day')) {
      group = intl.get('dipChat.today');
    } else if (date.isAfter(now.subtract(7, 'day'))) {
      group = intl.get('dipChat.within7Days');
    }

    // 添加到对应分组
    groupedItems[group].push({
      label: listItem.title,
      key: listItem.id,
      temparea_id: listItem.temparea_id,
      timestamp: time,
      status: listItem.status,
      unRead: listItem.message_index > listItem.read_message_index,
    });
  });

  // 构造最终的数组结构
  const items = [
    {
      label: intl.get('dipChat.today'),
      key: 'today',
      children: groupedItems[intl.get('dipChat.today')],
    },
    {
      label: intl.get('dipChat.within7Days'),
      key: 'within7days',
      children: groupedItems[intl.get('dipChat.within7Days')],
    },
    {
      label: intl.get('dipChat.within30Days'),
      key: 'within30days',
      children: groupedItems[intl.get('dipChat.within30Days')],
    },
  ];
  return items;
};
