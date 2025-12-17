import React, { useEffect, useRef, useState } from 'react';
import styles from './index.module.less';
import classNames from 'classnames';
import Markdown from '@/components/Markdown';
import { Badge, Button, Modal, Skeleton, Tooltip } from 'antd';
import MarkdownEditorModal from './MarkdownEditorModal';
import {
  PlanItemDocSearchProcessType,
  PlanItemGraphSearchProcessType,
  PlanItemNetSearchProcessType,
  PlanItemProcessType,
  PlanItemType,
} from '@/components/DipChat/Chat/BubbleList/PlanPanel';
import DipIcon from '@/components/DipIcon';
import { planTypes } from '@/components/DipChat/enum';
import ScrollBarContainer from '@/components/ScrollBarContainer';
import ResizeObserver from '@/components/ResizeObserver';
import ShinyText from '@/components/animation/ShinyText';
import { useDipChatStore } from '@/components/DipChat/store';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { DipChatItem } from '@/components/DipChat/interface';
import DipButton from '@/components/DipButton';
import { useDeepCompareMemo } from '@/hooks';
import { useLatestState } from '@/hooks';
import { FileTypeIcon } from '@/utils/doc';
import NoSearchResult from '@/components/NoSearchResult';
import DownTimer from '@/components/DipChat/components/DownTimer';

const ExploreItem = ({ planItem }: { planItem: PlanItemType }) => {
  const {
    dipChatStore: {
      chatList,
      activeChatItemIndex,
      executePlanItemIndex,
      streamGenerating,
      expandedExploreItemId,
      aiInputValue,
    },
    setDipChatStore,
    getDipChatStore,
    sendChat,
  } = useDipChatStore();
  const btnDisabled = aiInputValue.mode !== 'deep-search';
  const [modal, contextHolder] = Modal.useModal();
  const [tabKey, setTabKey, getTabKey] = useLatestState<'process' | 'result'>('process');
  const [modelProp, setModalProp] = useState({
    open: false,
  });
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<boolean>(true);
  const autoSwitchTab = useRef<boolean>(true);
  const searchType = planItem.searchType;
  const planList = _.get(chatList[activeChatItemIndex], ['content'], []);
  const finishedPlanList = planList.filter((item: any) => item.finished);

  useEffect(() => {
    if (autoSwitchTab.current && planItem.executeResult && getTabKey() === 'process') {
      setTabKey('result');
    }
  }, [planItem.executeResult]);

  useEffect(() => {
    if (planItem.loading) {
      autoScrollRef.current = true;
    }
  }, []);

  const total = useDeepCompareMemo(() => {
    let num: number = 0;
    planItem.processData.forEach((item: any) => {
      if (item.children && Array.isArray(item.children)) {
        num += item.children.length;
      }
    });
    return num;
  }, [planItem.processData]);

  const renderNetSearchProcessItem = (item: PlanItemNetSearchProcessType) => {
    return (
      <div key={item.title} className="dip-mb-24">
        <Badge status="processing" text={<span className="dip-font-weight-700">{item.title}</span>} />
        {/* <div className="dip-text-color">{item.title}</div>*/}
        <div className="dip-mt-12 dip-flex-column" style={{ gap: 12 }}>
          {item.children?.map(child => (
            <div className={styles.processChild} key={child.title}>
              <div className="dip-flex-align-center">
                <img className={styles.icon} src={child.icon} alt="" />
                <span
                  onClick={() => {
                    modal.confirm({
                      closable: true,
                      width: 424,
                      title: '您即将离开超级助手，跳转到其他网站',
                      content:
                        '超级助手不会对其他网站的内容及其真实性负责，请注意上网安全，保护好您的个人信息及财产安全。',
                      onOk: () => {
                        window.open(child.link);
                      },
                      okText: '继续访问',
                      footer: (_, { OkBtn, CancelBtn }) => (
                        <>
                          <OkBtn />
                          <CancelBtn />
                        </>
                      ),
                    });
                  }}
                  className={classNames(styles.link, 'dip-ml-8 dip-flex-item-full-width dip-ellipsis')}
                >
                  {child.title}
                </span>
              </div>
              <div className="dip-mt-8 dip-text-color-45 dip-ellipsis-2">{child.content}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocSearchProcessItem = (item: PlanItemDocSearchProcessType) => {
    return (
      <div key={item.doc_id} className={classNames(styles.processDocChild, 'dip-mb-24')}>
        <div
          onClick={() => {
            setDipChatStore({
              previewFile: {
                fileId: item.object_id,
                fileName: item.doc_name,
                fileExt: item.ext_type,
              },
            });
          }}
          className={classNames(styles.link, 'dip-flex-align-center')}
        >
          <FileTypeIcon extension={item.ext_type} fontSize={16} />
          <span className="dip-ellipsis dip-ml-8 dip-flex-item-full-width">{item.doc_name}</span>
        </div>
        <div className="dip-mt-8 dip-ellipsis-2 dip-text-color-45">{item.content}</div>
      </div>
    );
  };
  const renderGraphSearchProcessItem = (item: PlanItemGraphSearchProcessType) => {
    return (
      <div key={item.id}>
        <Badge status="processing" text={<span className="dip-font-weight-700">{item.kg_name}</span>} />
        <div className={classNames(styles.processGraphChild, 'dip-mb-24 dip-mt-12 dip-text-color-45')}>
          <div className="dip-ellipsis-3">{item.content}</div>
        </div>
      </div>
    );
  };

  const renderProcessItem = (item: PlanItemProcessType) => {
    if (planItem.searchType === 'net-search') {
      return renderNetSearchProcessItem(item as PlanItemNetSearchProcessType);
    }
    if (planItem.searchType === 'doc-search') {
      return renderDocSearchProcessItem(item as PlanItemDocSearchProcessType);
    }
    if (planItem.searchType === 'graph-search') {
      return renderGraphSearchProcessItem(item as PlanItemGraphSearchProcessType);
    }
  };

  const renderContent = () => {
    if (searchType === 'summary') {
      return <Markdown value={planItem.executeResult} readOnly />;
    }
    if (tabKey === 'process') {
      return planItem.processData?.length > 0 ? (
        planItem.processData.map(item => renderProcessItem(item))
      ) : (
        <div className="dip-position-center">
          <NoSearchResult style={{ transform: 'translateY(-50%)' }} />
        </div>
      );
    }
    if (tabKey === 'result') {
      return <Markdown value={planItem.executeResult} readOnly />;
    }
  };

  const getSkeletonLoading = () => {
    if (searchType === 'summary') {
      return !planItem.executeResult;
    }
    if (tabKey === 'process') {
      return planItem.processData.length === 0;
    }
    return !planItem.executeResult;
  };

  const confirmContinue = () => {
    const { chatList } = getDipChatStore();
    const chatItem = chatList[activeChatItemIndex];
    const planList: PlanItemType[] = chatItem.content;
    const unfinishedPlanIndex = planList.findIndex(item => !item.finished);
    let cloneChatList: DipChatItem[] = [];
    if (unfinishedPlanIndex === -1) {
      // 全部计划执行完成，最后一条计划的结果会作为最终报告 输出在聊天框中
      cloneChatList = _.cloneDeep(chatList);
      cloneChatList.push({
        key: nanoid(),
        role: 'plan-report',
        content: '',
        loading: true,
      });
    }
    const newInterrupt = _.cloneDeep(chatItem.interrupt)!;
    newInterrupt.tool_args.forEach(item => {
      if (item.key === 'value') {
        if (item.value[executePlanItemIndex]) {
          item.value[executePlanItemIndex].answer.answer = chatItem.content[executePlanItemIndex].executeResult;
        }
      }
    });
    const body: any = {
      query: chatList[activeChatItemIndex - 1].content,
      tool: newInterrupt,
      interrupted_assistant_message_id: chatItem.key,
    };
    if (unfinishedPlanIndex !== -1 && chatItem.confirm === false) {
      body.confirm_plan = false;
    }
    if (cloneChatList.length > 0) {
      sendChat({
        body,
        chatList: cloneChatList,
        activeChatItemIndex: cloneChatList.length - 2,
      });
    } else {
      sendChat({
        body,
      });
    }

    setDipChatStore({
      executePlanItemIndex: -1,
    });
  };

  const clearTimer = () => {
    const cloneChatList = _.cloneDeep(chatList);
    delete cloneChatList[activeChatItemIndex].content[executePlanItemIndex].deadline;
    setDipChatStore({
      chatList: cloneChatList,
    });
  };

  const renderBtn = () => {
    if (planItem.finished && executePlanItemIndex === finishedPlanList.length - 1 && !streamGenerating) {
      if (searchType === 'summary' || tabKey === 'result') {
        return (
          <span>
            <Button
              shape="round"
              onClick={() => {
                clearTimer();
                setModalProp(prevState => ({
                  ...prevState,
                  open: true,
                }));
              }}
              disabled={btnDisabled}
            >
              修改结果
            </Button>
            <Button disabled={btnDisabled} shape="round" className="dip-ml-8" type="primary" onClick={confirmContinue}>
              确认，继续
              {planItem.deadline && (
                <DownTimer
                  onFinish={() => {
                    clearTimer();
                    confirmContinue();
                  }}
                />
              )}
            </Button>
          </span>
        );
      }
    }
    return <span />;
  };

  const renderDataTotal = () => {
    const chatItem = chatList[activeChatItemIndex];
    if (planItem.loading && !chatItem.cancel) {
      let text: string = searchType === 'summary' ? '正在总结' : '正在搜索';
      if (total > 0) {
        text = `正在搜索${total}篇相关资料`;
      }
      return (
        <ShinyText
          loading={streamGenerating}
          className="dip-mt-16 dip-pl-24 dip-pr-24 dip-text-color dip-flex-align-center"
          text={text}
        />
      );
    }
    if (total > 0) {
      return (
        <div className="dip-mt-16 dip-pl-24 dip-pr-24 dip-text-color dip-flex-align-center">
          搜索到{total}篇相关资料
        </div>
      );
    }
  };

  return (
    <div
      className={classNames(styles.container, 'dip-flex-column dip-bg-white dip-border-radius-8 dip-full', {
        [styles.expanded]: expandedExploreItemId === planItem.id,
      })}
    >
      <div className="dip-flex-align-center dip-pl-24 dip-pr-24">
        <span className="dip-flex-item-full-width dip-flex-align-center">
          <span className="dip-mr-8">
            <DipIcon
              style={{ fontSize: 26 }}
              type={planItem.searchType ? planTypes[planItem.searchType]?.colorIcon : ''}
            />
          </span>
          <span
            title={planItem.text}
            className="dip-flex-item-full-width dip-ellipsis dip-font-16 dip-text-color dip-font-weight-700"
          >
            {planItem.text}
          </span>
        </span>
        <DipButton
          title={expandedExploreItemId === planItem.id ? '收起' : '展开'}
          type="text"
          className="dip-ml-8"
          onClick={() => {
            setDipChatStore({
              expandedExploreItemId: expandedExploreItemId === planItem.id ? '' : planItem.id,
            });
          }}
        >
          {expandedExploreItemId === planItem.id ? (
            <DipIcon className="dip-text-color-25" type="icon-dip-expand" />
          ) : (
            <DipIcon className="dip-text-color-25" type="icon-dip-expand" />
          )}
        </DipButton>
      </div>
      {renderDataTotal()}
      <div className="dip-mt-10 dip-flex-item-full-height dip-position-r">
        <ScrollBarContainer
          className="dip-full dip-pl-24 dip-pr-24"
          ref={scrollWrapperRef}
          onWheelCapture={() => {
            autoScrollRef.current = false;
          }}
          // suppressScrollY={!expanded}
        >
          <Skeleton active loading={getSkeletonLoading() && streamGenerating}>
            <ResizeObserver
              onResize={() => {
                if (autoScrollRef.current) {
                  scrollWrapperRef.current!.scrollTop = scrollWrapperRef.current!.scrollHeight;
                }
              }}
            >
              <div style={{ paddingBottom: 140 }}>{renderContent()}</div>
            </ResizeObserver>
          </Skeleton>
        </ScrollBarContainer>
        <div className={classNames(styles.footer)}>
          <div className="dip-flex-space-between">
            <span className={classNames(styles.sign, 'dip-text-color-65 dip-border-radius-10 dip-flex-align-center')}>
              <DipIcon type={planItem.searchType ? planTypes[planItem.searchType]?.icon : ''} />
              <ShinyText
                loading={streamGenerating}
                className="dip-ml-8"
                text={planItem.searchType ? planTypes[planItem.searchType]?.label : ''}
              />
            </span>

            {searchType !== 'summary' && (
              <span className="dip-flex">
                <Tooltip title="过程">
                  <div
                    className={classNames(styles.tabItem, {
                      [styles.tabItemActive]: tabKey === 'process',
                    })}
                    onClick={() => {
                      if (planItem.finished) {
                        autoScrollRef.current = false;
                      } else {
                        autoScrollRef.current = true;
                      }
                      autoSwitchTab.current = false;
                      setTabKey('process');
                    }}
                  />
                </Tooltip>
                <Tooltip title="结果">
                  <div
                    className={classNames(styles.tabItem, {
                      [styles.tabItemActive]: tabKey === 'result',
                    })}
                    onClick={() => {
                      if (planItem.finished) {
                        autoScrollRef.current = false;
                      } else {
                        autoScrollRef.current = true;
                      }
                      autoSwitchTab.current = false;
                      setTabKey('result');
                    }}
                  />
                </Tooltip>
              </span>
            )}

            {renderBtn()}
          </div>
        </div>
      </div>

      <MarkdownEditorModal
        markdownText={planItem.executeResult}
        open={modelProp.open}
        onClose={() => {
          setModalProp(prevState => ({
            ...prevState,
            open: false,
          }));
        }}
        onOk={(value: any) => {
          const newChatList = _.cloneDeep(chatList);
          newChatList[activeChatItemIndex].content[executePlanItemIndex].executeResult = value;
          setDipChatStore({
            chatList: newChatList,
          });
          setModalProp(prevState => ({
            ...prevState,
            open: false,
          }));
        }}
      />

      {contextHolder}
    </div>
  );
};

export default ExploreItem;
