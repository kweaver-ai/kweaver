import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { uniq } from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { Row, Col, Button, message, Spin, Modal, Empty, Input, Select, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, SearchOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import {
  getRecentVisitAgents,
  getAgentCategoryList,
  deleteAgent,
  unpublishAgent,
  getBatchDataProcessingStatus,
  copyAgent,
  copyTemplate,
  PublishStatusEnum,
  getSpaceInfo,
  AgentPublishToBeEnum,
  unpublishTemplate,
  deleteTemplate,
  getAgentManagementPerm,
  type AgentManagementPermType,
  deleteSpaceResourceByResourceId,
  SpaceResourceEnum,
  getMyTemplateList,
  exportAgent,
} from '@/apis/agent-factory';
import { Agent, Category } from '@/apis/agent-factory/type';
import PlusIcon from '@/assets/icons/plus.svg';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { useMicroWidgetProps } from '@/hooks';
import empty from '@/assets/images/empty.png';
import ExportIcon from '@/assets/icons/export.svg';
import ImportIcon from '@/assets/icons/import.svg';
import { downloadFile, getFilenameFromContentDisposition } from '@/utils/file';
import { useSize } from '@/hooks';
import { formatTimeSlash } from '@/utils/handle-function/FormatTime';
import { PublishSettingsModal, PublishModeEnum } from '@/components/AgentPublish';
import LoadFailed from '@/components/LoadFailed';
import SpaceAgentAddButton from '@/components/SpaceAgentAddButton';
import AgentIcon from '@/components/AgentIcon';
import BaseCard, { computeColumnCount, gap } from '@/components/BaseCard';
import SkeletonGrid from '@/components/BaseCard/SkeletonGrid';
import GradientContainer from '../GradientContainer';
import MyCreatedTab from './MyCreatedTab';
import { handleImportAgent } from './import-agent';
import { getMenuItems, getSearchPlaceholder, fetchData, getUserInfo } from './utils';
import { ModeEnum, AgentActionEnum, TemplateActionEnum } from './types';
import styles from './index.module.less';
import qs from 'qs';
import Header from './Header';

export { ModeEnum };

interface DataAgentsProps {
  mode?: ModeEnum;
}

const DataAgents = ({ mode: modeFromProps = ModeEnum.DataAgent }: DataAgentsProps) => {
  const publishStatusFilterRef = useRef<PublishStatusEnum>(PublishStatusEnum.All);
  const publishCategoryFilterRef = useRef<AgentPublishToBeEnum>(AgentPublishToBeEnum.All);
  const publishModeRef = useRef<PublishModeEnum | undefined>(undefined);
  const isMounted = useRef<boolean>(false);
  const nextPaginationMarkerStrRef = useRef<string>(''); // 分页marker，用于获取下一批数据
  // 分类-外部容器
  const containerRef = useRef<HTMLDivElement | null>(null);
  // 分类-可滚动容器
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  // 分类-当前滚动位置
  const scrollPositionRef = useRef<number>(0);

  const { width: containerWidth } = useSize(containerRef.current);
  const { width: contentWidth } = useSize(scrollableRef.current);

  const { customSpaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const microWidgetProps = useMicroWidgetProps();
  const [modal, contextHolder] = Modal.useModal();
  const [recentLoading, setRecentLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>({ category_id: '', name: '全部' });
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [categoryAgents, setCategoryAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [mode, setMode] = useState<ModeEnum>(modeFromProps);
  // 在我的创建页面是否显示【DataAgent】、【我的模板】的Tab
  const [showMyCreatedTab, setShowMyCreatedTab] = useState<boolean>(false);
  // 分类-箭头是否显示
  const [showScrollArrows, setShowScrollArrows] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  // 搜索相关状态
  const [searchName, setSearchName] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [publishStatusFilter, setPublishStatusFilter] = useState<PublishStatusEnum>(PublishStatusEnum.All);
  const [publishCategoryFilter, setPublishCategoryFilter] = useState<AgentPublishToBeEnum>(AgentPublishToBeEnum.All);

  // 水平滚动相关状态
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const recentAgentsRowRef = useRef<HTMLDivElement>(null);
  const recentAgentsContainerRef = useRef<HTMLDivElement>(null);

  // 发布设置相关状态
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // 自定义空间信息
  const [customSpaceInfo, setCustomSpaceInfo] = useState<{ name: string; created_by: string }>({
    name: '',
    created_by: '',
  });

  // 权限
  const [perms, setPerms] = useState<AgentManagementPermType>({
    custom_space: {
      create: false,
    },
    agent: {
      publish: false,
      unpublish: false,
      unpublish_other_user_agent: false,
      publish_to_be_api_agent: false,
      publish_to_be_data_flow_agent: false,
      publish_to_be_skill_agent: false,
      publish_to_be_web_sdk_agent: false,
      create_system_agent: false,
    },
    agent_tpl: {
      publish: false,
      unpublish: false,
      unpublish_other_user_agent_tpl: false,
    },
  });

  // 导出模式
  const [isExportMode, setIsExportMode] = useState<boolean>(false);
  // 被选中用于导出的项目id
  const [selectedIdsForExport, setSelectedIdsForExport] = useState<string[]>([]);

  const { userAvatars, addUserIds } = useUserAvatars([], 20);

  // 添加处理状态相关状态
  const [processingStatuses, setProcessingStatuses] = useState<{ [key: string]: number }>({});
  const processingStatusTimer = useRef<NodeJS.Timeout | null>(null);

  // 分页相关状态 - 改为page/size模式
  const [pagination, setPagination] = useState({
    page: 1,
    size: 120, // 每页显示数量，需要设置大一些，防止数据量太少不出现纵向滚动条
    hasMore: true, // 是否有更多数据
  });

  // 高亮的agent/templage id
  const [highlightId, setHighlightId] = useState<string>('');

  const listContainerRef = useRef<HTMLDivElement>(null);
  // 容器的宽度
  const [cardWidth, setCardWidth] = useState<number>(0);

  // 是否显示最近访问：只有Data Agent页面显示
  const showRecent = useMemo(() => mode === ModeEnum.DataAgent, [mode]);

  // 是否显示分类: Data Agent、模板、自定义空间、API Agent页面显示
  const showCategory = useMemo(
    () => [ModeEnum.DataAgent, ModeEnum.AllTemplate, ModeEnum.CustomSpace, ModeEnum.API].includes(mode),
    [mode]
  );

  // 搜索框的placeholder
  const searchPlaceholder = useMemo(() => getSearchPlaceholder(mode), [mode]);

  // 当前登录的用户id
  const currentUserId = useMemo(() => microWidgetProps?.config?.userInfo?.id, []);

  // 跳转到agent的使用界面
  const navigateToAgentUsage = useCallback(
    ({ id, version, status }: { id: string; version: string; status: string }) => {
      const params = {
        id,
        version: status === 'unpublished' ? 'v0' : version,
        // agentAppType: name.includes('问数') ? 'wenshu' : 'common',
        agentAppType: 'common',
        preRoute: location.pathname,
        customSpaceId,
      };
      // 自定义空间的agent列表页面，跳转到agent使用页面，使用相对路径导航：前面不用加 /
      navigate(`${mode === ModeEnum.CustomSpace ? '' : '/'}usage?${qs.stringify(params)}`);
    },
    [navigate, mode, location.pathname]
  );

  // 跳转到agent的编辑界面
  const navigateToAgentEditConfig = useCallback(
    ({ id }: { id: string }) => {
      navigate(`/config?agentId=${id}`);
    },
    [navigate]
  );

  // 获取最近访问数据函数
  const fetchRecentAgents = async () => {
    try {
      setRecentLoading(true);
      setRecentError(null);
      // 最近访问，只获取20条数据
      const { entries } = await getRecentVisitAgents({
        page: 1,
        size: 20,
      });

      if (entries && entries.length > 0) {
        setRecentAgents(entries);
        // 批量获取用户头像
        if ([ModeEnum.DataAgent, ModeEnum.AllTemplate].includes(mode)) {
          // Data Agent、全部模板，要显示用户头像
          const userIds = uniq(entries.map(agent => getUserInfo(agent).user_id).filter(userId => userId));
          addUserIds(userIds);
        }
      }
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
      setRecentError('获取最近访问数据时发生错误');
    } finally {
      setRecentLoading(false);
    }
  };

  // 获取分类数据函数 - 使用page/size分页
  const fetchCategoryAgents = async (page = 1, append = false, searchTerm: string = searchName) => {
    try {
      if (!nextPaginationMarkerStrRef.current) {
        setCategoryLoading(true);
      } else {
        setLoadingMore(true);
      }
      setCategoryError(null);

      const { entries, nextPaginationMarkerStr, is_last_page } = await fetchData({
        pagination_marker_str: nextPaginationMarkerStrRef.current,
        mode,
        category_id: selectedCategory.category_id,
        size: pagination.size,
        name: searchTerm,
        custom_space_id: customSpaceId,
        publish_status: publishStatusFilterRef.current,
        publish_to_be: publishCategoryFilterRef.current,
      });
      nextPaginationMarkerStrRef.current = nextPaginationMarkerStr;

      if (append) {
        setCategoryAgents(prev => [...prev, ...entries]);
      } else {
        setCategoryAgents(entries);
      }

      // 已发布的页面，才显示用户头像
      if ([ModeEnum.DataAgent, ModeEnum.AllTemplate, ModeEnum.CustomSpace].includes(mode)) {
        try {
          const userIds = uniq(entries.map(agent => getUserInfo(agent).user_id).filter(userId => userId));
          addUserIds(userIds);
        } catch {}
      }

      // 更新分页信息
      setPagination(prev => ({
        ...prev,
        page: page,
        hasMore: !is_last_page,
      }));
    } catch (ex: any) {
      if (ex?.description) {
        message.error(ex.description);
      }
      setCategoryError('获取数据时发生错误');
    } finally {
      setCategoryLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // 重试函数
  const retryRecentAgents = () => {
    fetchRecentAgents();
  };

  const retryCategoryAgents = () => {
    fetchCategoryAgents(1, false);
  };

  // 获取最近访问数据
  useEffect(() => {
    if (showRecent) {
      fetchRecentAgents();
    }
  }, []);

  // 检查是否需要显示导航箭头
  useEffect(() => {
    const checkScrollArrows = () => {
      if (recentAgentsRowRef.current && recentAgentsContainerRef.current) {
        const container = recentAgentsContainerRef.current;
        const content = recentAgentsRowRef.current;

        // 如果内容宽度大于容器宽度，显示右箭头
        setShowRightArrow(content.scrollWidth > container.clientWidth);

        // 如果已经滚动，显示左箭头
        setShowLeftArrow(scrollPosition > 0);
      }
    };

    // 初始检查
    checkScrollArrows();

    // 窗口大小改变时重新检查
    window.addEventListener('resize', checkScrollArrows);

    return () => {
      window.removeEventListener('resize', checkScrollArrows);
    };
  }, [recentAgents, scrollPosition]);

  // 处理水平滚动
  const handleScroll = (direction: 'left' | 'right') => {
    if (recentAgentsRowRef.current && recentAgentsContainerRef.current) {
      const container = recentAgentsContainerRef.current;
      const content = recentAgentsRowRef.current;
      const scrollAmount = container.clientWidth; // 滚动100%的可见宽度

      let newPosition;
      if (direction === 'left') {
        newPosition = Math.max(0, scrollPosition - scrollAmount);
      } else {
        // 确保不会滚动超出内容宽度
        newPosition = Math.min(content.scrollWidth - scrollAmount + gap, scrollPosition + scrollAmount);
      }

      // 更新滚动位置
      setScrollPosition(newPosition);

      // 应用滚动
      content.style.transform = `translateX(-${newPosition}px)`;

      // 更新箭头状态
      setShowLeftArrow(newPosition > 0);
      setShowRightArrow(newPosition < content.scrollWidth - container.clientWidth);
    }
  };

  // 获取分类数据
  useEffect(() => {
    const fetchCategoryList = async () => {
      try {
        const categories = await getAgentCategoryList();
        setCategories(categories);
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description);
        }
        setCategoryError('获取数据时发生错误');
        setCategoryLoading(false);
      }
    };

    if (showCategory) {
      // 只有已发布的 DataAgent、全部模板、自定义空间-agent页面 会展示分类信息
      fetchCategoryList();
    }
  }, []);

  // 获取分类数据 - 分类变化时重置并加载第一页
  useEffect(() => {
    // 重置分页状态
    nextPaginationMarkerStrRef.current = '';
    setPagination(prev => ({
      ...prev,
      page: 1,
      hasMore: true,
    }));
    fetchCategoryAgents(1, false);
  }, [selectedCategory]);

  // 加载更多数据
  const loadMoreData = () => {
    if (loadingMore || !pagination.hasMore) return;
    fetchCategoryAgents(pagination.page + 1, true);
  };

  // 处理滚动事件，实现懒加载
  useEffect(() => {
    const handleScroll = () => {
      if (!loadingMore && pagination.hasMore) {
        // 获取容器元素
        const container = listContainerRef.current;
        if (!container) return;

        // 检查滚动位置
        const { scrollTop, clientHeight, scrollHeight } = container;

        // 当滚动到距离底部100px 且此时分页marker存在 时触发加载，
        if (scrollTop + clientHeight >= scrollHeight - 100 && nextPaginationMarkerStrRef.current) {
          loadMoreData();
        }
      }
    };

    // 同步window滚动到容器滚动
    const handleWindowScroll = () => {
      const container = listContainerRef.current;
      if (!container) return;

      // 将window的滚动比例同步到容器
      const windowScrollRatio = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      const containerScrollTarget = windowScrollRatio * (container.scrollHeight - container.clientHeight);

      // 防止循环触发
      if (Math.abs(container.scrollTop - containerScrollTarget) > 5) {
        container.scrollTop = containerScrollTarget;
      }
    };

    // 获取容器
    const container = listContainerRef.current;
    if (!container) return;

    // 在容器上添加滚动监听
    container.addEventListener('scroll', handleScroll);

    // 同时监听window滚动，同步到容器
    window.addEventListener('scroll', handleWindowScroll);

    // 清理事件监听
    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [loadingMore, pagination.hasMore, pagination.page]);

  // 处理分类点击
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  // 处理创建新Agent的点击
  const handleCreateClick = () => {
    navigate('/config');
  };

  // 设置高亮（场景：比如复制之后，当前页面刷新了，为了让用户能看到复制出来的agent/template，将其设置为高亮显示）
  const changeHighlightId = (id: string) => {
    setHighlightId(id);

    // 2秒后 高亮消失
    setTimeout(() => {
      setHighlightId('');
    }, 2000);
  };

  // 处理菜单点击
  const handleMenuClick = async ({ key }: { key: string }, agent: Agent) => {
    switch (key) {
      case AgentActionEnum.Copy:
        // 复制agent
        try {
          const { id } = await copyAgent(agent.id);
          message.success(intl.get('dataAgent.operationSuccess'));

          if (mode === ModeEnum.MyAgent) {
            // 我的创建页面，需要刷新列表
            await reload();
            // 高亮生成的agent
            changeHighlightId(id);
          }
        } catch (ex: any) {
          if (ex?.description) {
            message.error(ex.description);
          }
        }
        break;

      case AgentActionEnum.ViewAPI:
        // 查看API
        microWidgetProps?.history.navigateToMicroWidget({
          name: 'agent-web-dataagent',
          path: `/api-doc?id=${agent?.id}&name=${encodeURIComponent(agent?.name)}&version=${agent?.version}&hidesidebar=true&hideHeaderPath=true`,
          isNewTab: true,
        });
        return;

      case AgentActionEnum.RemoveAgent:
        // 移除Agent（自定义空间）:
        try {
          await deleteSpaceResourceByResourceId({
            id: customSpaceId!,
            resource_type: SpaceResourceEnum.DataAgent,
            resource_id: agent.id,
          });
          message.success(intl.get('dataAgent.operationSuccess'));
          reload();
        } catch (ex: any) {
          if (ex?.description) {
            message.error(ex.description);
          }
        }

        break;

      case AgentActionEnum.Use:
        // 去使用
        navigateToAgentUsage(agent);
        break;

      case AgentActionEnum.ConfigInfo:
        // 跳转到配置信息详情页面
        // navigate(`/detail/${agent.id}`);
        microWidgetProps?.history.navigateToMicroWidget({
          name: 'agent-web-myagents',
          path: `/detail/${agent.id}?hidesidebar=true&hideHeaderPath=true`,
          isNewTab: true,
        });
        break;

      case TemplateActionEnum.TemplateConfig:
        // 跳转到配置信息详情页面
        microWidgetProps?.history.navigateToMicroWidget({
          name: mode === ModeEnum.MyTemplate ? 'agent-web-myagents' : 'agent-web-agenttemplate',
          path: `/template-detail/${agent.tpl_id ?? agent.id}?hidesidebar=true&hideHeaderPath=true`,
          isNewTab: true,
        });
        break;

      case AgentActionEnum.Publish:
        // 打开发布设置弹窗
        setSelectedAgent(agent);
        publishModeRef.current = PublishModeEnum.PublishAgent;
        setPublishModalVisible(true);
        break;

      case AgentActionEnum.UpdatePublishInfo:
        // 更新发布信息
        setSelectedAgent(agent);
        publishModeRef.current = PublishModeEnum.UpdatePublishAgent;
        setPublishModalVisible(true);
        break;

      case AgentActionEnum.Unpublish:
        // 取消发布Agent确认
        modal.confirm({
          title: intl.get('dataAgent.confirmCancelPublish'),
          content: intl.get('dataAgent.confirmUnpublishAgent'),
          centered: true,
          okButtonProps: { className: 'dip-min-width-72' },
          cancelButtonProps: { className: 'dip-min-width-72' },
          onOk() {
            const hide = message.loading(intl.get('dataAgent.cancelPublishing'), 0);
            unpublishAgent(agent.id)
              .then(() => {
                hide();
                message.success(intl.get('dataAgent.operationSuccess'));

                // 刷新分类数据
                setCategoryAgents(pre =>
                  pre.map(item =>
                    item.id === agent.id
                      ? {
                          ...item,
                          status: 'unpublished',
                          // 取消发布成功后，需要重置publish_info
                          publish_info: { is_api_agent: 0, is_web_sdk_agent: 0, is_skill_agent: 0 },
                          published_at: 0,
                        }
                      : item
                  )
                );
              })
              .catch((ex: any) => {
                hide();
                if (ex?.description) {
                  message.error(ex.description);
                }
              });
          },
          onCancel() {},
          footer: (_, { OkBtn, CancelBtn }) => (
            <div className="dip-flex-content-end">
              <OkBtn />
              <CancelBtn />
            </div>
          ),
        });
        break;

      case AgentActionEnum.PublishAsTemplate:
        // 将agent发布为模板
        setSelectedAgent(agent);
        publishModeRef.current = PublishModeEnum.PublishAgentAsTemplate;
        setPublishModalVisible(true);
        break;

      case AgentActionEnum.Delete:
        // 检查是否已发布
        if (agent.status === 'published') {
          // 如果已发布，提示需要先取消发布
          modal.warning({
            title: intl.get('dataAgent.cannotDelete'),
            content: intl.get('dataAgent.cannotDeleteWithPublished', { name: agent.name }),
            okText: intl.get('dataAgent.gotIt'),
            centered: true,
          });
          return;
        }

        // 删除Agent确认
        modal.confirm({
          title: intl.get('dataAgent.confirmDelete'),
          content: intl.get('dataAgent.confirmDeleteAgent', { name: agent.name }),
          centered: true,
          okButtonProps: { className: 'dip-min-width-72' },
          cancelButtonProps: { className: 'dip-min-width-72' },
          onOk() {
            const hide = message.loading(intl.get('dataAgent.deleting'), 0);
            deleteAgent(agent.id)
              .then(async () => {
                hide();
                message.success(intl.get('dataAgent.operationSuccess'));

                // 重新获取分类数据，根据总条数重置分页
                try {
                  nextPaginationMarkerStrRef.current = '';
                  const { entries, nextPaginationMarkerStr, is_last_page } = await fetchData({
                    pagination_marker_str: nextPaginationMarkerStrRef.current,
                    mode,
                    category_id: selectedCategory.category_id,
                    size: pagination.size,
                    name: '',
                    custom_space_id: customSpaceId,
                    publish_status: publishStatusFilterRef.current,
                    publish_to_be:
                      publishStatusFilterRef.current === PublishStatusEnum.Published
                        ? publishCategoryFilterRef.current
                        : AgentPublishToBeEnum.All,
                  });
                  nextPaginationMarkerStrRef.current = nextPaginationMarkerStr;

                  setCategoryAgents(entries);

                  // 更新分页信息
                  setPagination(prev => ({
                    ...prev,
                    page: 1,
                    hasMore: !is_last_page,
                  }));
                } catch (ex: any) {
                  if (ex?.description) {
                    message.error(ex.description);
                  }
                  setCategoryError('获取数据时发生错误');
                }

                // 如果删除的Agent在最近访问列表中，也更新最近访问列表
                if (recentAgents.some(recent => recent.id === agent.id)) {
                  fetchRecentAgents();
                }
              })
              .catch((ex: any) => {
                hide();
                if (ex?.description) {
                  message.error(ex.description);
                }
              });
          },
          onCancel() {},
          footer: (_, { OkBtn, CancelBtn }) => (
            <div className="dip-flex-content-end">
              <OkBtn />
              <CancelBtn />
            </div>
          ),
        });
        break;

      case TemplateActionEnum.CreateAgentFromTemplate:
        // 使用此模板创建Agent
        navigate(`/config?templateId=${agent.tpl_id}&mode=createAgent`);
        break;

      case TemplateActionEnum.CopyTemplate:
        // 复制模板
        try {
          const { id } = await copyTemplate(agent.id);
          message.success(intl.get('dataAgent.operationSuccess'));

          // 我的模板页面，需要刷新列表
          await reload();
          // 高亮生成的模板
          changeHighlightId(id);
        } catch (ex: any) {
          if (ex?.description) {
            message.error(ex.description);
          }
        }
        break;

      case TemplateActionEnum.PublishTemplate:
        // 发布模板
        setSelectedAgent(agent);
        publishModeRef.current = PublishModeEnum.PublishTemplate;
        setPublishModalVisible(true);
        break;

      case TemplateActionEnum.UnpublishTemplate:
        // 取消发布模板
        modal.confirm({
          title: intl.get('dataAgent.confirmCancelPublish'),
          content: intl.get('dataAgent.cancelPublishTemplateWarning'),
          centered: true,
          okButtonProps: { className: 'dip-min-width-72' },
          cancelButtonProps: { className: 'dip-min-width-72' },
          onOk() {
            const hide = message.loading(intl.get('dataAgent.cancelPublishing'), 0);
            unpublishTemplate(agent.id)
              .then(() => {
                hide();
                message.success(intl.get('dataAgent.operationSuccess'));

                // 刷新分类数据
                setCategoryAgents(pre =>
                  pre.map(item => (item.id === agent.id ? { ...item, status: 'unpublished', published_at: 0 } : item))
                );
              })
              .catch((ex: any) => {
                hide();
                if (ex?.description) {
                  message.error(ex.description);
                }
              });
          },
          onCancel() {},
          footer: (_, { OkBtn, CancelBtn }) => (
            <div className="dip-flex-content-end">
              <OkBtn />
              <CancelBtn />
            </div>
          ),
        });
        break;

      case TemplateActionEnum.DeleteTemplate:
        // 删除模板
        // 检查是否已发布
        if (agent.status === 'published') {
          // 如果已发布，提示需要先取消发布
          modal.warning({
            title: intl.get('dataAgent.cannotDelete'),
            content: intl.get('dataAgent.cannotDeleteWithPublished', { name: agent.name }),
            okText: intl.get('dataAgent.gotIt'),
            centered: true,
          });
          return;
        }

        // 删除确认
        modal.confirm({
          title: intl.get('dataAgent.confirmDelete'),
          content: intl.get('dataAgent.confirmDeleteAgent', { name: agent.name }),
          centered: true,
          okButtonProps: { className: 'dip-min-width-72' },
          cancelButtonProps: { className: 'dip-min-width-72' },
          onOk() {
            const hide = message.loading(intl.get('dataAgent.deleting'), 0);
            deleteTemplate(agent.id)
              .then(async () => {
                hide();
                message.success(intl.get('dataAgent.operationSuccess'));

                try {
                  nextPaginationMarkerStrRef.current = '';
                  const { entries, nextPaginationMarkerStr, is_last_page } = await fetchData({
                    pagination_marker_str: nextPaginationMarkerStrRef.current,
                    mode,
                    category_id: selectedCategory.category_id,
                    size: pagination.size,
                    name: '',
                    custom_space_id: customSpaceId,
                    publish_status: publishStatusFilterRef.current,
                    publish_to_be:
                      publishStatusFilterRef.current === PublishStatusEnum.Published
                        ? publishCategoryFilterRef.current
                        : AgentPublishToBeEnum.All,
                  });
                  nextPaginationMarkerStrRef.current = nextPaginationMarkerStr;

                  setCategoryAgents(entries);

                  // 更新分页信息
                  setPagination(prev => ({
                    ...prev,
                    page: 1,
                    hasMore: !is_last_page,
                  }));
                } catch (ex: any) {
                  if (ex?.description) {
                    message.error(ex.description);
                  }
                  setCategoryError('获取数据时发生错误');
                }

                // 如果删除的Agent在最近访问列表中，也更新最近访问列表
                if (recentAgents.some(recent => recent.id === agent.id)) {
                  fetchRecentAgents();
                }
              })
              .catch((ex: any) => {
                hide();
                if (ex?.description) {
                  message.error(ex.description);
                }
              });
          },
          onCancel() {},
          footer: (_, { OkBtn, CancelBtn }) => (
            <div className="dip-flex-content-end">
              <OkBtn />
              <CancelBtn />
            </div>
          ),
        });
        break;

      default:
        break;
    }
  };

  // 处理发布确认
  const handlePublishSubmit = ({
    publish_to_bes,
    published_at,
  }: {
    publish_to_bes?: AgentPublishToBeEnum[];
    published_at?: number;
  }) => {
    // 清理状态
    setSelectedAgent(null);
    setPublishModalVisible(false);

    // 将agent发布为模板，无需更新当前列表
    if (publishModeRef.current === PublishModeEnum.PublishAgentAsTemplate) return;

    // 刷新分类数据
    setCategoryAgents(pre =>
      pre.map(item =>
        item.id === selectedAgent!.id
          ? {
              ...item,
              status: 'published',
              ...(publish_to_bes
                ? {
                    // 发布成功后，更新publish_info
                    publish_info: {
                      is_api_agent: publish_to_bes.includes(AgentPublishToBeEnum.ApiAgent) ? 1 : 0,
                      is_sdk_agent: publish_to_bes.includes(AgentPublishToBeEnum.WebSDKAgent) ? 1 : 0,
                      is_skill_agent: publish_to_bes.includes(AgentPublishToBeEnum.SkillAgent) ? 1 : 0,
                    },
                  }
                : {}),
              ...(published_at
                ? {
                    published_at,
                  }
                : {}),
            }
          : item
      )
    );
  };

  // 关闭发布设置弹窗
  const handlePublishCancel = () => {
    setPublishModalVisible(false);
    setSelectedAgent(null);
  };

  // 获取数据处理状态
  const fetchProcessingStatuses = async (agents: Agent[]) => {
    if (!agents || agents.length === 0) return;

    try {
      // 最多只取当前分页大小的数量，与懒加载保持一致
      const agentsToCheck = agents.slice(0, pagination.size);
      const agentFlags = agentsToCheck.map(agent => ({
        agent_id: agent.id,
        agent_version: 'v0',
      }));

      const response = await getBatchDataProcessingStatus({
        agent_uniq_flags: agentFlags,
        is_show_fail_infos: true,
      });

      if (response && response.entries) {
        const newStatuses: { [key: string]: number } = {};
        response.entries.forEach(entry => {
          newStatuses[entry.agent_id] = entry.progress;
        });
        setProcessingStatuses(prev => ({ ...prev, ...newStatuses }));

        // 检查是否所有项都是100%，如果是则停止轮询
        const allCompleted = response.entries.every(entry => entry.progress === 100 || entry.progress === -1);
        if (allCompleted && processingStatusTimer.current) {
          stopPollingProcessingStatuses();
        }
      }
    } catch (error) {
      console.error('Failed to fetch processing statuses:', error);
    }
  };

  // 开始轮询处理状态
  const startPollingProcessingStatuses = () => {
    // 先清除可能存在的定时器
    if (processingStatusTimer.current) {
      clearInterval(processingStatusTimer.current);
    }

    // 立即获取一次
    if (categoryAgents.length > 0) {
      fetchProcessingStatuses(categoryAgents);
    }

    // 设置定时器，每10秒轮询一次
    processingStatusTimer.current = setInterval(() => {
      if (categoryAgents.length > 0) {
        fetchProcessingStatuses(categoryAgents);
      }
    }, 10000);
  };

  // 停止轮询
  const stopPollingProcessingStatuses = () => {
    if (processingStatusTimer.current) {
      clearInterval(processingStatusTimer.current);
      processingStatusTimer.current = null;
    }
  };

  // 点击agent
  const handleClickAgent = useCallback(
    (agent: any) => {
      switch (mode) {
        case ModeEnum.MyTemplate:
          // 跳转到编辑模板页面
          navigate(`/config?templateId=${agent.id}&mode=editTemplate`);
          break;

        case ModeEnum.MyAgent:
          // 跳转到编辑agent页面
          navigateToAgentEditConfig(agent);
          break;

        case ModeEnum.CustomSpace:
        case ModeEnum.DataAgent:
          // 跳转到agent使用页面
          navigateToAgentUsage(agent);
          break;

        default:
          break;
      }
    },
    [mode, navigate, navigateToAgentEditConfig, navigateToAgentUsage]
  );

  // 获取卡片处理状态标签
  const getCardProcessingStatus = useCallback(
    (agentId: string) => {
      if (mode !== ModeEnum.MyAgent) return null;
      if (processingStatuses[agentId] === undefined) return null;

      const progress = processingStatuses[agentId];
      const isProcessing = progress >= 0 && progress < 100;

      const getProcessingStatus = () => {
        if (progress === 100) {
          return intl.get('dataAgent.dataProcessComplete');
        } else if (progress === -1) {
          return intl.get('dataAgent.dataProcessFailed');
        } else if (isProcessing) {
          return intl.get('dataAgent.dataProcessing');
        }
        return null;
      };

      const status = getProcessingStatus();
      const isError = progress === -1;

      if (status) {
        return (
          <div
            className={classNames(styles.processingStatus, 'dip-ellipsis', 'dip-border-radius-2', {
              [styles['processingStatusError']]: isError,
            })}
          >
            {(isProcessing || isError) && (
              <Tooltip title={status}>
                <SyncOutlined spin={isProcessing} />
              </Tooltip>
            )}
          </div>
        );
      }

      return null;
    },
    [processingStatuses, mode]
  );

  // 获取卡片的发布文字：我的创建页面，始终显示发布状态；其它页面，只显示未发布状态
  const getCardPublishStatus = useCallback(
    (agentStatus: string) => {
      return agentStatus === 'unpublished' ? (
        <span className={styles['unpublished']}>{intl.get('dataAgent.unpublished')}</span>
      ) : [ModeEnum.MyAgent, ModeEnum.MyTemplate].includes(mode) ? (
        <span className={styles['published']}>{intl.get('dataAgent.published')}</span>
      ) : undefined;
    },
    [mode]
  );

  const getCardIcon = useCallback(
    (agent: any) => (
      <AgentIcon
        size={48}
        fontSize="14px"
        avatar_type={agent?.avatar_type}
        avatar={agent?.avatar}
        name={agent?.name}
        style={{ minWidth: '48px' }}
        showBuildInLogo={agent?.is_built_in === 1}
        showSystemLogo={agent?.is_system_agent === 1}
      />
    ),
    []
  );

  // 在获取分类数据后开始轮询处理状态
  useEffect(() => {
    // 只有我的agent，才需要查询处理状态
    if (mode !== ModeEnum.MyAgent) return;

    if (categoryAgents.length > 0) {
      startPollingProcessingStatuses();
    }

    return () => {
      stopPollingProcessingStatuses();
    };
  }, [mode, categoryAgents]);

  // Function to render Agent cards
  const renderAgentCard = (agent: Agent, width: number) => {
    const time =
      agent.status === 'unpublished'
        ? intl.get('dataAgent.updateTime') + formatTimeSlash(agent.updated_at)
        : intl.get('dataAgent.publishTime') + formatTimeSlash(agent.published_at);

    const userInfo = getUserInfo(agent);
    const menuItems = getMenuItems({ mode, agent, perms, customSpaceInfo, currentUserId });

    const isMine = [ModeEnum.MyAgent, ModeEnum.MyTemplate].includes(mode);
    const showUserInfo = !isMine;

    return (
      <Col key={agent.id} className={styles.agentCardCol} style={{ width, minWidth: width }}>
        <BaseCard
          checkable={isExportMode}
          checked={selectedIdsForExport.includes(agent.id)}
          checkboxDisabled={isExportMode && agent?.is_built_in === 1}
          onCheckedChange={toggleExportSelection}
          bordered={false}
          // 全部模板页面，卡片不可点击，故样式设为cursor: default
          className={mode === ModeEnum.AllTemplate ? 'dip-default' : ''}
          hoverable
          isHighlighted={highlightId === agent.id}
          item={agent}
          time={time}
          name={agent.name}
          getNameSuffixIcon={getCardProcessingStatus}
          getNameSuffixStatus={getCardPublishStatus}
          profile={agent.profile}
          getIcon={getCardIcon}
          userAvatar={showUserInfo ? userAvatars[userInfo.user_id] : undefined}
          userName={showUserInfo ? userInfo?.username : undefined}
          menuItems={isExportMode ? [] : menuItems}
          onClickMenu={isExportMode ? undefined : handleMenuClick}
          onClick={isExportMode ? undefined : handleClickAgent}
        />
      </Col>
    );
  };

  // 渲染Category代理列表
  const renderCategoryAgents = () => {
    if (categoryAgents.length === 0) {
      // 内容为空的提示语：
      // 1. 搜索时：搜索结果为空
      // 2. 选中分类，或者 筛选：暂无数据
      // 3. 我的创建：暂无创建
      // 4. 我的模板 或者 全部模板：暂无模板
      // 5. 广场：当前没有可用的 Data Agent \n 立即新建一个，开启您的智能体验。
      const emptyText = searchName ? (
        intl.get('dataAgent.searchResultIsEmpty')
      ) : selectedCategory?.category_id ||
        publishStatusFilter !== PublishStatusEnum.All ||
        publishCategoryFilter !== AgentPublishToBeEnum.All ? (
        intl.get('dataAgent.noData')
      ) : mode === ModeEnum.MyAgent ? (
        <div>
          {intl.get('dataAgent.notYetCreated')}
          <div className="dip-text-blue-link dip-mt-6" onClick={handleCreateClick}>
            {intl.get('dataAgent.createNewAgent')}
          </div>
        </div>
      ) : [ModeEnum.MyTemplate, ModeEnum.AllTemplate].includes(mode) ? (
        intl.get('dataAgent.noTemplate')
      ) : mode === ModeEnum.DataAgent ? (
        <div>{intl.get('dataAgent.noAvailableAgentsCurrently')}</div>
      ) : (
        intl.get('dataAgent.noData')
      );

      return (
        <div className={styles.emptyStateContainer}>
          <Empty image={empty} description={emptyText} />
        </div>
      );
    }

    return (
      <>
        <Row gutter={[gap, gap]}>{categoryAgents.map(agent => renderAgentCard(agent, cardWidth))}</Row>
        {loadingMore && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <Spin size="small" />
            <span style={{ marginLeft: '8px' }}>{intl.get('dataAgent.loading')}</span>
          </div>
        )}
      </>
    );
  };

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchName(value);

    // 直接触发搜索
    // 重置分页状态
    nextPaginationMarkerStrRef.current = '';
    setPagination(prev => ({
      ...prev,
      page: 1,
      hasMore: true,
    }));
    // 使用防抖处理，减少频繁请求
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      // 使用最新的搜索值直接调用API，而不是使用state中的searchName
      fetchCategoryAgents(1, false, value);
    }, 300);
  };

  // 处理搜索输入框按下回车
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      // 使用当前输入框中的值进行搜索
      fetchCategoryAgents(1, false, searchName);
    }
  };

  const reload = async (serachKey: string = searchName) => {
    // 重置分页状态
    nextPaginationMarkerStrRef.current = '';
    setPagination(prev => ({
      ...prev,
      page: 1,
      hasMore: true,
    }));
    // 重新获取数据
    await fetchCategoryAgents(1, false, serachKey);
  };

  // 处理刷新按钮点击
  const handleRefresh = () => {
    setIsRefreshing(true);
    reload();
  };

  // 切换选中状态
  const toggleExportSelection = useCallback((_, agent: any) => {
    setSelectedIdsForExport(prev => {
      if (prev.includes(agent.id)) {
        return prev.filter(item => item !== agent.id);
      }

      if (prev.length === 500) {
        message.info(intl.get('dataAgent.maximumSelectionReached'));

        return prev;
      }

      return [...prev, agent.id];
    });
  }, []);

  // 导出agent
  const handleExportAgent = async () => {
    try {
      const { data, headers } = await exportAgent(selectedIdsForExport);
      const fileName = getFilenameFromContentDisposition(headers['content-disposition']);

      downloadFile(data, fileName, { type: headers['content-type'] });
      message.success(intl.get('dataAgent.exportSuccess'));
      setIsExportMode(false);
      setSelectedIdsForExport([]);
    } catch (ex: any) {
      if (ex.description) {
        message.error(ex.description);
      }
    }
  };

  const updateScrollPosition = (newPosition: number) => {
    if (!scrollableRef.current || !containerWidth || !contentWidth) return;

    scrollPositionRef.current = newPosition;
    scrollableRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;

    setShowScrollArrows({
      left: scrollPositionRef.current > 0,
      right: scrollPositionRef.current < contentWidth - containerWidth,
    });
  };

  // 点击分类的左箭头，向左滑动
  const scrollLeft = () => {
    const newPosition = Math.max(scrollPositionRef.current - containerWidth, 0);
    updateScrollPosition(newPosition);
  };

  // 点击分类的右箭头，向右滑动
  const scrollRight = () => {
    const newPosition = Math.min(scrollPositionRef.current + containerWidth, contentWidth - containerWidth);
    updateScrollPosition(newPosition);
  };

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === ModeEnum.CustomSpace && customSpaceId) {
      // 获取当前的自定义空间名称
      getSpaceInfo(customSpaceId).then(
        info => {
          setCustomSpaceInfo(info);
        },
        (ex: any) => {
          if (ex?.description) {
            message.error(ex.description);
          }
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchPerms = async () => {
      let perms;
      try {
        // 获取权限
        perms = await getAgentManagementPerm();
        setPerms(perms);
      } catch (ex: any) {
        if (ex?.description) {
          message.error(ex.description);
        }
      }

      if (mode === ModeEnum.MyAgent) {
        // 有模板发布权限，或者我的模板有数据，则显示MyCreatedTab
        if (perms?.agent_tpl.publish) {
          setShowMyCreatedTab(true);
        } else {
          try {
            // 这里仅仅是为了判断是否要显示我的模板 才调用接口获取我的模板内容
            const { entries } = await getMyTemplateList({ size: 1 });
            if (entries?.length) {
              setShowMyCreatedTab(true);
            }
          } catch {}
        }
      }
    };

    fetchPerms();
  }, []);

  useEffect(() => {
    // 第一次加载，无需reload；后面每次切换mode，需要reload（清空筛选项、清空搜索值）
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setSearchName('');
    setPublishStatusFilter(PublishStatusEnum.All);
    publishStatusFilterRef.current = PublishStatusEnum.All;
    setPublishCategoryFilter(AgentPublishToBeEnum.All);
    publishCategoryFilterRef.current = AgentPublishToBeEnum.All;
    reload('');
  }, [mode]);

  useEffect(() => {
    if (containerWidth && contentWidth && scrollableRef.current) {
      const canScroll = contentWidth > containerWidth;
      setShowScrollArrows({ left: false, right: canScroll });

      if (scrollPositionRef.current > contentWidth - containerWidth) {
        scrollPositionRef.current = contentWidth - containerWidth;
        scrollableRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`;
      }
    } else {
      setShowScrollArrows({ left: false, right: false });
    }
  }, [containerWidth, contentWidth]);

  return (
    <GradientContainer className={classNames(styles.listPageContainer, 'dip-flex-column')}>
      <Header mode={mode} isExportMode={isExportMode} onCreate={handleCreateClick} />
      <div ref={listContainerRef} className={classNames(styles.hideScrollbar, 'dip-flex-1')}>
        <AutoSizer
          style={{ width: '100%', height: '100%' }}
          className="dip-flex-column"
          onResize={({ width }) => {
            const count = computeColumnCount(width);
            setCardWidth(width / count);
          }}
        >
          {({ width }) => (
            <>
              {/* 最近访问 */}
              {showRecent && Boolean(recentLoading || recentError || recentAgents?.length) && (
                <section className={styles.recentAgents}>
                  <div className={classNames(styles.sectionTitle, 'dip-mb-16')}>
                    {intl.get('dataAgent.recentVisits')}
                  </div>
                  {recentLoading ? (
                    <SkeletonGrid width={width} cardWidth={cardWidth} avatarShape="square" />
                  ) : recentError ? (
                    <LoadFailed
                      className={classNames(styles.emptyStateContainer, `dip-m-0 dip-p-0 dip-mr-${gap}`)}
                      onRetry={retryRecentAgents}
                    />
                  ) : (
                    <div className={styles.recentAgentsContainer} ref={recentAgentsContainerRef}>
                      {showLeftArrow && (
                        <Button
                          className={`${styles.navArrow} ${styles.leftArrow}`}
                          icon={<LeftOutlined />}
                          onClick={() => handleScroll('left')}
                        />
                      )}
                      <div className={classNames(styles.recentAgentsRow, `dip-mr-${gap}`)} ref={recentAgentsRowRef}>
                        {recentAgents.map(agent => renderAgentCard(agent, cardWidth - gap))}
                      </div>
                      {showRightArrow && (
                        <Button
                          className={`${styles.navArrow} ${styles.rightArrow}`}
                          icon={<RightOutlined />}
                          onClick={() => handleScroll('right')}
                        />
                      )}
                    </div>
                  )}
                </section>
              )}

              <section className={styles.allAgents}>
                <div className={styles.categoryContainer}>
                  <div className={classNames(styles.categoryHeader, `dip-mr-${gap}`)}>
                    {[ModeEnum.MyAgent, ModeEnum.MyTemplate].includes(mode) ? (
                      <div className={classNames('dip-font-16 dip-c-black dip-font-weight-700')}>
                        {showMyCreatedTab ? (
                          <MyCreatedTab
                            activeKey={mode}
                            onChange={(mode: any) => {
                              // 切换 我的agent、我的模板，设置加载状态 & 清空agent列表，可避免调用index-check接口
                              setCategoryLoading(true);
                              setCategoryAgents([]);
                              setMode(mode);
                              // 切换tab时，退出导出模式
                              setIsExportMode(false);
                              setSelectedIdsForExport([]);
                            }}
                          />
                        ) : (
                          <div style={{ fontWeight: 400 }}>{intl.get('dataAgent.all')}</div>
                        )}
                      </div>
                    ) : (
                      <div className={classNames(styles.sectionTitle, 'dip-mb-16')}>
                        {showCategory ? intl.get('dataAgent.browseByCategory') : ''}
                      </div>
                    )}

                    <div className={styles.searchWrapper}>
                      {[ModeEnum.MyAgent, ModeEnum.MyTemplate].includes(mode) && (
                        <>
                          <span>
                            <span className="dip-mr-6">{intl.get('dataAgent.status')}</span>
                            <Select
                              style={{ width: 100 }}
                              options={[
                                { label: intl.get('dataAgent.all'), value: PublishStatusEnum.All },
                                { label: intl.get('dataAgent.published'), value: PublishStatusEnum.Published },
                                { label: intl.get('dataAgent.unpublished'), value: PublishStatusEnum.Draft },
                              ]}
                              value={publishStatusFilter}
                              onChange={value => {
                                publishStatusFilterRef.current = value;
                                setPublishStatusFilter(value);
                                reload();
                              }}
                            />
                          </span>
                          {/* 只有我的创建页面有 发布类型过滤项 */}
                          {mode === ModeEnum.MyAgent && (
                            <span>
                              <span className="dip-mr-6">{intl.get('dataAgent.config.type')}</span>
                              <Select
                                style={{ width: 120 }}
                                options={[
                                  { label: intl.get('dataAgent.all'), value: AgentPublishToBeEnum.All },
                                  { label: 'API', value: AgentPublishToBeEnum.ApiAgent },
                                  { label: intl.get('dataAgent.config.skill'), value: AgentPublishToBeEnum.SkillAgent },
                                ]}
                                value={publishCategoryFilter}
                                onChange={value => {
                                  publishCategoryFilterRef.current = value;
                                  setPublishCategoryFilter(value);
                                  reload();
                                }}
                              />
                            </span>
                          )}
                        </>
                      )}
                      {!showCategory && (
                        <div className="dip-flex dip-gap-8 dip-position-r">
                          <Input
                            placeholder={searchPlaceholder}
                            value={searchName}
                            onChange={handleSearchChange}
                            onKeyPress={handleSearchKeyPress}
                            className={styles.searchInput}
                            prefix={<SearchOutlined className="dip-opacity-75" />}
                            allowClear
                          />
                          <div>
                            {mode === ModeEnum.MyAgent && (
                              <>
                                <Tooltip title={intl.get('dataAgent.import')}>
                                  <Button
                                    icon={<ImportIcon />}
                                    className={classNames(styles['icon-btn'], {
                                      [styles['icon-btn-disabled']]: isExportMode,
                                    })}
                                    disabled={isExportMode}
                                    onClick={() => handleImportAgent(modal, reload)}
                                  />
                                </Tooltip>
                                {isExportMode ? (
                                  <Button
                                    onClick={() => {
                                      setIsExportMode(false);
                                      setSelectedIdsForExport([]);
                                    }}
                                  >
                                    {intl.get('dataAgent.cancelExport')}
                                  </Button>
                                ) : (
                                  <Tooltip title={intl.get('dataAgent.exportWithBuiltInAgentRestriction')}>
                                    <Button
                                      icon={<ExportIcon />}
                                      className={styles['icon-btn']}
                                      onClick={() => {
                                        setIsExportMode(true);
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </>
                            )}
                            <Tooltip title={intl.get('dataAgent.reloadData')}>
                              <Button
                                icon={<ReloadOutlined spin={isRefreshing} />}
                                className={classNames(styles['icon-btn'], {
                                  [styles['icon-btn-disabled']]: isExportMode,
                                })}
                                disabled={isExportMode}
                                onClick={handleRefresh}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 自定义空间-agent列表页面，添加agent(只有空间的创建者才可以) */}
                    {mode === ModeEnum.CustomSpace &&
                      Boolean(customSpaceId) &&
                      currentUserId === customSpaceInfo?.created_by && (
                        <SpaceAgentAddButton
                          customSpaceId={customSpaceId!}
                          onAddSuccess={() => {
                            reload();
                          }}
                        />
                      )}
                  </div>
                  {showCategory && (
                    <div className={classNames(styles.categoriesWrapper, `dip-mr-${gap} dip-w-100 dip-gap-10`)}>
                      <div
                        className={classNames(
                          styles.categories,
                          'dip-flex-item-full-width dip-1-line dip-position-r dip-overflow-hidden'
                        )}
                        ref={containerRef}
                      >
                        <div ref={scrollableRef} style={{ width: 'fit-content' }}>
                          <Button
                            type={selectedCategory.category_id === '' ? 'primary' : 'default'}
                            className={styles.categoryTag}
                            onClick={() => handleCategoryClick({ category_id: '', name: '全部' })}
                          >
                            {intl.get('dataAgent.all')}
                          </Button>
                          {categories.map((category, index) => (
                            <Button
                              key={category.category_id}
                              type={selectedCategory.category_id === category.category_id ? 'primary' : 'default'}
                              className={styles.categoryTag}
                              style={index === categories.length - 1 ? { marginRight: 0 } : {}}
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category.name}
                            </Button>
                          ))}
                        </div>
                        {showScrollArrows.left && (
                          <div className={classNames(styles['arrow-icon-wrapper'], styles['left-arrow-wrapper'])}>
                            <Button
                              className={classNames(styles['arrow-icon'])}
                              icon={<LeftOutlined className="dip-font-12" />}
                              onClick={scrollLeft}
                            />
                          </div>
                        )}
                        {showScrollArrows.right && (
                          <div className={classNames(styles['arrow-icon-wrapper'], styles['right-arrow-wrapper'])}>
                            <Button
                              className={classNames(styles['arrow-icon'])}
                              icon={<RightOutlined className="dip-font-12" />}
                              onClick={scrollRight}
                            />
                          </div>
                        )}
                      </div>
                      <div className="dip-flex" style={{ gap: 8 }}>
                        <Input
                          placeholder={searchPlaceholder}
                          value={searchName}
                          onChange={handleSearchChange}
                          onKeyPress={handleSearchKeyPress}
                          className={styles.searchInput}
                          prefix={<SearchOutlined className="dip-opacity-75" />}
                          allowClear
                        />
                        <Tooltip title={intl.get('dataAgent.reloadData')}>
                          <Button
                            icon={<ReloadOutlined spin={isRefreshing} />}
                            onClick={handleRefresh}
                            className={classNames(styles['icon-btn'])}
                          />
                        </Tooltip>
                        {mode === ModeEnum.MyAgent && (
                          <Button type="primary" onClick={handleCreateClick}>
                            <PlusIcon />
                            <span style={{ color: 'white' }}>{intl.get('dataAgent.createNew')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {isExportMode && (
                  <div
                    className={classNames(
                      'dip-flex-space-between dip-mr-16 dip-mb-16 dip-border-radius-8',
                      styles['export-header']
                    )}
                  >
                    <span>{intl.get('dataAgent.itemsSelected', { count: selectedIdsForExport.length })}</span>
                    <div>
                      <Button
                        type="link"
                        disabled={!selectedIdsForExport.length}
                        className="dip-p-0"
                        onClick={() => {
                          setSelectedIdsForExport([]);
                        }}
                      >
                        {intl.get('dataAgent.clearAll')}
                      </Button>
                      <Button
                        type="link"
                        disabled={!selectedIdsForExport.length}
                        className="dip-p-0 dip-ml-12"
                        onClick={handleExportAgent}
                      >
                        {intl.get('dataAgent.exportSelectedItems')}
                      </Button>
                    </div>
                  </div>
                )}
                {categoryLoading ? (
                  <SkeletonGrid width={width} cardWidth={cardWidth} avatarShape="square" />
                ) : categoryError ? (
                  <LoadFailed className={styles.emptyStateContainer} onRetry={retryCategoryAgents} />
                ) : (
                  renderCategoryAgents()
                )}
              </section>

              {/* 发布设置弹窗 */}
              {publishModalVisible && (
                <PublishSettingsModal
                  onCancel={handlePublishCancel}
                  onOk={handlePublishSubmit}
                  agent={selectedAgent}
                  mode={publishModeRef.current}
                />
              )}

              {contextHolder}
            </>
          )}
        </AutoSizer>
      </div>
    </GradientContainer>
  );
};

export default DataAgents;
