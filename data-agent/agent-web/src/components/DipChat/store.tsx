import React, { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import useLatestState from '@/hooks/useLatestState';
import type {
  DipChatProps,
  SendChatPram,
  DipChatContextType,
  DipChatState,
  DipChatItem,
  FileItem,
  DipChatItemContentType,
} from './interface';
import { useDeepCompareEffect, useMicroWidgetProps, useStreamingOut, useBusinessDomain } from '@/hooks';
import _ from 'lodash';
import dayjs from 'dayjs';
import {
  getChatUrl,
  getConversationDetailsById,
  getConversationList,
  type GetConversationListOption,
  getConversationSessionStatus,
  markReadConversation,
  recoverConversationSession,
  stopConversation,
} from '@/apis/super-assistant';
import { getParam, isJSONString } from '@/utils/handle-function';
import ViewStore from './components/ViewStore';
import {
  getCommentAgentConfig,
  getSuperAssistantConfig,
  handleConversationGroup,
  handleResponseError,
  handleStreamingError,
  handleChatItemContent,
  handleDeepSearch,
} from './assistant';
import {
  getChatItemContent,
  getChatItemRoleByMode,
  getDeepSearchModePlanReport,
  getPlanExecuteProcess,
  getPlanExecuteResult,
  getPlanList,
  getPlanType,
  getTempAreaEnable,
  handleAgentConfigFileExt,
} from '@/components/DipChat/utils';
import { getAgentsByPost, getAllFileExt } from '@/apis/agent-factory';
import type { PlanItemType } from '@/components/DipChat/Chat/BubbleList/PlanPanel';
import { nanoid } from 'nanoid';
import AgentNotExist from '@/components/AgentNotExist';

const initStoreData: DipChatState = {
  activeConversationKey: '',
  conversationListModalOpen: false,
  conversationItems: [],
  conversationItemsTotal: 0,
  conversationCollapsed: false,
  chatList: [],
  chatListAutoScroll: false,
  executePlanItemIndex: -1,
  activeChatItemIndex: -1,
  aiInputValue: {
    inputValue: '',
    fileList: [],
    mode: 'deep-search',
    deepThink: false,
  },
  streamGenerating: false,
  scrollIntoViewPlanId: '',
  botIds: {},
  dipChatDisabled: false,
  deepThinkHidden: false,
  deepThinkDisabledForNormal: true,
  deepThinkDisabledForNetworking: true,
  deepThinkSelectedForNormal: false,
  deepThinkSelectedForNetworking: false,
  expandedExploreItemId: '',
  agentDetails: {},
  agentAppType: 'super-assistant',
  debug: false,
  showDebuggerArea: false,
  tempFileList: [],
  agentAppKey: 'super_assistant',
  activeProgressIndex: -1,
  showAgentInputParamsDrawer: false,
  agentInputParamForm: null,
  agentInputParamsFormValue: {},
  agentInputParamsFormErrorFields: [],
  singleStreamResult: [],
  toolAutoExpand: true,
  logQueryAgentDetails: {},
};

const DipChatContext = createContext({} as DipChatContextType);

export const useDipChatStore = (): DipChatContextType => {
  const context = useContext(DipChatContext);
  if (context === undefined) {
    throw new Error('useDipChatStore must be used within DipChatProvider');
  }
  return context;
};

const DipChatStore: React.FC<PropsWithChildren<DipChatProps>> = props => {
  const microWidgetProps = useMicroWidgetProps();
  const { publicBusinessDomain } = useBusinessDomain();
  const {
    children,
    defaultChatList = [],
    defaultAiInputValue = {},
    agentAppType,
    agentId,
    agentVersion,
    agentDetails,
    debug = false,
    onSaveAgent,
    customSpaceId,
  } = props;
  const mounted = useRef(false);
  const [response, send, stop] = useStreamingOut({
    onOpen: () => {
      if (!debug) {
        // 每次发起chat接口时，重新获取一次conversationList，因为会话创建由后端创建了
        getConversationData();
      }
    },
  });
  const [store, setStore, getStore, resetStore] = useLatestState<DipChatState>({
    ...initStoreData,
    chatList: defaultChatList,
    aiInputValue: {
      ...initStoreData.aiInputValue,
      ...defaultAiInputValue,
    },
    agentAppType,
    agentDetails: agentDetails ? agentDetails : {},
    debug,
    conversationCollapsed: agentAppType !== 'super-assistant',
  });
  const [allFileExtData, setAllFileExtData] = useState({});
  const [agentDetailsLoading, setAgentDetailsLoading] = useState(true);
  const conversationTimer = useRef<any>(null);
  const newChatListRef = useRef<DipChatItem[]>([]);
  const conversationSessionTimer = useRef<any>(null);
  const conversationSessionExpiredTime = useRef<any>('');

  useEffect(() => {
    if (debug) {
      getFileExt();
    }
    return () => {
      stop();
      if (conversationTimer.current) {
        clearTimeout(conversationTimer.current);
        conversationTimer.current = null;
      }
      closeConversationSessionTimer();
    };
  }, []);

  useEffect(() => {
    if (publicBusinessDomain?.id) {
      getLogQueryAgentDetails(publicBusinessDomain.id);
    }
  }, [publicBusinessDomain]);

  // 获取日志查询的Agent详情
  const getLogQueryAgentDetails = async (publicBusinessDomainId: string) => {
    const res: any = await getAgentsByPost({
      pagination_marker_str: '',
      category_id: '',
      size: 120,
      name: '智能体日志排查',
      custom_space_id: '',
      is_to_square: 1,
      business_domain_ids: [publicBusinessDomainId], // 获取公共业务域的
    });
    if (res) {
      const target = _.get(res, 'entries', [])[0];
      if (target) {
        setDipChatStore({
          logQueryAgentDetails: target,
        });
      }
    }
  };

  /** debug模式下获取所有的文件扩展 */
  const getFileExt = async () => {
    const res = await getAllFileExt();
    if (res) {
      setAllFileExtData(res);
    }
  };

  // 初始化Agent详情信息
  useDeepCompareEffect(() => {
    // 外部传进来的agentDetails优先级最高
    if (!_.isEmpty(agentDetails)) {
      const { aiInputValue } = getStore();
      setDipChatStore({
        agentDetails: handleAgentConfigFileExt(agentDetails, allFileExtData),
        agentAppKey: agentDetails.id,
        aiInputValue: {
          ...aiInputValue,
          mode: 'normal', // 普通场景的Agent 全部对应常规模式
        },
      });
      setAgentDetailsLoading(false);
    } else {
      // 超级助手应用场景
      if (agentAppType === 'super-assistant') {
        initSuperAssistantBotId();
      }
      // 普通Agent应用场景
      if (agentAppType === 'common' || agentAppType === 'wenshu') {
        if (agentId && agentVersion) {
          initAgentConfig();
        }
      }
    }

    return () => {
      microWidgetProps.changeCustomPathComponent?.(null);
    };
  }, [agentDetails, allFileExtData]);

  /** 初始化超级助手应用场景 */
  const initSuperAssistantBotId = async () => {
    const res = await getSuperAssistantConfig();
    setAgentDetailsLoading(false);
    if (res) {
      setDipChatStore(res);
      defaultSendChatOnce();
    }
  };

  /** 初始化普通场景的Agent 普通场景的Agent对应超级助手的常规模式 */
  const initAgentConfig = async () => {
    const res = await getCommentAgentConfig({
      agentId,
      agentVersion,
      customSpaceId,
    });
    setAgentDetailsLoading(false);
    if (res) {
      // 更新Header头路径为Agent的名字
      const agentDetails = _.get(res, 'agentDetails');
      if (!_.isEmpty(agentDetails)) {
        microWidgetProps.changeCustomPathComponent?.({
          label: agentDetails.name,
        });
      }
      setDipChatStore({
        ...res,
        aiInputValue: {
          ...initStoreData.aiInputValue,
          mode: 'normal', // 普通场景的Agent 全部对应常规模式
        },
      });
      defaultSendChatOnce();
    }
  };

  /** 默认发送一次请求 */
  const defaultSendChatOnce = () => {
    if (defaultChatList.length > 0) {
      const item = defaultChatList[defaultChatList.length - 2];
      const lastItem = defaultChatList[defaultChatList.length - 1];
      if (item.role === 'user' && lastItem.loading) {
        const body: any = { query: item.content };
        if (item.fileList && item.fileList.length > 0) {
          // 说明有文件
          body.temp_files = item.fileList.map(fileItem => ({
            id: fileItem.id,
            name: fileItem.name,
            type: fileItem.type,
          }));
        }
        sendChat({
          body,
        });
      }
    }
  };

  const setDipChatStore: DipChatContextType['setDipChatStore'] = data => {
    setStore(prevState => ({
      ...prevState,
      ...data,
    }));
  };

  // 此函数内容是将流式的原始数据转换成为前端需要的渲染数据
  useDeepCompareEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const { chatList, botIds, agentAppType, agentAppKey, activeConversationKey, toolAutoExpand } = getStore();
    let currentConversationId: string = '';
    newChatListRef.current = _.cloneDeep(chatList);
    const newSingleStreamResult = [];
    if (newChatListRef.current.length > 0) {
      if (response.error) {
        handleResponseError(newChatListRef.current, response);
      } else if (response.content) {
        const contentObj = JSON.parse(response.content);
        currentConversationId = contentObj.conversation_id;
        // 供调试用，用于开发和测试快速查看流式返回的完整结果
        newSingleStreamResult.push(contentObj);

        const { message, error } = contentObj;
        if (!_.isEmpty(error)) {
          handleStreamingError(newChatListRef.current, response, error);
        } else if (message && _.isObject(message)) {
          const {
            agent_info: { agent_id },
          } = message as any;
          if (agentAppType === 'super-assistant') {
            const botData = Object.keys(botIds).map(key => {
              return {
                mode: key,
                ...botIds[key],
              };
            });
            const targetBot = botData.find(bot => bot.botId === agent_id);
            if (targetBot) {
              const currentMode = targetBot.mode;
              if (currentMode === 'deep-search') {
                handleDeepSearch({
                  newChatList: newChatListRef.current,
                  response,
                  getStore,
                  setDipChatStore,
                });
              } else {
                handleChatItemContent(newChatListRef.current, response, debug);
              }
            }
          } else {
            handleChatItemContent(newChatListRef.current, response, debug);
          }
        }
      }
    }
    // 通用Agent 如果有调用工具的话，需要自动展开工具的侧边栏
    const toolAutoExpandUpdateObj: any = {};
    if (toolAutoExpand && !debug && agentAppType !== 'super-assistant') {
      if (newChatListRef.current.length > 1) {
        const activeChatItemIndex = newChatListRef.current.length - 1;
        const chatItem = newChatListRef.current[activeChatItemIndex];
        const content: DipChatItemContentType = chatItem.content || { progress: [], cites: {}, related_queries: [] };
        const progress = _.get(content, 'progress') || [];
        if (progress.some(progressItem => progressItem.type !== 'llm')) {
          const lastNonLlmIndex = progress.findLastIndex(progressItem => progressItem.type !== 'llm');
          toolAutoExpandUpdateObj.activeChatItemIndex = activeChatItemIndex;
          toolAutoExpandUpdateObj.activeProgressIndex = lastNonLlmIndex;
        }
      }
    }
    setDipChatStore({
      chatList: newChatListRef.current,
      streamGenerating: response.generating,
      singleStreamResult: newSingleStreamResult,
      ...toolAutoExpandUpdateObj,
    });

    // 流式过程中发现当前没有选中一个conversation的话，则根据流式返回的conversation_id去选中会话，因为默认由流式接口来创建会话
    if (!activeConversationKey && currentConversationId) {
      handleConversation(currentConversationId);
    }

    // 流式结束后要做的事情
    if (!response.generating) {
      if (
        !debug &&
        activeConversationKey &&
        currentConversationId &&
        activeConversationKey === currentConversationId &&
        !response.cancel
      ) {
        const markRead = async () => {
          await markReadConversation(agentAppKey, activeConversationKey, newChatListRef.current.length);
          getConversationData();
          newChatListRef.current = [];
        };
        markRead();
      }
      setTimeout(() => {
        setDipChatStore({ chatListAutoScroll: false });
        newChatListRef.current = [];
      }, 1000);
    }
  }, [response]);

  // 监听当前选中的会话有效期
  useEffect(() => {
    if (store.activeConversationKey) {
      const getStatus = async () => {
        const { activeConversationKey, agentDetails, debug } = getStore();
        const res = await getConversationSessionStatus({
          conversation_id: activeConversationKey,
          agent_id: agentDetails.id,
          agent_version: debug ? 'v0' : agentDetails.version,
        });
        if (res) {
          // console.log('查询会话状态', res);
          const expireTime = dayjs().add(res.ttl, 'second').format('YYYY-MM-DD HH:mm:ss');
          // console.log('会话有效期：', expireTime);
          conversationSessionExpiredTime.current = expireTime;
          openConversationSessionTimer();
        }
      };
      getStatus();
    }
    return () => {
      closeConversationSessionTimer();
    };
  }, [store.activeConversationKey]);

  /** 会话列表数据逻辑处理 */
  const handleConversation = (conversation_id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('conversation_id', conversation_id);
    // 使用history API更新URL而不刷新页面
    window.history.replaceState({}, '', url.toString());
    setDipChatStore({
      activeConversationKey: conversation_id,
    });
  };

  const getTempAreaEnabled = () => {
    const { agentAppType, agentDetails } = getStore();
    // 超级助手没有临时区
    if (agentAppType === 'super-assistant') {
      return false;
    }
    const agentConfig = agentDetails.config;
    return getTempAreaEnable(agentConfig);
  };

  const clearTempAreaFileChecked = () => {
    const { tempFileList } = getStore();
    setDipChatStore({
      tempFileList: tempFileList.map(item => ({
        ...item,
        checked: false,
      })),
    });
  };

  /** 开启会话Session的定时器 */
  const openConversationSessionTimer = () => {
    closeConversationSessionTimer();
    conversationSessionTimer.current = setInterval(() => {
      const { activeConversationKey, agentDetails } = getStore();
      if (activeConversationKey && !_.isEmpty(agentDetails) && !_.isEmpty(conversationSessionExpiredTime.current)) {
        const remain = dayjs(conversationSessionExpiredTime.current).diff(dayjs(), 'second');
        // console.log('当前选中对话session有效期剩余：', remain);
        if (remain <= 30) {
          updateConversationSession(activeConversationKey);
        }
      }
    }, 1000);
  };

  /** 关闭会话Session的定时器 */
  const closeConversationSessionTimer = () => {
    if (conversationSessionTimer.current) {
      clearInterval(conversationSessionTimer.current);
      conversationSessionTimer.current = null;
    }
  };

  /** 流式接口发送 */
  const sendChat = async (params: SendChatPram) => {
    const {
      streamGenerating,
      activeChatItemIndex,
      activeConversationKey,
      aiInputValue,
      botIds,
      agentAppType,
      agentDetails,
      agentAppKey,
      tempFileList,
      debug,
    } = getStore();

    if (!streamGenerating) {
      setDipChatStore({
        chatListAutoScroll: true,
        streamGenerating: true,
        toolAutoExpand: true,
        singleStreamResult: [],
      });

      let canSend: any = true;
      // debugger 模式下，先调用一次保存接口，触发Agent配置页面的报错
      if (debug && onSaveAgent) {
        canSend = await onSaveAgent();
      }
      if (!canSend) {
        setDipChatStore({
          streamGenerating: false,
        });
        return;
      }

      if (debug) {
        // debug模式下，每次发送，都要打开Debugger区域
        setDipChatStore({
          showDebuggerArea: true,
        });
      }

      if (activeConversationKey) {
        params.body.conversation_id = activeConversationKey;
      }

      // 是否带上文件，看有没有开启临时区域  决定文件如何传递
      if (!params.body.temp_files) {
        let files = aiInputValue.fileList;
        // 调试模式下，临时区域不会渲染，故上传的文件只可能在对话框里面上传
        if (!debug && getTempAreaEnabled()) {
          files = tempFileList.filter(file => file.checked);
        }
        if (files.length > 0) {
          params.body.temp_files = files.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            details: {
              docid: item.docid,
              size: item.size,
            },
          }));
          // 将文件回显到用户的问题上
          if (params.chatList) {
            params.chatList.forEach((item, index) => {
              if (item.role === 'user' && index === params.chatList!.length - 2) {
                item.fileList = files;
              }
            });
          }
        }
      }

      // 是否更新聊天列表
      if (params.chatList) {
        let chatItemIndex = -1;
        if (activeChatItemIndex !== -1 && aiInputValue.mode === 'deep-search') {
          chatItemIndex = params.activeChatItemIndex ?? params.chatList.length - 1;
        }
        setDipChatStore({
          chatList: params.chatList,
          activeChatItemIndex: chatItemIndex,
        });
      }

      // 超级助手模式下深度思考参数处理
      if (agentAppType === 'super-assistant' && aiInputValue.mode !== 'deep-search') {
        if (aiInputValue.deepThink) {
          params.body.chat_mode = 'deep_thinking';
        } else {
          params.body.chat_mode = 'normal';
        }
      }

      const getReqBody = () => {
        if (debug) {
          const paramsBody = _.cloneDeep(params.body);
          const conversation_id = paramsBody.conversation_id;
          delete paramsBody.conversation_id;
          let agent_id = agentDetails?.id;
          if (!agent_id && typeof canSend === 'string') {
            agent_id = canSend;
          }
          return {
            agent_id,
            agent_version: 'v0', // v0 可以获取到最新的保存但是未发布的Agent配置
            input: {
              ...paramsBody,
            },
            conversation_id,
            stream: true,
            inc_stream: true,
            executor_version: agentAppType === 'super-assistant' ? 'v1' : 'v2',
            chat_option: {
              is_need_history: true,
              is_need_doc_retrival_post_process: true,
              is_need_progress: true,
              enable_dependency_cache: false,
            },
          };
        }
        // 说明要恢复对话
        if (params.recoverConversation) {
          return {
            conversation_id: params.body.conversation_id,
          };
        }
        let agent_id = agentDetails?.id;
        let agent_version = agentDetails?.version;
        if (agentAppType === 'super-assistant') {
          const botInfo = botIds[aiInputValue.mode];
          agent_id = botInfo.botId;
          agent_version = botInfo.version;
        }
        return {
          ...params.body,
          agent_id,
          agent_version,
          stream: true,
          inc_stream: true,
          executor_version: agentAppType === 'super-assistant' ? 'v1' : 'v2',
          chat_option: {
            is_need_history: true,
            is_need_doc_retrival_post_process: true,
            is_need_progress: true,
            enable_dependency_cache: true,
          },
        };
      };
      const reqBody = getReqBody();
      send({
        body: { ...reqBody },
        url: getChatUrl(agentAppKey ?? reqBody.agent_id, params.recoverConversation, debug, customSpaceId),
        increase_stream: true,
      });
      if (!debug) {
        clearTempAreaFileChecked();
      }
    }
  };

  /** 终止会话 */
  const stopChat = () => {
    const { chatList, streamGenerating, activeConversationKey, agentAppKey } = getStore();
    if (streamGenerating) {
      stop();
      const newChatList = _.cloneDeep(chatList);
      const lastIndex = newChatList.length - 1;
      if (newChatList[lastIndex]) {
        newChatList[lastIndex].cancel = true;
        newChatList[lastIndex].loading = false;
        setDipChatStore({
          chatList: newChatList,
        });
        stopConversation(agentAppKey, activeConversationKey);
      }
    }
  };

  const getConversationData = async (params: GetConversationListOption = { size: 10 }) => {
    const { agentAppKey, conversationListModalOpen } = getStore();
    const res: any = await getConversationList(agentAppKey, params);
    if (res) {
      const { entries, total } = res;
      const key = getParam('conversation_id') ?? '';
      const groupData = handleConversationGroup(entries);
      const items: any = groupData.filter(ii => ii.children.length > 0);
      setDipChatStore({
        conversationItems: items,
        conversationItemsTotal: total,
        activeConversationKey: key,
      });
      if (!conversationListModalOpen) {
        const hasProcessing = entries.some((item: any) => item.status === 'processing');
        if (hasProcessing) {
          // 清理之前的定时器，避免多个定时器同时运行
          if (conversationTimer.current) {
            clearTimeout(conversationTimer.current);
          }
          conversationTimer.current = setTimeout(() => {
            getConversationData();
          }, 2000);
        } else {
          // 如果没有正在处理的对话，清理定时器
          if (conversationTimer.current) {
            clearTimeout(conversationTimer.current);
            conversationTimer.current = null;
          }
        }
      }
    }
  };

  const renderChildren = () => {
    if (agentAppType === 'super-assistant') {
      return !_.isEmpty(store.botIds) && children;
    }
    if ((agentAppType === 'common' || agentAppType === 'wenshu') && !agentDetailsLoading) {
      if (_.isEmpty(store.agentDetails)) {
        return <AgentNotExist />;
      }
      return children;
    }
  };
  const openSideBar = (chatItemIndex: number) => {
    setDipChatStore({
      activeChatItemIndex: chatItemIndex,
      toolAutoExpand: false,
    });
  };

  const closeSideBar = () => {
    setDipChatStore({
      activeChatItemIndex: -1,
      activeProgressIndex: -1,
      // 关闭侧边栏的时候，如果是计划侧边栏，需要重置计划的所有state
      executePlanItemIndex: -1,
      expandedExploreItemId: '',
      scrollIntoViewPlanId: '',
      toolAutoExpand: false,
    });
  };

  /** 更新会话的Session */
  const updateConversationSession = async (conversation_id: string) => {
    closeConversationSessionTimer();
    const { agentDetails, debug } = getStore();
    const initRes = await recoverConversationSession({
      agent_id: agentDetails.id,
      agent_version: debug ? 'v0' : agentDetails.version,
      conversation_id,
    });
    if (initRes) {
      conversationSessionExpiredTime.current = dayjs().add(initRes.ttl, 'second').format('YYYY-MM-DD HH:mm:ss');
      openConversationSessionTimer();
    }
  };

  const getConversationDetailsByKey: DipChatContextType['getConversationDetailsByKey'] = (key: string) =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async resolve => {
      const { agentAppKey, botIds } = getStore();
      const res: any = await getConversationDetailsById(agentAppKey, key);
      if (res && res.Messages) {
        let recoverConversation = false;
        let executePlanItemIndex = -1;
        let data = res.Messages.map((item: any) => ({
          ...item,
          content: isJSONString(item.content) ? JSON.parse(item.content) : {},
        }));
        if (agentAppType === 'super-assistant') {
          const botData = Object.keys(botIds).map(key => {
            return {
              mode: key,
              ...botIds[key],
            };
          });
          data = data.map((item: any) => {
            const targetBot = botData.find(bot => bot.botId === item.agent_id);
            return {
              ...item,
              mode: targetBot?.mode,
            };
          });
        }
        let newChatList: DipChatItem[] = [];
        console.log(data, '会话详情');
        data.forEach((item: any, index: number) => {
          if (item.origin === 'user') {
            const { content } = item;
            let fileList: FileItem[] = [];
            if (content.temp_file) {
              fileList = content.temp_file.map((file: any) => ({
                docid: file?.details?.docid,
                name: file?.name,
                size: file?.details?.size,
                type: file?.type,
                id: file?.id,
              }));
            }
            newChatList.push({
              key: item.id,
              role: 'user',
              content: content.text,
              fileList,
              updateTime: item.update_time,
            });
          }
          if (item.origin === 'assistant') {
            // 说明要恢复未完成的对话
            if (index === data.length - 1 && item.status === 'processing') {
              recoverConversation = true;
            }
            const ext = isJSONString(item.ext) ? JSON.parse(item.ext) : {};
            const ask = _.get(ext, ['ask']);
            switch (agentAppType) {
              case 'super-assistant': {
                const isLastItem = index === data.length - 1;
                if (item.mode === 'normal' || item.mode === 'networking') {
                  newChatList.push({
                    key: item.id,
                    role: getChatItemRoleByMode(item.mode, agentAppType),
                    content: getChatItemContent(item),
                  });
                }
                if (item.mode === 'deep-search') {
                  const content = item.content;
                  const ext = isJSONString(item.ext) ? JSON.parse(item.ext) : {};
                  const ask = _.get(ext, ['ask']);
                  const total_time = _.get(ext, ['total_time']);
                  const total_tokens = _.get(ext, ['total_tokens']);
                  console.log(content, 'deep-search-content');
                  const other_variables = _.get(content, ['middle_answer', 'other_variables']);
                  const final_answer = _.get(content, ['final_answer']);
                  const plan_list = getPlanList(other_variables);
                  const planListData = isJSONString(plan_list) ? JSON.parse(plan_list) : plan_list;
                  if (Array.isArray(planListData)) {
                    let hasUnFinishedPlan = false;
                    const planList: PlanItemType[] = planListData.map((planItem: any, planIndex: number) => {
                      const executeResult = getPlanExecuteResult(other_variables, planIndex) ?? '';
                      const finished = !!executeResult;
                      if (!finished) {
                        hasUnFinishedPlan = true;
                      }
                      return {
                        id: nanoid(),
                        text: planItem,
                        finished,
                        loading: false,
                        processData: getPlanExecuteProcess(other_variables, planIndex) ?? [],
                        executeResult,
                        searchType: getPlanType(other_variables, planIndex),
                      };
                    });

                    // 当前中断处在什么操作，confirm_plan是确认剩余未执行的计划，task_result是确认计划执行的结果
                    const argsItem = ask?.tool_args?.find((arg: any) => arg.key === 'field');
                    if (isLastItem && argsItem?.value === 'task_result') {
                      executePlanItemIndex = planList.findLastIndex(plan => plan.finished);
                    }
                    const tempArr: DipChatItem[] = [
                      {
                        key: item.id,
                        role: 'plan',
                        content: planList,
                        interrupt: ask,
                        confirm:
                          isLastItem && hasUnFinishedPlan && argsItem?.value === 'confirm_plan' ? true : undefined, // 最后一条聊天项并且有未完成的计划
                      },
                    ];
                    const report = getDeepSearchModePlanReport(final_answer);
                    if (report) {
                      tempArr.push({
                        key: nanoid(),
                        role: 'plan-report',
                        content: {
                          markdownText: report,
                          totalTime: total_time,
                          totalTokens: total_tokens,
                        },
                      });
                    }
                    newChatList = [...newChatList, ...tempArr];
                  }
                }
                break;
              }
              default:
                newChatList.push({
                  key: item.id,
                  role: 'common',
                  content: getChatItemContent(item),
                  interrupt: ask,
                  error: item.status === 'failed' ? '{}' : undefined,
                });
                break;
            }
          }
        });
        resolve({
          recoverConversation,
          chatList: newChatList,
          executePlanItemIndex,
          read_message_index: res.read_message_index,
          message_index: res.message_index,
        });
      } else {
        resolve(false);
      }
    });

  return (
    <DipChatContext.Provider
      value={{
        dipChatStore: store,
        setDipChatStore,
        getDipChatStore: getStore,
        resetDipChatStore: resetStore,
        sendChat: params => {
          // 发送聊天之前，处理多参数的情况
          const { agentInputParamForm } = getStore();
          if (agentInputParamForm) {
            agentInputParamForm.validateFields().then(values => {
              // Agent多参数的处理
              params.body.custom_querys = values;
              sendChat(params);
            });
          } else {
            sendChat(params);
          }
        },
        stopChat,
        cancelChat: () => {
          stop();
        },
        openSideBar,
        closeSideBar,
        getConversationData,
        getConversationDetailsByKey,
      }}
    >
      <ViewStore />
      {renderChildren()}
    </DipChatContext.Provider>
  );
};

export default DipChatStore;
